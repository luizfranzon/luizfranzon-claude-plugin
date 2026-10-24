import type { PageContext } from "./context";
import type { RawNode } from "./types";

function describeAnnotation(annotation: any, maxLength: number): string | undefined {
  const types = (annotation.properties ?? []).map((p: any) => p.type).join(",");
  const text = String(annotation.labelMarkdown ?? annotation.label ?? "").slice(0, maxLength);
  if (!text && !types) return undefined;
  if (!types) return text;
  return `${text} [${types}]`;
}

export function readAnnotations(ctx: PageContext, node: any, o: RawNode): void {
  const notes: string[] = [];
  for (const annotation of node.annotations ?? []) {
    const note = describeAnnotation(annotation, ctx.opts.maxTextLength);
    if (note) notes.push(note);
  }
  if (notes.length > 0) o.notes = notes;
}
