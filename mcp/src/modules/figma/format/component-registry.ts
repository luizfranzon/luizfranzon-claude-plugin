import type { RawComponent } from "../page/types";
import type { FormatContext } from "./context";
import { describeComponent } from "./describe";

export function registerComponent(ctx: FormatContext, component: RawComponent): string {
  const id = ctx.comps.ref(component, (newId) => describeComponent(component, newId, ctx.setFirst));
  ctx.compInfo.set(id, component);
  const key = component.key;
  if (key && ctx.raw.componentDefs?.[key] && !ctx.queued.has(id)) {
    ctx.queued.add(id);
    ctx.queue.push({ id, key });
  }
  return id;
}
