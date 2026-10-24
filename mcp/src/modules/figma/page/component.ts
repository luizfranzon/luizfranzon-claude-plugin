import { read, type PageContext } from "./context";
import type { RawComponent, RawNode } from "./types";
import { cleanName, nonEmpty, withTimeout } from "./util";
import { compareVariants } from "./variants";

function describeDefault(definition: any): string {
  if (definition.type === "VARIANT") return `${definition.variantOptions.join("|")} = ${definition.defaultValue}`;
  if (definition.defaultValue === undefined) return definition.type;
  return `${definition.type} = ${definition.defaultValue}`;
}

export function propDefsOf(owner: any): Record<string, string> | undefined {
  const defs: Record<string, string> = {};
  for (const [name, definition] of Object.entries<any>(owner.componentPropertyDefinitions ?? {})) {
    defs[cleanName(name)] = describeDefault(definition);
  }
  return nonEmpty(defs);
}

function ownerOf(main: any): any {
  if (main.parent?.type === "COMPONENT_SET") return main.parent;
  return main;
}

async function swapName(ctx: PageContext, id: string): Promise<string> {
  const target: any = await withTimeout<any>(ctx.f.getNodeByIdAsync(id));
  if (!target) return id;
  if (target.parent?.type === "COMPONENT_SET") return target.parent.name;
  return target.name;
}

async function propValue(ctx: PageContext, prop: any): Promise<string | boolean> {
  if (prop.type === "INSTANCE_SWAP") return swapName(ctx, prop.value);
  return prop.value;
}

async function instanceProps(ctx: PageContext, node: any): Promise<Record<string, string | boolean> | undefined> {
  const props: Record<string, string | boolean> = {};
  for (const [name, prop] of Object.entries<any>(node.componentProperties ?? {})) {
    if (prop.type === "VARIANT") continue;
    props[cleanName(name)] = await propValue(ctx, prop);
  }
  return nonEmpty(props);
}

function describeComponent(ctx: PageContext, node: any, main: any): RawComponent {
  const owner = ownerOf(main);
  const component: RawComponent = { name: owner.name, key: main.key };
  if (owner !== main) {
    component.variant = node.variantProperties ?? undefined;
    component.setId = owner.id;
  }
  if (main.remote) component.remote = true;
  if (owner.description) component.description = String(owner.description).slice(0, ctx.opts.maxTextLength);
  const defs = propDefsOf(owner);
  if (defs) component.defs = defs;
  return component;
}

async function collectVariantSet(ctx: PageContext, node: any, main: any): Promise<void> {
  const owner = ownerOf(main);
  if (!ctx.opts.variants || owner === main || owner.id in ctx.variantSets) return;
  ctx.variantSets[owner.id] = { base: main.name, variants: [] };
  await read(ctx, node, "variants", async () => {
    ctx.variantSets[owner.id] = await compareVariants(ctx, main, owner);
  });
}

async function readInstance(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  const main = await node.getMainComponentAsync();
  if (main) {
    o.component = describeComponent(ctx, node, main);
    if (main.key) ctx.mains.set(main.key, main);
    await collectVariantSet(ctx, node, main);
  } else {
    ctx.unreadable.push(`${node.id}.mainComponent: não encontrado (biblioteca indisponível?)`);
  }
  const props = await instanceProps(ctx, node);
  if (props) o.props = props;
}

const isStandaloneComponent = (node: any): boolean =>
  node.type === "COMPONENT_SET" || (node.type === "COMPONENT" && node.parent?.type !== "COMPONENT_SET");

export async function readComponent(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  if (node.type === "INSTANCE") {
    await readInstance(ctx, node, o);
    return;
  }
  if (isStandaloneComponent(node)) o.propDefs = propDefsOf(node);
}
