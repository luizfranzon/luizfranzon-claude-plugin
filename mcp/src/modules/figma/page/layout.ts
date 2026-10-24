import type { RawNode } from "./types";
import { round } from "./util";

const LIMIT_PROPS: [key: string, prop: string][] = [
  ["minW", "minWidth"],
  ["maxW", "maxWidth"],
  ["minH", "minHeight"],
  ["maxH", "maxHeight"],
];

const hasAutoLayout = (node: any): boolean => Boolean(node?.layoutMode) && node.layoutMode !== "NONE";

function describeAutoLayout(node: any): NonNullable<RawNode["layout"]> {
  const layout: NonNullable<RawNode["layout"]> = {
    mode: node.layoutMode,
    gap: round(node.itemSpacing),
    pad: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map(round),
    main: node.primaryAxisAlignItems,
    cross: node.counterAxisAlignItems,
  };
  if (node.layoutWrap !== "WRAP") return layout;
  layout.wrap = true;
  if (node.counterAxisSpacing) layout.crossGap = round(node.counterAxisSpacing);
  return layout;
}

function readConstraints(node: any, o: RawNode): void {
  if (!node.constraints) return;
  const { horizontal, vertical } = node.constraints;
  if (horizontal === "MIN" && vertical === "MIN") return;
  o.constraints = `${horizontal}/${vertical}`;
}

export function readLayout(node: any, parent: any, o: RawNode): void {
  if (hasAutoLayout(node)) o.layout = describeAutoLayout(node);
  const inAutoLayout = hasAutoLayout(parent);
  if ((inAutoLayout || o.layout) && node.layoutSizingHorizontal) {
    o.sizing = [node.layoutSizingHorizontal, node.layoutSizingVertical];
  }
  if (node.layoutPositioning === "ABSOLUTE") o.absolute = true;
  if (inAutoLayout && node.layoutGrow) o.grow = node.layoutGrow;
  if (!inAutoLayout) readConstraints(node, o);
}

export function readClipAndLimits(node: any, o: RawNode): void {
  if (node.clipsContent && node.children?.length) o.clip = true;
  const limits: Record<string, number> = {};
  for (const [key, prop] of LIMIT_PROPS) {
    if (typeof node[prop] === "number") limits[key] = round(node[prop]);
  }
  if (Object.keys(limits).length > 0) o.limits = limits;
}
