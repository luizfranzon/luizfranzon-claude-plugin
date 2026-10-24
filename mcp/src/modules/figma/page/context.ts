import type { ExtractOptions, RawIcon, RawNode, RawVariantSet } from "./types";
import { errText, safely } from "./util";

export interface Budget {
  count: number;
  max: number;
}

export interface SvgJob {
  icon: RawIcon;
  node: any;
}

export interface PageContext {
  f: any;
  root: any;
  opts: ExtractOptions;
  unreadable: string[];
  cache: Map<string, Promise<any>>;
  mains: Map<string, any>;
  defs: Record<string, RawNode>;
  variantSets: Record<string, RawVariantSet>;
  svgJobs: SvgJob[];
  svgTotal: number;
  budget: Budget;
  defBudget: Budget;
  hooks: { readLight(node: any): Promise<RawNode> };
}

export function createContext(f: any, root: any, opts: ExtractOptions): PageContext {
  return {
    f,
    root,
    opts,
    unreadable: [],
    cache: new Map(),
    mains: new Map(),
    defs: {},
    variantSets: {},
    svgJobs: [],
    svgTotal: 0,
    budget: { count: 0, max: opts.maxNodes },
    defBudget: { count: 0, max: opts.maxNodes },
    hooks: { readLight: async () => ({ id: "", name: "", type: "" }) },
  };
}

export function cached<T>(ctx: PageContext, key: string, load: () => Promise<T>): Promise<T | undefined> {
  const existing = ctx.cache.get(key);
  if (existing) return existing;
  const loading = safely(load);
  ctx.cache.set(key, loading);
  return loading;
}

export async function read(ctx: PageContext, node: any, prop: string, fn: () => unknown): Promise<void> {
  try {
    await fn();
  } catch (error: any) {
    ctx.unreadable.push(`${node.id}.${prop}: ${errText(error)}`);
  }
}
