import { cached, type PageContext } from "./context";
import type { RawNode } from "./types";
import { withTimeout } from "./util";

const camel = (s: string): string => s.toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase());

function triggerText(trigger: any): string {
  if (!trigger) return "on";
  if (!trigger.timeout) return camel(trigger.type);
  return `${camel(trigger.type)}(${trigger.timeout}s)`;
}

function actionsOf(reaction: any): any[] {
  if (reaction.actions) return reaction.actions;
  if (reaction.action) return [reaction.action];
  return [];
}

const destinationName = (ctx: PageContext, id: string) =>
  cached(ctx, `node:${id}`, async () => (await withTimeout<any>(ctx.f.getNodeByIdAsync(id)))?.name);

function destinationLabel(name?: string): string {
  if (!name) return "";
  return ` ${JSON.stringify(name)}`;
}

async function actionText(ctx: PageContext, action: any): Promise<string | undefined> {
  if (action.type === "URL") return `url(${action.url})`;
  if (action.type !== "NODE") return camel(action.type);
  if (!action.destinationId) return undefined;
  const destination = await destinationName(ctx, action.destinationId);
  return `${camel(action.navigation ?? "NAVIGATE")}(${action.destinationId}${destinationLabel(destination)})`;
}

export async function readReactions(ctx: PageContext, node: any, o: RawNode): Promise<void> {
  const list: string[] = [];
  for (const reaction of node.reactions ?? []) {
    const trigger = triggerText(reaction.trigger);
    for (const action of actionsOf(reaction)) {
      const text = await actionText(ctx, action);
      if (text) list.push(`${trigger}→${text}`);
    }
  }
  if (list.length > 0) o.reactions = list;
}
