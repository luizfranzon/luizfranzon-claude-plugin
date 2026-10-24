import { AppError } from "../../shared/errors";

export interface FigmaTarget {
  fileKey: string;
  nodeId?: string;
}

const FILE_PATH = /^\/(?:design|file|proto)\/([^/]+)(?:\/branch\/([^/]+))?/;
const FIGMA_HOST = /(^|\.)figma\.com$/;

export const normalizeNodeId = (id: string) => id.replaceAll("-", ":");

function toUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new AppError(`URL inválida: ${url}`);
  }
}

export function parseFigmaUrl(url: string): FigmaTarget {
  const parsed = toUrl(url);
  const match = parsed.pathname.match(FILE_PATH);
  if (!FIGMA_HOST.test(parsed.hostname) || !match) {
    throw new AppError(`Não é uma URL de arquivo do Figma: ${url}`);
  }
  const nodeId = parsed.searchParams.get("node-id");
  return { fileKey: match[2] ?? match[1], ...(nodeId && { nodeId: normalizeNodeId(nodeId) }) };
}

export function resolveNodeId(explicit: string | undefined, target: FigmaTarget): string {
  if (explicit) return normalizeNodeId(explicit);
  if (target.nodeId) return target.nodeId;
  throw new AppError("A URL não tem node-id; informe nodeId.");
}
