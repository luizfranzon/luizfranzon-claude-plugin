import type { PageContext } from "./context";
import { readPaints } from "./paints";
import type { RawEffect, RawNode } from "./types";
import { round } from "./util";
import { color } from "./values";
import { styleName, varsOf } from "./variables";

function strokeWeightOf(ctx: PageContext, node: any): number | number[] {
  if (node.strokeWeight !== ctx.f.mixed) return round(node.strokeWeight);
  return [node.strokeTopWeight, node.strokeRightWeight, node.strokeBottomWeight, node.strokeLeftWeight].map(round);
}

export async function readFills(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  if (node.type === "TEXT") return;
  o.fills = await readPaints(ctx, node.fills, node);
  o.fillStyle = await styleName(ctx, node.fillStyleId);
}

export async function readStrokes(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  o.strokes = await readPaints(ctx, node.strokes, node);
  if (!o.strokes) return;
  o.strokeStyle = await styleName(ctx, node.strokeStyleId);
  o.strokeWeight = strokeWeightOf(ctx, node);
  if (node.strokeAlign && node.strokeAlign !== "INSIDE") o.strokeAlign = node.strokeAlign;
  if (node.dashPattern?.length) o.dash = node.dashPattern;
}

export function readCornerRadius(ctx: PageContext, node: any, o: RawNode): void {
  if (!("cornerRadius" in node)) return;
  if (node.cornerRadius === ctx.f.mixed) {
    const corners = [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius];
    if (corners.every((corner) => typeof corner === "number")) o.radius = corners.map(round);
  } else if (node.cornerRadius) {
    o.radius = round(node.cornerRadius);
  }
  if (node.cornerSmoothing) o.smoothing = round(node.cornerSmoothing);
}

async function describeEffect(ctx: PageContext, e: any, node: any): Promise<RawEffect> {
  const effect: RawEffect = { type: e.type, blur: round(e.radius) };
  if (e.color) effect.color = color(e.color);
  if (e.offset) {
    effect.x = round(e.offset.x);
    effect.y = round(e.offset.y);
  }
  if (e.spread) effect.spread = round(e.spread);
  effect.vars = await varsOf(ctx, e.boundVariables, node);
  return effect;
}

export async function readEffects(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  const effects: RawEffect[] = [];
  for (const e of node.effects ?? []) {
    if (e.visible === false) continue;
    effects.push(await describeEffect(ctx, e, node));
  }
  if (effects.length === 0) return;
  o.effects = effects;
  o.effectStyle = await styleName(ctx, node.effectStyleId);
}
