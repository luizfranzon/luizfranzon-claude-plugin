import type { RawNode, VarRef } from "../page/types";
import { registerComponent } from "./component-registry";
import { paintRef, type FormatContext } from "./context";
import { effect, padding, textStyle } from "./describe";
import { NodeVars, PADDING_KEYS, RADIUS_KEYS } from "./node-vars";
import { lower, pairs, propLiteral, quote, styleSuffix, suffix, varNameOnly } from "./syntax";

const LAYOUT_MODES: Record<string, string> = { HORIZONTAL: "row", VERTICAL: "col" };

function geometryAttrs(n: RawNode): string[] {
  const attrs: string[] = [];
  if (n.x !== undefined) attrs.push(`@${n.x},${n.y}`);
  if (n.w !== undefined) attrs.push(`${n.w}x${n.h}`);
  if (n.rotation) attrs.push(`rot=${n.rotation}`);
  if (n.opacity !== undefined) attrs.push(`op=${n.opacity}`);
  if (n.blend) attrs.push(lower(n.blend));
  if (n.mask) attrs.push("mask");
  return attrs;
}

function paintAttrs(ctx: FormatContext, n: RawNode): string[] {
  const attrs: string[] = [];
  const fill = paintRef(ctx, n.fills, n.fillStyle);
  if (fill) attrs.push(`fill=${fill}`);
  const stroke = paintRef(ctx, n.strokes, n.strokeStyle);
  if (!stroke) return attrs;
  const weight = [n.strokeWeight].flat().join(",");
  attrs.push(`stroke=${stroke}/${weight}${suffix(n.strokeAlign && `/${lower(n.strokeAlign)}`, "")}`);
  if (n.dash) attrs.push(`dash=${n.dash.join(",")}`);
  return attrs;
}

function radiusVar(n: RawNode, vars: NodeVars): VarRef | undefined {
  if (Array.isArray(n.radius)) return undefined;
  return vars.takeSame(RADIUS_KEYS);
}

function shapeAttrs(ctx: FormatContext, n: RawNode, vars: NodeVars): string[] {
  const attrs: string[] = [];
  if (n.radius !== undefined) {
    attrs.push(`r=${[n.radius].flat().join(",")}${varNameOnly(radiusVar(n, vars))}`);
  }
  if (n.smoothing) attrs.push(`smooth=${n.smoothing}`);
  if (!n.effects) return attrs;
  const effects = n.effects;
  const id = ctx.effects.ref([effects, n.effectStyle], () => effects.map(effect).join(" + ") + styleSuffix(n.effectStyle));
  attrs.push(`fx=${id}`);
  return attrs;
}

function layoutAttrs(n: RawNode, vars: NodeVars): string[] {
  const layout = n.layout;
  if (!layout) return [];
  const attrs: string[] = [LAYOUT_MODES[layout.mode] ?? lower(layout.mode)];
  if (layout.wrap) attrs.push("wrap");
  const gapRef = vars.take("itemSpacing");
  if (layout.gap || gapRef) attrs.push(`gap=${layout.gap}${varNameOnly(gapRef)}`);
  if (layout.crossGap) attrs.push(`crossGap=${layout.crossGap}`);
  const pad = layout.pad && padding(layout.pad);
  if (pad) attrs.push(`pad=${pad}${varNameOnly(vars.takeSame(PADDING_KEYS))}`);
  if (layout.main && layout.main !== "MIN") attrs.push(`main=${lower(layout.main)}`);
  if (layout.cross && layout.cross !== "MIN") attrs.push(`cross=${lower(layout.cross)}`);
  return attrs;
}

function placementAttrs(n: RawNode): string[] {
  const attrs: string[] = [];
  if (n.sizing) attrs.push(`sz=${n.sizing.map(lower).join("/")}`);
  if (n.absolute) attrs.push("abs");
  if (n.grow) attrs.push(`grow=${n.grow}`);
  if (n.constraints) attrs.push(`cons=${lower(n.constraints)}`);
  if (n.clip) attrs.push("clip");
  if (n.limits) attrs.push(Object.entries(n.limits).map(([key, value]) => `${key}=${value}`).join(" "));
  return attrs;
}

