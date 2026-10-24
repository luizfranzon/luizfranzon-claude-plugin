import type { Tool } from "../core/tool";
import { chromeEvalTool, chromeStatusTool, chromeTabsTool } from "./chrome/chrome.tools";
import { figmaExtractTool } from "./figma/figma.tool";
import { pingTool } from "./ping/ping.tool";

export const tools: Tool[] = [pingTool, chromeStatusTool, chromeTabsTool, chromeEvalTool, figmaExtractTool];
