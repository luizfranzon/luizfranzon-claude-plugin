import type { VarRef } from "../page/types";
import { varsText } from "./syntax";

export const RADIUS_KEYS = ["topLeftRadius", "topRightRadius", "bottomRightRadius", "bottomLeftRadius"];
export const PADDING_KEYS = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];

const sameRef = (a?: VarRef, b?: VarRef): boolean => a?.name === b?.name && a?.value === b?.value;

export class NodeVars {
  private readonly map: Record<string, VarRef>;

  constructor(vars?: Record<string, VarRef>) {
    this.map = { ...vars };
  }

  take(key: string): VarRef | undefined {
    const ref = this.map[key];
    delete this.map[key];
    return ref;
  }

  takeSame(keys: string[]): VarRef | undefined {
    const first = this.map[keys[0]];
    if (!first || !keys.every((key) => sameRef(this.map[key], first))) return undefined;
    for (const key of keys) delete this.map[key];
    return first;
  }

  set(key: string, ref: VarRef): void {
    this.map[key] = ref;
  }

  render(): string {
    return varsText(this.map);
  }
}
