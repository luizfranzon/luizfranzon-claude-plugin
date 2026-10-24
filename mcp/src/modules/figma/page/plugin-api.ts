const CHUNK_KEY = /^(rspack|webpack)Chunk/;
const CODEGEN_MARKERS = ["prepareVmIfNeeded()", "scene_UNSAFE_DEPRECATED"];

function webpackRequire(g: any): any {
  const chunkKey = Object.keys(g).find((key) => CHUNK_KEY.test(key));
  if (!chunkKey) return undefined;
  let req: any;
  g[chunkKey].push([[Symbol("mcp")], {}, (r: any) => {
    req = r;
  }]);
  return req;
}

function codegenModuleIds(req: any): string[] {
  return Object.keys(req.m ?? {}).filter((id) => {
    const source = String(req.m[id]);
    return CODEGEN_MARKERS.every((marker) => source.includes(marker));
  });
}

function pluginApiFromModule(req: any, id: string): any {
  for (const fn of Object.values<any>(req(id))) {
    if (typeof fn !== "function" || !String(fn).includes("scene_UNSAFE_DEPRECATED")) continue;
    const codegen = fn();
    codegen?.prepareVmIfNeeded?.();
    if (codegen?.figma) return codegen.figma;
  }
  return undefined;
}

export function findPluginApi(g: any): any {
  if (g.figma) return g.figma;
  const req = webpackRequire(g);
  if (!req) return undefined;
  for (const id of codegenModuleIds(req)) {
    const api = pluginApiFromModule(req, id);
    if (api) return api;
  }
  return undefined;
}
