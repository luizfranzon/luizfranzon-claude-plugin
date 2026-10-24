import { homedir } from "node:os";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright-core";
import { randomUserAgent } from "./user-agent";

export { randomUserAgent };

export const browserProfileDir = process.env.MCP_BROWSER_PROFILE ?? join(homedir(), ".luizfranzon-mcp", "browser-profile");

let context: Promise<BrowserContext> | undefined;

async function launch(): Promise<BrowserContext> {
  try {
    const launched = await chromium.launchPersistentContext(browserProfileDir, {
      channel: process.env.MCP_BROWSER_CHANNEL ?? "chrome",
      headless: process.env.MCP_BROWSER_HEADLESS !== "false",
      viewport: { width: 1440, height: 900 },
      userAgent: randomUserAgent(),
    });
    launched.on("close", () => {
      context = undefined;
    });
    return launched;
  } catch (error) {
    context = undefined;
    throw error;
  }
}

const getContext = (): Promise<BrowserContext> => (context ??= launch());

async function launchedContext(): Promise<BrowserContext | undefined> {
  try {
    return await context;
  } catch {
    return undefined;
  }
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const page = await (await getContext()).newPage();
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  const launched = await launchedContext();
  context = undefined;
  await launched?.close();
}
