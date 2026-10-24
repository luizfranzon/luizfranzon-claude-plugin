import type { VarRef } from "../page/types";

export const quote = (s: string): string => JSON.stringify(s);

export const lower = (s: string): string => s.toLowerCase();

export function suffix(value: string | number | undefined, prefix = " "): string {
  if (!value) return "";
  return `${prefix}${value}`;
}

export function varLabel(ref?: VarRef): string {
  if (!ref) return "";
  if (ref.value === undefined) return `{${ref.name}}`;
  return `{${ref.name}=${ref.value}}`;
}

export const varNameOnly = (ref?: VarRef): string => (ref && `{${ref.name}}`) || "";

export function varsText(map?: Record<string, VarRef>): string {
  if (!map) return "";
  return Object.entries(map)
    .map(([key, ref]) => `${key}${varLabel(ref)}`)
    .join(" ");
}

export const styleSuffix = (name?: string): string => suffix(name && `style=${quote(name)}`);

export const pairs = (record: Record<string, string>, glue: string, separator: string): string =>
  Object.entries(record)
    .map(([key, value]) => `${key}${glue}${value}`)
    .join(separator);

export function propLiteral(value: string | boolean): string {
  if (typeof value === "string") return quote(value);
  return String(value);
}

export function section(title: string, lines: string[]): string[] {
  if (lines.length === 0) return [];
  return [`${title}:`, ...lines];
}
