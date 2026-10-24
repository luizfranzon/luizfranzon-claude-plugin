import type { RawPaint, RawVariantSet, VariantDiff } from "../page/types";
import { barePaint, effect, padding } from "./describe";
import { lower, quote, suffix } from "./syntax";

type Fills = RawPaint[];

function describeText(value: any): string {
  const fills = suffix(value.fills && `fill=${(value.fills as Fills).map(barePaint).join("+")}`);
  return `${value.family} ${value.weight} ${value.size}px lh=${value.lineHeight}${fills}`;
}

function describeLayout(value: any): string {
  return `${lower(value.mode)} gap=${value.gap} pad=${padding(value.pad) ?? 0}`;
}

function diffValue(field: string, value: any): string {
  if (value === undefined || value === null) return "none";
  if (field === "fills" || field === "strokes") return (value as Fills).map(barePaint).join("+");
  if (field === "effects") return value.map((e: any) => effect({ ...e, vars: undefined })).join("+");
  if (field === "layout") return describeLayout(value);
  if (field === "text") return describeText(value);
  return [value].flat().join(",");
}

const isRedundant = (diff: VariantDiff): boolean => diff.field === "strokeWeight" && diff.value == null;

function describeDiff(diff: VariantDiff): string {
  const path = diff.path && `${diff.path}.`;
  return `${path}${diff.field}=${diffValue(diff.field, diff.value)}`;
}

function variantLine(variant: RawVariantSet["variants"][number]): string {
  const diffs = variant.diffs.filter((diff) => !isRedundant(diff)).map(describeDiff);
  if (variant.more) diffs.push(`+${variant.more} more`);
  return `      ${variant.name}: ${diffs.join(" · ") || "same"}`;
}

export function variantLines(set: RawVariantSet): string[] {
  return [`    variants (diff vs ${quote(set.base)}):`, ...set.variants.map(variantLine)];
}
