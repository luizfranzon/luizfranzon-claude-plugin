import type { PageContext } from "./context";
import type { RawPaint } from "./types";
import { isAlias, round } from "./util";
import { color } from "./values";
import { varRef } from "./variables";

const percent = (position: number) => `${Math.round(position * 100)}%`;

function describePaint(p: any): RawPaint {
  const paint: RawPaint = { type: p.type };
  if (p.type === "SOLID") paint.color = color(p.color, p.opacity ?? 1);
  if (p.type.startsWith("GRADIENT")) {
    paint.stops = p.gradientStops.map((stop: any) => `${color(stop.color)} ${percent(stop.position)}`);
    if (p.opacity < 1) paint.opacity = round(p.opacity);
  }
  if (p.type === "IMAGE" || p.type === "VIDEO") {
    paint.scaleMode = p.scaleMode;
    paint.hash = p.imageHash ?? p.videoHash;
    if (p.opacity < 1) paint.opacity = round(p.opacity);
  }
  if (p.blendMode && p.blendMode !== "NORMAL") paint.blend = p.blendMode;
  return paint;
}

export async function readPaints(ctx: PageContext, list: any, node: any): Promise<RawPaint[] | undefined> {
  if (!Array.isArray(list)) return undefined;
  const paints: RawPaint[] = [];
  for (const p of list) {
    if (p.visible === false) continue;
    const paint = describePaint(p);
    if (isAlias(p.boundVariables?.color)) paint.var = await varRef(ctx, p.boundVariables.color, node);
    paints.push(paint);
  }
  if (paints.length === 0) return undefined;
  return paints;
}
