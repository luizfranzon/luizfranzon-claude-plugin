import type { RawExtraction } from "../page/types";
import { componentLines } from "./components-section";
import { createFormatContext, type FormatContext } from "./context";
import { quote, section } from "./syntax";
import { tokenLines } from "./tokens";
import { renderNode } from "./tree";

export const NOT_EXTRACTED =
  "vector geometry (paths), export settings, layout grids, image bytes (hash only), prototype transitions/animations";

const LEGEND =
  'legend: TYPE "name" id @x,y(rel. parent) WxH · fill/stroke=pN · text=tN · fx=eN · comp=kN · icon · {collection/variable=resolved} · ' +
  "~ = instance override [fields] · +N cut:reason = children not shown (raise depth/maxNodes, expandInstances, or pass nodeId) · " +
  "children are listed bottom→top (z-order) · clip = clips content · component bodies (under kN) are shown once, instances only reference them";

const header = (raw: RawExtraction): string =>
  `figma ${raw.file?.key ?? "?"} ${quote(raw.file?.name ?? "")} page=${quote(raw.page ?? "?")} root=${raw.root!.id}`;

function definitionSections(ctx: FormatContext, components: string[]): string[] {
  return [
    ...section("paints", ctx.paints.lines),
    ...section("text", ctx.texts.lines),
    ...section("effects", ctx.effects.lines),
    ...section("icons", ctx.icons.lines),
    ...section("components", components),
  ];
}

function footer(raw: RawExtraction): string[] {
  const unreadable = section("unreadable", (raw.unreadable ?? []).map((line) => `  ${line}`));
  return [`stats: ${raw.extracted}/${raw.total} nodes`, ...unreadable, `not extracted: ${NOT_EXTRACTED}`];
}

export function formatExtraction(raw: RawExtraction): string {
  const ctx = createFormatContext(raw);
  const tree: string[] = [];
  renderNode(ctx, raw.root!, 0, tree);
  const components = componentLines(ctx);

  const lines = [
    header(raw),
    LEGEND,
    ...definitionSections(ctx, components),
    "tree:",
    ...tree,
    ...section("tokens", tokenLines(raw)),
    ...section("flow", ctx.flow),
    ...footer(raw),
  ];
  const text = lines.join("\n");
  return `${text}\nsize: ${text.length} chars (~${Math.round(text.length / 3.5)} tokens)`;
}
