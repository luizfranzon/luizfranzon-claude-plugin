import { appendFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { logger } from "./logger";

export interface ToolCallLog {
  tool: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  input: unknown;
  output: string;
  isError: boolean;
  error?: string;
  memory: { rssBytes: number; heapUsedDeltaBytes: number };
}

export const toolLogFile = process.env.MCP_LOG_FILE ?? join(homedir(), ".luizfranzon-mcp", "tools.jsonl");

const MAX_LOGGED_CHARS = 2000;

function truncate(text: string): string {
  if (text.length <= MAX_LOGGED_CHARS) return text;
  return `${text.slice(0, MAX_LOGGED_CHARS)}…(+${text.length - MAX_LOGGED_CHARS} chars)`;
}

function truncateInput(input: unknown): unknown {
  const serialized = JSON.stringify(input) ?? "";
  if (serialized.length <= MAX_LOGGED_CHARS) return input;
  return truncate(serialized);
}

export async function logToolCall(entry: ToolCallLog): Promise<void> {
  const line = JSON.stringify({ ...entry, input: truncateInput(entry.input), output: truncate(entry.output) });
  try {
    await mkdir(dirname(toolLogFile), { recursive: true });
    await appendFile(toolLogFile, `${line}\n`);
  } catch (error) {
    logger.error("Falha ao gravar log da ferramenta", error);
  }
}
