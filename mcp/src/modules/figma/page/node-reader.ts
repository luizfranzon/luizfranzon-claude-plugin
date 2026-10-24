import { readCornerRadius, readEffects, readFills, readStrokes } from "./appearance";
import { readAnnotations } from "./annotations";
import { readComponent } from "./component";
import { read, type PageContext } from "./context";
import { readGeometry } from "./geometry";
import { readClipAndLimits, readLayout } from "./layout";
import { readReactions } from "./reactions";
import { readText } from "./text";
import type { RawNode } from "./types";
import { varsOf } from "./variables";

const NODE_VARIABLES_SKIPPED = ["fills", "strokes", "effects", "componentProperties"];

async function readVisual(ctx: PageContext, node: any, parent: any, o: RawNode): Promise<void> {
  readGeometry(node, parent, o);
  await read(ctx, node, "fills", () => readFills(ctx, node, o));
  await read(ctx, node, "strokes", () => readStrokes(ctx, node, o));
  await read(ctx, node, "cornerRadius", () => readCornerRadius(ctx, node, o));
  await read(ctx, node, "effects", () => readEffects(ctx, node, o));
  await read(ctx, node, "text", () => readText(ctx, node, o));
  await read(ctx, node, "layout", () => readLayout(node, parent, o));
}

async function readSemantics(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  await read(ctx, node, "clip/limits", () => readClipAndLimits(node, o));
  await read(ctx, node, "annotations", () => readAnnotations(ctx, node, o));
  await read(ctx, node, "reactions", () => readReactions(ctx, node, o));
  await read(ctx, node, "boundVariables", async () => {
    o.vars = await varsOf(ctx, node.boundVariables, node, NODE_VARIABLES_SKIPPED);
  });
  await read(ctx, node, "component", () => readComponent(ctx, node, o));
}

export async function readNode(ctx: PageContext, node: any, parent: any, o: RawNode, light = false): Promise<void> {
  await readVisual(ctx, node, parent, o);
  if (light) return;
  await readSemantics(ctx, node, o);
}

export async function readLight(ctx: PageContext, node: any): Promise<RawNode> {
  const o: RawNode = { id: node.id, name: node.name, type: node.type };
  await readNode(ctx, node, null, o, true);
  return o;
}
