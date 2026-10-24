import type { VarRef } from "./types";
import { isAlias, round } from "./util";

export function color(c: any, alpha = 1): string {
  const channels = [c.r, c.g, c.b].map((v: number) => Math.round(v * 255).toString(16).padStart(2, "0"));
  const hex = `#${channels.join("").toUpperCase()}`;
  const opacity = round(alpha * (c.a ?? 1));
  if (opacity >= 1) return hex;
  return `${hex} ${Math.round(opacity * 100)}%`;
}

export function plainValue(v: any): VarRef["value"] {
  if (v && typeof v === "object" && "r" in v) return color(v);
  if (typeof v === "number") return round(v);
  if (isAlias(v)) return undefined;
  return v;
}

export function lengthUnit(v: any): string {
  if (!v || v.unit === "AUTO") return "auto";
  if (v.unit === "PERCENT") return `${round(v.value)}%`;
  return `${round(v.value)}px`;
}
