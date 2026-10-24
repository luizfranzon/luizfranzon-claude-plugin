import { evaluate, listTabs, openTab } from "../../infrastructure/extension/bridge";
import { sleep } from "../../shared/async";
import { AppError } from "../../shared/errors";
import { parseFigmaUrl } from "./figma-url";

const TAB_LOAD_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1000;

const EDITOR_READY =
  '!!(globalThis.figma || (Object.keys(globalThis).some((k) => /^(rspack|webpack)Chunk/.test(k)) && document.querySelector("canvas")))';

function isSameFile(tabUrl: string | undefined, fileKey: string): boolean {
  try {
    return parseFigmaUrl(tabUrl ?? "").fileKey === fileKey;
  } catch {
    return false;
  }
}

async function isEditorReady(tabId: number): Promise<boolean> {
  try {
    return Boolean(await evaluate(tabId, EDITOR_READY));
  } catch {
    return false;
  }
}

async function resolveTabId(url: string, fileKey: string): Promise<number> {
  const tabs = await listTabs();
  const existing = tabs.find((tab) => isSameFile(tab.url, fileKey));
  if (existing) return existing.id;
  const opened = await openTab(url);
  return opened.id;
}

async function waitUntilReady(tabId: number): Promise<void> {
  const deadline = Date.now() + TAB_LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isEditorReady(tabId)) return;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new AppError(`O arquivo do Figma não carregou em ${TAB_LOAD_TIMEOUT_MS / 1000}s na aba ${tabId}. Está logado no Chrome?`);
}

export async function figmaTab(url: string, fileKey: string): Promise<number> {
  const tabId = await resolveTabId(url, fileKey);
  await waitUntilReady(tabId);
  return tabId;
}
