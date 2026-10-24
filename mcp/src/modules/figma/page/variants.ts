import type { PageContext } from "./context";
import type { RawVariantSet, VariantDiff } from "./types";
import { joinPath, localName, uniqueSegment } from "./util";

const MAX_SNAPSHOT_NODES = 41;
const MAX_VARIANTS = 16;
const MAX_DIFFS = 8;
const ICON_SIZE = 64;

type Snapshot = Map<string, Record<string, unknown>>;

function collectNodes(top: any): { node: any; path: string }[] {
  const nodes: { node: any; path: string }[] = [];
  const occurrences = new Map<string, number>();
  const visit = (node: any, path: string) => {
    if (nodes.length >= MAX_SNAPSHOT_NODES) return;
    nodes.push({ node, path });
    for (const child of node.children ?? []) {
      const name = localName(child, node);
      const key = joinPath(path, name);
      const occurrence = (occurrences.get(key) ?? 0) + 1;
      occurrences.set(key, occurrence);
      visit(child, joinPath(path, uniqueSegment(name, occurrence)));
    }
  };
  visit(top, "");
  return nodes;
}

function rootSize(path: string, o: any): Record<string, unknown> {
  if (path !== "") return {};
  return { w: o.w, h: o.h };
}

function visualFields(path: string, o: any): Record<string, unknown> {
  const text = o.text?.segments[0];
  return {
    ...rootSize(path, o),
    fills: o.fills,
    strokes: o.strokes,
    strokeWeight: o.strokes && o.strokeWeight,
    radius: o.radius,
    opacity: o.opacity,
    effects: o.effects,
    layout: o.layout,
    text: text && { family: text.family, weight: text.weight, size: text.size, lineHeight: text.lineHeight, fills: text.fills },
  };
}

async function snapshot(ctx: PageContext, top: any): Promise<Snapshot> {
  const result: Snapshot = new Map();
  for (const { node, path } of collectNodes(top)) {
    result.set(path, visualFields(path, await ctx.hooks.readLight(node)));
  }
  return result;
}

function diffSnapshots(base: Snapshot, current: Snapshot): VariantDiff[] {
  const diffs: VariantDiff[] = [];
  let added = 0;
  let removed = 0;
  for (const [path, fields] of current) {
    const previous = base.get(path);
    if (!previous) {
      added++;
      continue;
    }
    for (const field of Object.keys(fields)) {
      if (JSON.stringify(fields[field]) !== JSON.stringify(previous[field])) diffs.push({ path, field, value: fields[field] });
    }
  }
  for (const path of base.keys()) {
    if (!current.has(path)) removed++;
  }
  if (added || removed) diffs.push({ path: "", field: "nodes", value: `+${added}/-${removed}` });
  return diffs;
}

const parseVariantName = (name: string): Map<string, string> =>
  new Map(name.split(", ").map((pair) => pair.split("=") as [string, string]));

function differsInOneProperty(baseProps: Map<string, string>, name: string): boolean {
  const differing = [...parseVariantName(name)].filter(([key, value]) => baseProps.get(key) !== value);
  return differing.length === 1;
}

function comparableVariants(main: any, set: any): any[] {
  const others = set.children.filter((child: any) => child.id !== main.id);
  if (!others.some((child: any) => child.name.includes("="))) return others.slice(0, MAX_VARIANTS);
  const baseProps = parseVariantName(main.name);
  return others.filter((child: any) => differsInOneProperty(baseProps, child.name)).slice(0, MAX_VARIANTS);
}

export async function compareVariants(ctx: PageContext, main: any, set: any): Promise<RawVariantSet> {
  const variants: RawVariantSet["variants"] = [];
  if (main.width <= ICON_SIZE && main.height <= ICON_SIZE) return { base: main.name, variants };
  const base = await snapshot(ctx, main);
  for (const variant of comparableVariants(main, set)) {
    const diffs = diffSnapshots(base, await snapshot(ctx, variant));
    variants.push({ name: variant.name, diffs: diffs.slice(0, MAX_DIFFS), more: Math.max(0, diffs.length - MAX_DIFFS) });
  }
  return { base: main.name, variants };
}
