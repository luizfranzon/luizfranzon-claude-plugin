export const round = (n: number): number => Math.round(n * 100) / 100;

export const errText = (error: any): string => String(error?.message ?? error).slice(0, 120);

export const isAlias = (v: any): boolean => Boolean(v) && typeof v === "object" && v.type === "VARIABLE_ALIAS";

export function nonEmpty<T extends object>(value: T): T | undefined {
  if (Object.keys(value).length === 0) return undefined;
  return value;
}

export function attempt<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

export async function safely<T>(load: () => Promise<T>): Promise<T | undefined> {
  try {
    return await load();
  } catch {
    return undefined;
  }
}

export async function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T | undefined> {
  const timeout = new Promise<undefined>((resolve) => setTimeout(resolve, ms));
  try {
    return await Promise.race([promise, timeout]);
  } catch {
    return undefined;
  }
}

export function uniqueSegment(name: string, occurrence: number): string {
  if (occurrence === 1) return name;
  return `${name}#${occurrence}`;
}

export function joinPath(path: string, segment: string): string {
  if (!path) return segment;
  return `${path}/${segment}`;
}

export function localName(node: any, parent: any): string {
  if (!parent?.name || !node.name.startsWith(`${parent.name}/`)) return node.name;
  return node.name.slice(parent.name.length + 1);
}

export const cleanName = (name: string): string => name.replace(/#[\d:]+$/, "");
