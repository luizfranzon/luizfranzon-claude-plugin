import type { RawComponent, RawExtraction, RawPaint } from "../page/types";
import { Defs } from "./defs";
import { paint } from "./describe";
import { styleSuffix } from "./syntax";

export interface QueuedComponent {
  id: string;
  key: string;
}

export interface FormatContext {
  raw: RawExtraction;
  paints: Defs;
  texts: Defs;
  effects: Defs;
  icons: Defs;
  comps: Defs;
  compInfo: Map<string, RawComponent>;
  setFirst: Map<string, string>;
  queue: QueuedComponent[];
  queued: Set<string>;
  flow: string[];
}

export function createFormatContext(raw: RawExtraction): FormatContext {
  return {
    raw,
    paints: new Defs("p"),
    texts: new Defs("t"),
    effects: new Defs("e"),
    icons: new Defs("i"),
    comps: new Defs("k"),
    compInfo: new Map(),
    setFirst: new Map(),
    queue: [],
    queued: new Set(),
    flow: [],
  };
}

export function paintRef(ctx: FormatContext, list?: RawPaint[], styleName?: string): string | undefined {
  if (!list) return undefined;
  return ctx.paints.ref([list, styleName], () => list.map(paint).join(" + ") + styleSuffix(styleName));
}