function variableAttrs(n: RawNode, vars: NodeVars): string[] {
  if (n.layout) {
    const horizontal = vars.takeSame(["paddingLeft", "paddingRight"]);
    const vertical = vars.takeSame(["paddingTop", "paddingBottom"]);
    if (horizontal) vars.set("padX", horizontal);
    if (vertical) vars.set("padY", vertical);
  }
  const rest = vars.render();
  if (!rest) return [];
  return [`vars{${rest}}`];
}

function componentAttrs(ctx: FormatContext, n: RawNode): string[] {
  const attrs: string[] = [];
  if (n.component) attrs.push(`comp=${registerComponent(ctx, n.component)}`);
  if (n.props) {
    const props = Object.entries(n.props).map(([key, value]) => `${key}=${propLiteral(value)}`);
    attrs.push(`props{${props.join(", ")}}`);
  }
  if (n.propDefs) attrs.push(`defs{${pairs(n.propDefs, ": ", "; ")}}`);
  return attrs;
}

function iconAttrs(ctx: FormatContext, n: RawNode): string[] {
  const icon = n.icon;
  if (!icon) return [];
  const attrs: string[] = [];
  const svg = icon.svg;
  if (svg) attrs.push(`icon=${ctx.icons.ref([icon.name, svg], () => `${quote(icon.name)} ${svg}`)}`);
  else attrs.push(`icon=${quote(icon.name)}`);
  if (icon.svgCut) attrs.push(`svg=cut(${icon.svgCut})`);
  const fill = paintRef(ctx, icon.fills);
  if (fill) attrs.push(`icon-fill=${fill}`);
  const stroke = paintRef(ctx, icon.strokes);
  if (stroke) attrs.push(`icon-stroke=${stroke}${suffix(icon.strokeWeight && [icon.strokeWeight].flat().join(","), "/")}`);
  return attrs;
}

type Segment = NonNullable<RawNode["text"]>["segments"][number];

function segmentAttr(ctx: FormatContext, segment: Segment): string {
  const { start, end, fills, fillStyle, ...style } = segment;
  const fill = paintRef(ctx, fills, fillStyle);
  return `text=${ctx.texts.ref(style, () => textStyle(style))}${suffix(fill && `fill=${fill}`)}`;
}

function textAttrs(ctx: FormatContext, n: RawNode): string[] {
  const text = n.text;
  if (!text) return [];
  const attrs: string[] = [];
  if (text.segments.length === 1) attrs.push(segmentAttr(ctx, text.segments[0]));
  if (text.align) attrs.push(`align=${lower(text.align)}`);
  if (text.valign) attrs.push(`valign=${lower(text.valign)}`);
  if (text.autoResize) attrs.push(`resize=${lower(text.autoResize)}`);
  attrs.push(quote(text.chars) + suffix(text.cut && `…(+${text.cut} chars)`, ""));
  if (text.segments.length > 1) {
    const segments = text.segments.map((s) => `${s.start}-${s.end} ${segmentAttr(ctx, s)}`);
    attrs.push(`segs[${segments.join("; ")}]`);
  }
  return attrs;
}

function noteAttrs(ctx: FormatContext, n: RawNode): string[] {
  for (const reaction of n.reactions ?? []) {
    const line = `  ${n.id} ${quote(n.name)} ${reaction}`;
    if (!ctx.flow.includes(line)) ctx.flow.push(line);
  }
  return (n.notes ?? []).map((note) => `note=${quote(note)}`);
}

export function nodeAttrs(ctx: FormatContext, n: RawNode): string[] {
  const vars = new NodeVars(n.vars);
  return [
    ...geometryAttrs(n),
    ...paintAttrs(ctx, n),
    ...shapeAttrs(ctx, n, vars),
    ...layoutAttrs(n, vars),
    ...placementAttrs(n),
    ...variableAttrs(n, vars),
    ...componentAttrs(ctx, n),
    ...iconAttrs(ctx, n),
    ...textAttrs(ctx, n),
    ...noteAttrs(ctx, n),
  ];
}
