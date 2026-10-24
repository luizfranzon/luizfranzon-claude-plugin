import assert from "node:assert/strict";
import { test } from "node:test";
import { defineTool, ToolResult } from "../../core/tool";
import { AppError } from "../../shared/errors";
import type { ToolCallLog } from "../../shared/tool-call-log";
import { runTool } from "./run-tool";

const noLog = () => {};

const toolThat = (execute: () => Promise<unknown>) =>
  defineTool({ name: "t", description: "t", input: {}, execute });

test("serializa objetos como JSON", async () => {
  const result = await runTool(toolThat(async () => ({ ok: 1 })), {}, noLog);
  assert.deepEqual(result, { content: [{ type: "text", text: '{\n  "ok": 1\n}' }] });
});

test("ToolResult anexa imagens depois do texto", async () => {
  const result = await runTool(toolThat(async () => new ToolResult("oi", [{ data: "AAA", mimeType: "image/png" }])), {}, noLog);
  assert.deepEqual(result.content, [
    { type: "text", text: "oi" },
    { type: "image", data: "AAA", mimeType: "image/png" },
  ]);
});

test("AppError vira isError com a mensagem original", async () => {
  const result = await runTool(toolThat(async () => { throw new AppError("não encontrado"); }), {}, noLog);
  assert.deepEqual(result, { content: [{ type: "text", text: "não encontrado" }], isError: true });
});

test("registra input, output, tempo e memória da chamada", async () => {
  const entries: ToolCallLog[] = [];
  await runTool(toolThat(async () => { throw new Error("segredo"); }), { a: 1 }, (e) => entries.push(e));
  const [entry] = entries;
  assert.equal(entry.tool, "t");
  assert.deepEqual(entry.input, { a: 1 });
  assert.equal(entry.output, "Erro interno ao executar a ferramenta.");
  assert.equal(entry.isError, true);
  assert.match(entry.error!, /segredo/);
  assert.ok(entry.durationMs >= 0);
  assert.ok(entry.memory.rssBytes > 0);
  assert.ok(Date.parse(entry.finishedAt) >= Date.parse(entry.startedAt));
});

test("erro inesperado não vaza detalhes", async () => {
  const result = await runTool(toolThat(async () => { throw new Error("segredo"); }), {}, noLog);
  assert.equal(result.isError, true);
  assert.doesNotMatch(JSON.stringify(result), /segredo/);
});
