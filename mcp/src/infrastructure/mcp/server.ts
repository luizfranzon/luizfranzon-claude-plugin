import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Tool } from "../../core/tool";
import { runTool } from "./run-tool";

export function createServer(info: { name: string; version: string }, tools: Tool[]): McpServer {
  const server = new McpServer(info);

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.input },
      (args) => runTool(tool, args),
    );
  }

  return server;
}
