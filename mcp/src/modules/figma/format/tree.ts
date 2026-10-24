import type { RawNode } from "../page/types";
import type { FormatContext } from "./context";
import { nodeAttrs } from "./node-attrs";
import { quote } from "./syntax";

function cutAttrs(n: RawNode): string[] {
  const attrs: string[] = [];
  if (n.omitted) attrs.push(`+${n.omitted} cut:${n.omittedBy}`);
  if (n.hidden) attrs.push(`hidden=${n.hidden}`);
  return attrs;
}

export function renderNode(ctx: FormatContext, n: RawNode, depth: number, out: string[]): void {
  const indent = "  ".repeat(depth);
  const attrs = [...nodeAttrs(ctx, n), ...cutAttrs(n)];
  out.push(`${indent}${n.type} ${quote(n.name)} ${n.id} ${attrs.join(" ")}`.trimEnd());
  for (const override of n.overrides ?? []) {
    const head = `${indent}  ~ ${override.type} ${quote(override.name)} ${override.id} [${override.fields.join(",")}]`;
    out.push(`${head} ${nodeAttrs(ctx, override).join(" ")}`.trimEnd());
  }
  for (const child of n.children ?? []) renderNode(ctx, child, depth + 1, out);
}
