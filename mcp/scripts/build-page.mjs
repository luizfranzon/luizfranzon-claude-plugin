import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

const entry = "src/modules/figma/page/extract.ts";
const output = "src/modules/figma/page/page-script.generated.ts";

const { outputFiles } = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "FigmaPage",
  platform: "browser",
  target: "es2022",
});

const script = outputFiles[0].text;
await writeFile(output, `export const PAGE_SCRIPT = ${JSON.stringify(script)};\n`);
console.log(`${output}: ${script.length} chars`);
