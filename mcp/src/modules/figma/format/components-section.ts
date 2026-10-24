import type { FormatContext } from "./context";
import { renderNode } from "./tree";
import { variantLines } from "./variants-section";

const COMPONENT_BODY_DEPTH = 2;

function renderBodies(ctx: FormatContext): Map<string, string[]> {
  const bodies = new Map<string, string[]>();
  for (let index = 0; index < ctx.queue.length; index++) {
    const { id, key } = ctx.queue[index];
    const body: string[] = [];
    renderNode(ctx, ctx.raw.componentDefs![key], COMPONENT_BODY_DEPTH, body);
    bodies.set(id, body);
  }
  return bodies;
}

function variantsFor(ctx: FormatContext, id: string, printedSets: Map<string, string>): string[] {
  const setId = ctx.compInfo.get(id)?.setId;
  const set = setId && ctx.raw.variantSets?.[setId];
  if (!set || set.variants.length === 0) return [];
  const first = printedSets.get(setId);
  if (first) return [`    variants: see ${first}`];
  printedSets.set(setId, id);
  return variantLines(set);
}

export function componentLines(ctx: FormatContext): string[] {
  const bodies = renderBodies(ctx);
  const printedSets = new Map<string, string>();
  return ctx.comps.entries.flatMap(([id, line]) => [line, ...variantsFor(ctx, id, printedSets), ...(bodies.get(id) ?? [])]);
}
