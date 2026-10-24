import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolResult } from "../../core/tool";
import { AppError } from "../../shared/errors";
import { logger } from "../../shared/logger";

const textResult = (value: string, isError = false): CallToolResult => ({
  content: [{ type: "text", text: value }],
  ...(isError && { isError }),
});

function stringify(output: unknown): string {
  if (typeof output === "string") return output;
  return JSON.stringify(output, null, 2);
}

export function successResult(output: unknown): CallToolResult {
  if (output instanceof ToolResult) {
    const images = output.images.map((image) => ({ type: "image" as const, ...image }));
    return { content: [{ type: "text", text: output.text }, ...images] };
  }
  return textResult(stringify(output));
}

export function failureResult(toolName: string, caught: unknown): CallToolResult {
  if (caught instanceof AppError) return textResult(caught.message, true);
  logger.error(`Falha inesperada em "${toolName}"`, caught);
  return textResult("Erro interno ao executar a ferramenta.", true);
}

export function errorDetails(error: unknown): string | undefined {
  if (error === undefined) return undefined;
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
}

export const firstText = (result: CallToolResult): string => (result.content[0] as { text: string }).text;
