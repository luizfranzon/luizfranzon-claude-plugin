import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../package.json" with { type: "json" };
import { closeBrowser } from "./infrastructure/browser/browser";
import { startExtensionBridge, stopExtensionBridge } from "./infrastructure/extension/bridge";
import { createServer } from "./infrastructure/mcp/server";
import { tools } from "./modules";
import { logger } from "./shared/logger";

async function shutdown(): Promise<void> {
  try {
    await Promise.all([closeBrowser(), stopExtensionBridge()]);
  } finally {
    process.exit(0);
  }
}

async function startBridgeIfFree(): Promise<void> {
  try {
    await startExtensionBridge();
  } catch {
    return;
  }
}

const server = createServer({ name: pkg.name, version: pkg.version }, tools);
server.server.onclose = shutdown;
process.stdin.on("end", shutdown);
await server.connect(new StdioServerTransport());
await startBridgeIfFree();
logger.info(`${pkg.name} v${pkg.version} pronto com ${tools.length} ferramenta(s)`);
