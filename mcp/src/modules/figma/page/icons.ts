import type { PageContext, SvgJob } from "./context";
import { readPaints } from "./paints";
import type { RawIcon, RawNode } from "./types";
import { round, withTimeout } from "./util";

const VECTORS = ["VECTOR", "BOOLEAN_OPERATION", "STAR", "LINE", "POLYGON"];
const CONTAINERS = ["FRAME", "GROUP", "INSTANCE", "COMPONENT"];
const MAX_ICON_SIDE = 64;
const MAX_SVG_CHARS = 4000;
const MAX_SVG_TOTAL_CHARS = 20000;
const SVG_EXPORT_TIMEOUT_MS = 20000;

function firstVector(node: any, o: RawNode): any {
  if (VECTORS.includes(node.type)) return node;
  if (o.fills || o.strokes) return undefined;
  if (!CONTAINERS.includes(node.type) || !("findAll" in node)) return undefined;
  const descendants: any[] = node.findAll(() => true);
  const vector = descendants.find((n) => VECTORS.includes(n.type));
  if (!vector || descendants.some((n) => n.type === "TEXT")) return undefined;
  return vector;
}

function iconName(node: any, o: RawNode): string {
  if (o.component?.name) return o.component.name;
  if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET") return node.parent.name;
  return node.name;
}

async function readGlyphPaints(ctx: PageContext, vector: any, icon: RawIcon): Promise<void> {
  icon.fills = await readPaints(ctx, vector.fills, vector);
  icon.strokes = await readPaints(ctx, vector.strokes, vector);
  if (!icon.strokes || vector.strokeWeight === ctx.f.mixed) return;
  icon.strokeWeight = round(vector.strokeWeight);
}

const hasImageFill = (node: any): boolean => Array.isArray(node.fills) && node.fills.some((paint: any) => paint.type === "IMAGE");

function queueSvg(ctx: PageContext, icon: RawIcon, node: any, vector: any): void {
  if (hasImageFill(node) || hasImageFill(vector)) {
    icon.svgCut = "raster";
    return;
  }
  ctx.svgJobs.push({ icon, node });
}

export async function readIcon(ctx: PageContext, node: any, o: RawNode): Promise<RawIcon | undefined> {
  if (node === ctx.root || !("width" in node)) return undefined;
  if (node.width > MAX_ICON_SIDE || node.height > MAX_ICON_SIDE) return undefined;
  const vector = firstVector(node, o);
  if (!vector) return undefined;

  const icon: RawIcon = { name: iconName(node, o) };
  if (vector !== node) await readGlyphPaints(ctx, vector, icon);
  if (ctx.opts.icons === "svg") queueSvg(ctx, icon, node, vector);
  return icon;
}

function applySvg(ctx: PageContext, icon: RawIcon, svg: unknown): void {
  if (typeof svg !== "string") {
    icon.svgCut = "export-failed";
    return;
  }
  if (svg.length > MAX_SVG_CHARS) {
    icon.svgCut = `too-large:${svg.length}`;
    return;
  }
  if (ctx.svgTotal + svg.length > MAX_SVG_TOTAL_CHARS) {
    icon.svgCut = "budget";
    return;
  }
  ctx.svgTotal += svg.length;
  icon.svg = svg;
}

const exportSvg = async (node: any): Promise<string> => node.exportAsync({ format: "SVG_STRING" });

async function runSvgJob(ctx: PageContext, { icon, node }: SvgJob): Promise<void> {
  applySvg(ctx, icon, await withTimeout(exportSvg(node), SVG_EXPORT_TIMEOUT_MS));
}

export async function exportSvgs(ctx: PageContext): Promise<void> {
  await Promise.all(ctx.svgJobs.map((job) => runSvgJob(ctx, job)));
}
