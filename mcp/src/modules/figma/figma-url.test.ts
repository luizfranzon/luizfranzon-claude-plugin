import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../../shared/errors";
import { parseFigmaUrl } from "./figma-url";

test("extrai fileKey e converte node-id para o formato da Plugin API", () => {
  assert.deepEqual(
    parseFigmaUrl("https://www.figma.com/design/dv6sjlnqyhpXvLYl0LT5y1/Discord-UI-Kit--Community-?node-id=84-1618&t=x"),
    { fileKey: "dv6sjlnqyhpXvLYl0LT5y1", nodeId: "84:1618" },
  );
  assert.deepEqual(parseFigmaUrl("https://figma.com/file/ABC/x?node-id=I84-1%3B2-3"), { fileKey: "ABC", nodeId: "I84:1;2:3" });
});

test("branch usa a chave do branch; sem node-id não inventa", () => {
  assert.deepEqual(parseFigmaUrl("https://www.figma.com/design/MAIN/branch/BR/Nome"), { fileKey: "BR" });
});

test("recusa URLs que não são de arquivo do Figma", () => {
  for (const url of ["nada", "https://evil.com/design/ABC/x", "https://www.figma.com/files/recent"]) {
    assert.throws(() => parseFigmaUrl(url), AppError);
  }
});
