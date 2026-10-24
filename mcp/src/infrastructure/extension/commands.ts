import { AppError } from "../../shared/errors";
import { callExtension } from "./call";

export interface ChromeTab {
  id: number;
  windowId: number;
  active: boolean;
  url: string;
  title: string;
}

interface Evaluation {
  result: { objectId?: string; value?: unknown };
  exceptionDetails?: { text: string; exception?: { description?: string } };
}

export const listTabs = () => callExtension("tabs") as Promise<ChromeTab[]>;

export const cdp = (tabId: number, method: string, params?: object, timeoutMs?: number) =>
  callExtension("cdp", { tabId, method, params }, timeoutMs) as Promise<any>;

export const openTab = (url: string) => callExtension("openTab", { url }) as Promise<ChromeTab>;

async function settleRemoteObject(tabId: number, evaluation: Evaluation, timeoutMs?: number): Promise<Evaluation> {
  if (evaluation.exceptionDetails || !evaluation.result.objectId) return evaluation;
  return cdp(tabId, "Runtime.callFunctionOn", {
    objectId: evaluation.result.objectId,
    functionDeclaration: "async function () { return await this; }",
    awaitPromise: true,
    returnByValue: true,
  }, timeoutMs);
}

export async function evaluate(tabId: number, expression: string, timeoutMs?: number): Promise<unknown> {
  const first: Evaluation = await cdp(tabId, "Runtime.evaluate", { expression, awaitPromise: true, replMode: true }, timeoutMs);
  const { result, exceptionDetails } = await settleRemoteObject(tabId, first, timeoutMs);
  if (exceptionDetails) throw new AppError(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}
