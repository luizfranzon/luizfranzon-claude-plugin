import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { WebSocket } from "ws";
import { AppError } from "../../shared/errors";
import { sleep } from "../../shared/async";
import { evaluate, extensionStatus, listTabs, startExtensionBridge, stopExtensionBridge } from "./bridge";
import { EXPECTED_EXTENSION_VERSION } from "./version";

let url: string;
before(async () => (url = `ws://127.0.0.1:${await startExtensionBridge(0)}`));
after(stopExtensionBridge);

async function fakeExtension(reply: (msg: any) => object) {
  const ws = new WebSocket(url, { origin: "chrome-extension://abc" });
  ws.on("message", (data) => {
    const msg = JSON.parse(String(data));
    ws.send(JSON.stringify({ id: msg.id, ...reply(msg) }));
  });
  await once(ws, "open");
  return ws;
}

test("recusa conexões que não vêm de uma extensão", async () => {
  const ws = new WebSocket(url, { origin: "https://site-malicioso.com" });
  const [error] = await once(ws, "error");
  assert.match(String(error), /401|ECONNRESET/);
});

test("repassa chamadas e devolve o resultado", async () => {
  const ws = await fakeExtension((msg) => {
    if (msg.method === "tabs") return { result: [{ id: 1, url: "https://x.com" }] };
    return { result: { result: { value: msg.params.params.expression.length } } };
  });
  assert.deepEqual(await listTabs(), [{ id: 1, url: "https://x.com" }]);
  assert.equal(await evaluate(1, "1+1"), 3);
  ws.close();
});

test("objeto ou Promise por referência é aguardado e serializado", async () => {
  const methods: string[] = [];
  const ws = await fakeExtension((msg) => {
    methods.push(msg.params.method);
    if (msg.params.method === "Runtime.evaluate") {
      return { result: { result: { type: "object", subtype: "promise", objectId: "obj-1" } } };
    }
    return { result: { result: { value: { ok: msg.params.params.objectId } } } };
  });
  assert.deepEqual(await evaluate(1, "(async () => 1)()"), { ok: "obj-1" });
  assert.deepEqual(methods, ["Runtime.evaluate", "Runtime.callFunctionOn"]);
  ws.close();
});

test("erro da extensão e exceção na página viram AppError", async () => {
  let call = 0;
  const ws = await fakeExtension(() => {
    call++;
    if (call === 1) return { error: "No tab with id: 9" };
    return { result: { exceptionDetails: { text: "Uncaught", exception: { description: "ReferenceError: x" } } } };
  });
  await assert.rejects(evaluate(9, "x"), (e) => e instanceof AppError && e.message === "No tab with id: 9");
  await assert.rejects(evaluate(9, "x"), (e) => e instanceof AppError && e.message === "ReferenceError: x");
  ws.close();
});

async function connectAndGreet(version?: string) {
  const ws = new WebSocket(url, { origin: "chrome-extension://abc" });
  await once(ws, "open");
  if (version) ws.send(JSON.stringify({ type: "hello", version }));
  await sleep(50);
  return ws;
}

test("hello com a versão esperada deixa a extensão em dia", async () => {
  const ws = await connectAndGreet(EXPECTED_EXTENSION_VERSION);
  assert.deepEqual(extensionStatus(), { connected: true, version: EXPECTED_EXTENSION_VERSION, expected: EXPECTED_EXTENSION_VERSION, upToDate: true });
  ws.close();
});

test("versão diferente ou ausente marca a extensão como desatualizada", async () => {
  const outdated = await connectAndGreet("0.0.1");
  assert.equal(extensionStatus().version, "0.0.1");
  assert.equal(extensionStatus().upToDate, false);
  outdated.close();

  const silent = await connectAndGreet();
  assert.equal(extensionStatus().version, undefined);
  assert.equal(extensionStatus().upToDate, false);
  silent.close();
});
