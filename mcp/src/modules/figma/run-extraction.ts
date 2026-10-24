import { evaluate } from "../../infrastructure/extension/bridge";
import { AppError } from "../../shared/errors";
import { PAGE_SCRIPT } from "./page/page-script.generated";
import type { ExtractOptions, RawExtraction } from "./page/types";

const EXTRACT_TIMEOUT_MS = 120_000;

const pageExpression = (opts: ExtractOptions): string =>
  `(() => {\n${PAGE_SCRIPT}\nreturn FigmaPage.extractInPage(${JSON.stringify(opts)});\n})()`;

export async function extractFromTab(tabId: number, opts: ExtractOptions): Promise<RawExtraction> {
  return (await evaluate(tabId, pageExpression(opts), EXTRACT_TIMEOUT_MS)) as RawExtraction;
}

export function assertExtracted(raw: RawExtraction, nodeId: string, fileKey: string): void {
  if (raw.error === "no-figma") {
    throw new AppError("Não achei a Plugin API do Figma na aba (nem global, nem a VM interna do Inspect). O Figma pode ter mudado o bundle.");
  }
  if (raw.error === "not-found") throw new AppError(`Node ${nodeId} não encontrado no arquivo ${fileKey}.`);
}
