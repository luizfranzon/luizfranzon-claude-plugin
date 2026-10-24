import type { PageContext } from "./context";
import { readPaints } from "./paints";
import type { RawNode, RawTextSegment } from "./types";
import { round } from "./util";
import { lengthUnit } from "./values";
import { styleName, varsOf } from "./variables";

const SEGMENT_FIELDS = [
  "fontName",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "textDecoration",
  "textCase",
  "textStyleId",
  "fills",
  "fillStyleId",
  "boundVariables",
];

async function describeSegment(ctx: PageContext, s: any, node: any): Promise<RawTextSegment> {
  const segment: RawTextSegment = {
    start: s.start,
    end: s.end,
    family: s.fontName.family,
    style: s.fontName.style,
    weight: s.fontWeight,
    size: round(s.fontSize),
    lineHeight: lengthUnit(s.lineHeight),
    letterSpacing: lengthUnit(s.letterSpacing),
  };
  if (s.textDecoration !== "NONE") segment.decoration = s.textDecoration;
  if (s.textCase !== "ORIGINAL") segment.case = s.textCase;
  segment.textStyle = await styleName(ctx, s.textStyleId);
  segment.vars = await varsOf(ctx, s.boundVariables, node);
  segment.fills = await readPaints(ctx, s.fills, node);
  segment.fillStyle = await styleName(ctx, s.fillStyleId);
  return segment;
}

function measureAutoLineHeight(node: any, chars: string, segments: RawTextSegment[]): void {
  if (segments.length !== 1 || segments[0].lineHeight !== "auto") return;
  if (node.textAutoResize !== "WIDTH_AND_HEIGHT" || /[\n\u2028]/.test(chars)) return;
  segments[0].lineHeight = `auto(${round(node.height)}px)`;
}

export async function readText(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  if (node.type !== "TEXT") return;
  const max = ctx.opts.maxTextLength;
  const chars: string = node.characters;
  const segments: RawTextSegment[] = [];
  for (const s of node.getStyledTextSegments(SEGMENT_FIELDS)) segments.push(await describeSegment(ctx, s, node));
  measureAutoLineHeight(node, chars, segments);

  const text: NonNullable<RawNode["text"]> = { chars: chars.slice(0, max), segments };
  if (chars.length > max) text.cut = chars.length - max;
  if (node.textAlignHorizontal !== "LEFT") text.align = node.textAlignHorizontal;
  if (node.textAlignVertical !== "TOP") text.valign = node.textAlignVertical;
  if (node.textAutoResize !== "NONE") text.autoResize = node.textAutoResize;
  o.text = text;
}
