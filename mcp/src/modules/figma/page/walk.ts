import { read, type Budget, type PageContext } from "./context";
import { readIcon } from "./icons";
import { readNode } from "./node-reader";
import { readOverrides } from "./overrides";
import type { RawNode } from "./types";
import { errText, localName } from "./util";

type OmittedBy = NonNullable<RawNode["omittedBy"]>;

function markOmitted(o: RawNode, count: number, by: OmittedBy): void {
  if (count === 0) return;
  o.omitted = count;
  o.omittedBy = by;
}

function visibleChildren(ctx: PageContext, node: any, o: RawNode): any[] {
  const kids: any[] = node.children ?? [];
  if (ctx.opts.includeHidden) return kids;
  const visible = kids.filter((kid) => kid.visible !== false);
  if (visible.length < kids.length) o.hidden = kids.length - visible.length;
  return visible;
}

const isCollapsedInstance = (ctx: PageContext, node: any): boolean =>
  node.type === "INSTANCE" && !ctx.opts.expandInstances && node !== ctx.root;

export async function collectDef(ctx: PageContext, key: string): Promise<void> {
  if (key in ctx.defs || !ctx.mains.has(key)) return;
  ctx.defs[key] = undefined as any;
  try {
    ctx.defs[key] = await walk(ctx, ctx.mains.get(key), null, 0, ctx.defBudget);
  } catch (error: any) {
    delete ctx.defs[key];
    ctx.unreadable.push(`component ${key}: ${errText(error)}`);
  }
}

async function collapseInstance(ctx: PageContext, node: any, o: RawNode, hiddenCount: number): Promise<void> {
  const collect = (key: string) => collectDef(ctx, key);
  await read(ctx, node, "overrides", () => readOverrides(ctx, node, o, collect));
  if (o.component?.key) await collect(o.component.key);
  markOmitted(o, hiddenCount, "instance");
}

async function walkChildren(ctx: PageContext, node: any, o: RawNode, visible: any[], depth: number, budget: Budget): Promise<void> {
  o.children = [];
  for (const [index, child] of visible.entries()) {
    if (budget.count >= budget.max) {
      markOmitted(o, visible.length - index, "maxNodes");
      return;
    }
    o.children.push(await walk(ctx, child, node, depth + 1, budget));
  }
}

export async function walk(ctx: PageContext, node: any, parent: any, depth: number, budget: Budget = ctx.budget): Promise<RawNode> {
  budget.count++;
  const o: RawNode = { id: node.id, name: localName(node, parent), type: node.type };
  await readNode(ctx, node, parent, o);
  const visible = visibleChildren(ctx, node, o);

  await read(ctx, node, "icon", async () => {
    o.icon = await readIcon(ctx, node, o);
  });
  if (o.icon && node.type !== "INSTANCE") {
    markOmitted(o, visible.length, "icon");
    return o;
  }
  if (isCollapsedInstance(ctx, node)) {
    await collapseInstance(ctx, node, o, visible.length);
    return o;
  }
  if (visible.length === 0) return o;
  if (depth >= ctx.opts.depth) {
    markOmitted(o, visible.length, "depth");
    return o;
  }
  await walkChildren(ctx, node, o, visible, depth, budget);
  return o;
}
