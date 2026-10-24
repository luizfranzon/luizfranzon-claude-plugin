import type { PageContext } from "./context";
import { readNode } from "./node-reader";
import type { RawNode } from "./types";

const MAX_OVERRIDES = 20;

type Override = NonNullable<RawNode["overrides"]>[number];

async function describeOverride(
  ctx: PageContext,
  target: any,
  fields: string[],
  collectDef: (key: string) => Promise<void>,
): Promise<Override> {
  const override = { id: target.id, name: target.name, type: target.type, fields } as Override;
  await readNode(ctx, target, null, override);
  if (override.component?.key) await collectDef(override.component.key);
  delete override.w;
  delete override.h;
  return override;
}

export async function readOverrides(
  ctx: PageContext,
  node: any,
  o: RawNode,
  collectDef: (key: string) => Promise<void>,
): Promise<void> {
  const overrides = (node.overrides ?? []).filter((ov: any) => ov.id !== node.id).slice(0, MAX_OVERRIDES);
  if (overrides.length === 0) return;
  const byId = new Map<string, any>(node.findAll(() => true).map((n: any) => [n.id, n]));
  const list: Override[] = [];
  for (const { id, overriddenFields } of overrides) {
    const target = byId.get(id);
    if (!target) continue;
    list.push(await describeOverride(ctx, target, overriddenFields, collectDef));
  }
  if (list.length > 0) o.overrides = list;
}
