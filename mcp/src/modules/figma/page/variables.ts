import { cached, type PageContext } from "./context";
import type { VarRef } from "./types";
import { attempt, isAlias, nonEmpty } from "./util";
import { plainValue } from "./values";

interface VariableInfo {
  variable: any;
  coll: any;
  name: string;
}

async function loadVariable(ctx: PageContext, id: string): Promise<VariableInfo | undefined> {
  const variable = await ctx.f.variables.getVariableByIdAsync(id);
  if (!variable) return undefined;
  const coll = await ctx.f.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
  if (!coll) return { variable, coll, name: variable.name };
  return { variable, coll, name: `${coll.name}/${variable.name}` };
}

function modeName(info: VariableInfo, node: any): string | undefined {
  const modes = info.coll?.modes;
  if (!(modes?.length > 1)) return undefined;
  const id = node.resolvedVariableModes?.[info.coll.id] ?? info.coll.defaultModeId;
  return modes.find((mode: any) => mode.modeId === id)?.name;
}

export async function varRef(ctx: PageContext, alias: any, node: any): Promise<VarRef> {
  const info = await cached(ctx, `var:${alias.id}`, () => loadVariable(ctx, alias.id));
  if (!info) return { name: `?${alias.id}` };
  const ref: VarRef = { name: info.name };
  if (info.coll) ref.coll = info.coll.name;
  const value = attempt(() => plainValue(info.variable.resolveForConsumer(node).value));
  if (value !== undefined) ref.value = value;
  const mode = attempt(() => modeName(info, node));
  if (mode) ref.mode = mode;
  return ref;
}

export async function varsOf(ctx: PageContext, bound: any, node: any, skip: string[] = []) {
  const out: Record<string, VarRef> = {};
  for (const [key, alias] of Object.entries(bound ?? {})) {
    if (skip.includes(key) || !isAlias(alias)) continue;
    out[key] = await varRef(ctx, alias, node);
  }
  return nonEmpty(out);
}

export async function styleName(ctx: PageContext, id: unknown): Promise<string | undefined> {
  if (typeof id !== "string" || !id) return undefined;
  return cached(ctx, `style:${id}`, async () => (await ctx.f.getStyleByIdAsync(id))?.name ?? `?${id}`);
}
