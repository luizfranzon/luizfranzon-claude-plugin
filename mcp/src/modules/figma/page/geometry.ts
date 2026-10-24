import type { RawNode } from "./types";
import { round } from "./util";

const NEUTRAL_BLEND = ["PASS_THROUGH", "NORMAL"];

function readPosition(node: any, parent: any, o: RawNode): void {
  if (!parent || !("absoluteTransform" in node) || !("absoluteTransform" in parent)) return;
  o.x = round(node.absoluteTransform[0][2] - parent.absoluteTransform[0][2]);
  o.y = round(node.absoluteTransform[1][2] - parent.absoluteTransform[1][2]);
}

function readSize(node: any, o: RawNode): void {
  if (!("width" in node)) return;
  o.w = round(node.width);
  o.h = round(node.height);
}

export function readGeometry(node: any, parent: any, o: RawNode): void {
  readPosition(node, parent, o);
  readSize(node, o);
  if (node.rotation) o.rotation = round(node.rotation);
  if (node.opacity !== undefined && node.opacity < 1) o.opacity = round(node.opacity);
  if (node.blendMode && !NEUTRAL_BLEND.includes(node.blendMode)) o.blend = node.blendMode;
  if (node.isMask) o.mask = true;
}
