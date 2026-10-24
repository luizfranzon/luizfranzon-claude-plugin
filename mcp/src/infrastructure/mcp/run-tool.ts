import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "../../core/tool";
import { logToolCall, type ToolCallLog } from "../../shared/tool-call-log";
import { errorDetails, failureResult, firstText, successResult } from "./tool-result";

interface Execution {
  result: CallToolResult;
  error?: unknown;
}

async function execute(tool: Tool, args: unknown): Promise<Execution> {
  try {
    return { result: successResult(await tool.execute(args as never)) };
  } catch (error) {
    return { result: failureResult(tool.name, error), error };
  }
}

interface Timing {
  startedAt: Date;
  startedMs: number;
  heapBefore: number;
}

function buildLog(tool: Tool, args: unknown, timing: Timing, { result, error }: Execution): ToolCallLog {
  const memory = process.memoryUsage();
  const details = errorDetails(error);
  return {
    tool: tool.name,
    startedAt: timing.startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Math.round((performance.now() - timing.startedMs) * 1000) / 1000,
    input: args,
    output: firstText(result),
    isError: result.isError === true,
    ...(details && { error: details }),
    memory: { rssBytes: memory.rss, heapUsedDeltaBytes: memory.heapUsed - timing.heapBefore },
  };
}

export async function runTool(
  tool: Tool,
  args: unknown,
  log: (entry: ToolCallLog) => unknown = logToolCall,
): Promise<CallToolResult> {
  const timing: Timing = { startedAt: new Date(), startedMs: performance.now(), heapBefore: process.memoryUsage().heapUsed };
  const execution = await execute(tool, args);
  log(buildLog(tool, args, timing, execution));
  return execution.result;
}
