import { createContext, read, type PageContext } from "./context";
import { exportSvgs } from "./icons";
import { exportImage } from "./image";
import { readLight } from "./node-reader";
import { findPluginApi } from "./plugin-api";
import type { ExtractOptions, RawExtraction, RawNode } from "./types";
import { attempt, withTimeout } from "./util";
import { walk } from "./walk";

const ROOT_LOOKUP_TIMEOUT_MS = 15000;

const isContainerOfFile = (node: any): boolean => !node || node.type === "DOCUMENT" || node.type === "PAGE";

function pageNameOf(root: any): string | undefined {
  let page = root;
  while (page && page.type !== "PAGE") page = page.parent;
  return page?.name;
}

function countNodes(root: any): number {
  if (!("findAll" in root)) return 1;
  return root.findAll(() => true).length + 1;
}

function buildResult(ctx: PageContext, tree: RawNode): RawExtraction {
  return {
    file: { key: ctx.f.fileKey, name: ctx.f.root.name },
    page: pageNameOf(ctx.root),
    root: tree,
    total: countNodes(ctx.root),
    extracted: ctx.budget.count,
    unreadable: ctx.unreadable,
    componentDefs: ctx.defs,
    variantSets: ctx.variantSets,
  };
}

export async function extractInPage(opts: ExtractOptions): Promise<RawExtraction> {
  const f = attempt(() => findPluginApi(globalThis));
  if (!f) return { error: "no-figma" };
  const root = await withTimeout<any>(f.getNodeByIdAsync(opts.nodeId), ROOT_LOOKUP_TIMEOUT_MS);
  if (isContainerOfFile(root)) return { error: "not-found" };

  const ctx = createContext(f, root, opts);
  ctx.hooks.readLight = (node) => readLight(ctx, node);
  const tree = await walk(ctx, root, null, 0);
  await exportSvgs(ctx);

  const result = buildResult(ctx, tree);
  if (opts.image) {
    await read(ctx, root, "image", async () => {
      result.image = await exportImage(root);
    });
  }
  return result;
}
