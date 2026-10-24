import { defineTool, ToolResult } from "../../core/tool";
import { FIGMA_EXTRACT_DESCRIPTION, figmaExtractInput } from "./figma-extract.input";
import { figmaTab } from "./figma-tab";
import { parseFigmaUrl, resolveNodeId } from "./figma-url";
import { formatExtraction } from "./format";
import type { RawExtraction } from "./page/types";
import { assertExtracted, extractFromTab } from "./run-extraction";

const MAX_TEXT_LENGTH = 300;

function renderResult(raw: RawExtraction, startedAt: number): string | ToolResult {
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const text = `${formatExtraction(raw)}\ntime: ${seconds}s`;
  if (!raw.image) return text;
  return new ToolResult(text, [{ data: raw.image, mimeType: "image/png" }]);
}

export const figmaExtractTool = defineTool({
  name: "figma_extract",
  title: "Extrair design de um node do Figma",
  description: FIGMA_EXTRACT_DESCRIPTION,
  input: figmaExtractInput,
  async execute({ url, nodeId, ...options }) {
    const startedAt = Date.now();
    const target = parseFigmaUrl(url);
    const id = resolveNodeId(nodeId, target);
    const tabId = await figmaTab(url, target.fileKey);
    const raw = await extractFromTab(tabId, { nodeId: id, ...options, maxTextLength: MAX_TEXT_LENGTH });
    assertExtracted(raw, id, target.fileKey);
    return renderResult(raw, startedAt);
  },
});
