import type { RawExtraction, RawNode, VarRef } from "../page/types";
import { suffix } from "./syntax";

const NO_COLLECTION = "(sem coleção)";

function tokenName(ref: VarRef): string {
  if (ref.coll && ref.name.startsWith(`${ref.coll}/`)) return ref.name.slice(ref.coll.length + 1);
  return ref.name;
}

function refsOf(n: RawNode): VarRef[] {
  const paints = [...(n.fills ?? []), ...(n.strokes ?? []), ...(n.icon?.fills ?? []), ...(n.icon?.strokes ?? [])];
  const segments = n.text?.segments ?? [];
  const refs = [
    ...paints.map((paint) => paint.var),
    ...(n.effects ?? []).flatMap((e) => Object.values(e.vars ?? {})),
    ...segments.flatMap((s) => [...Object.values(s.vars ?? {}), ...(s.fills ?? []).map((paint) => paint.var)]),
    ...Object.values(n.vars ?? {}),
  ];
  return refs.filter((ref): ref is VarRef => ref !== undefined);
}

function allNodes(n: RawNode): RawNode[] {
  const nested = [...(n.overrides ?? []), ...(n.children ?? [])];
  return [n, ...nested.flatMap(allNodes)];
}

export function tokenLines(raw: RawExtraction): string[] {
  const roots = [raw.root!, ...Object.values(raw.componentDefs ?? {}).filter(Boolean)];
  const groups = new Map<string, Map<string, string>>();
  for (const ref of roots.flatMap(allNodes).flatMap(refsOf)) {
    const collection = ref.coll ?? NO_COLLECTION;
    const group = groups.get(collection) ?? new Map<string, string>();
    groups.set(collection, group);
    const name = tokenName(ref);
    group.set(`${name}|${ref.mode ?? ""}`, `${name}=${ref.value ?? "?"}${suffix(ref.mode && `[${ref.mode}]`, "")}`);
  }
  return [...groups].map(([collection, group]) => `  ${collection}: ${[...group.values()].join(", ")}`);
}
