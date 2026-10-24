import type { RawComponent, RawEffect, RawPaint, RawTextStyle } from "../page/types";
import { lower, pairs, quote, styleSuffix, suffix, varLabel, varsText } from "./syntax";

const EFFECT_NAMES: Record<string, string> = {
  DROP_SHADOW: "drop",
  INNER_SHADOW: "inner",
  LAYER_BLUR: "blur",
  BACKGROUND_BLUR: "bg-blur",
};

function paintBody(p: RawPaint): string {
  if (p.type === "SOLID") return p.color!;
  if (p.stops) return `${lower(p.type)}(${p.stops.join(", ")})`;
  if (p.hash !== undefined) return `${lower(p.type)}(${lower(p.scaleMode ?? "")} ${p.hash.slice(0, 10)})`;
  return lower(p.type);
}

export function paint(p: RawPaint): string {
  let out = paintBody(p);
  if (p.opacity !== undefined) out += ` op=${p.opacity}`;
  if (p.blend) out += ` ${lower(p.blend)}`;
  return out + varLabel(p.var);
}

export const barePaint = (p: RawPaint): string => paint({ ...p, var: p.var && { name: p.var.name } });

function effectBody(e: RawEffect): string {
  if (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW") return `${e.blur}`;
  return `${e.color} ${e.x},${e.y} blur${e.blur}${suffix(e.spread && `spread${e.spread}`)}`;
}

export function effect(e: RawEffect): string {
  const name = EFFECT_NAMES[e.type] ?? lower(e.type);
  return `${name}(${effectBody(e)})${suffix(varsText(e.vars))}`;
}

export function textStyle(t: RawTextStyle): string {
  let out = `${t.family} ${t.style} ${t.weight} ${t.size}px lh=${t.lineHeight} ls=${t.letterSpacing}`;
  if (t.decoration) out += ` ${lower(t.decoration)}`;
  if (t.case) out += ` case=${lower(t.case)}`;
  return out + styleSuffix(t.textStyle) + suffix(varsText(t.vars));
}

export function padding([top, right, bottom, left]: number[]): string | undefined {
  if (!top && !right && !bottom && !left) return undefined;
  if (top === right && right === bottom && bottom === left) return `${top}`;
  if (top === bottom && right === left) return `${top},${right}`;
  return `${top},${right},${bottom},${left}`;
}

export function describeComponent(c: RawComponent, id: string, setFirst: Map<string, string>): string {
  let out = quote(c.name);
  if (c.variant) out += ` variant{${pairs(c.variant, "=", ", ")}}`;
  if (c.remote) out += " remote";
  if (c.key) out += ` key=${c.key}`;
  const first = c.setId && setFirst.get(c.setId);
  if (first) return `${out} set=${first}`;
  if (c.setId) setFirst.set(c.setId, id);
  if (c.defs) out += ` props{${pairs(c.defs, ": ", "; ")}}`;
  if (c.description) out += ` desc=${quote(c.description)}`;
  return out;
}
