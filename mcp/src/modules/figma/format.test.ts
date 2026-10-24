import assert from "node:assert/strict";
import { test } from "node:test";
import type { RawExtraction, RawTextSegment } from "./page/types";
import { formatExtraction } from "./format";

const body: RawTextSegment = { start: 0, end: 5, family: "Inter", style: "Medium", weight: 500, size: 14, lineHeight: "20px", letterSpacing: "0px", textStyle: "Body/M", fills: [{ type: "SOLID", color: "#FFFFFF" }] };
const card = { type: "SOLID", color: "#2F3136", var: { name: "Base/bg-card", value: "#2F3136" } };

const raw: RawExtraction = {
  file: { key: "KEY", name: "Kit" },
  page: "Assets",
  total: 40,
  extracted: 6,
  unreadable: ["9:9.effects: boom"],
  root: {
    id: "1:1", name: "Card", type: "FRAME", w: 320, h: 200, radius: 8,
    fills: [card], fillStyle: "Background/Card",
    effects: [{ type: "DROP_SHADOW", color: "#000000 25%", x: 0, y: 4, blur: 8 }], effectStyle: "Elevation/1",
    layout: { mode: "VERTICAL", gap: 8, pad: [16, 16, 16, 16], main: "MIN", cross: "CENTER" },
    vars: { itemSpacing: { name: "Base/space-2", value: 8 } },
    hidden: 1,
    children: [
      { id: "1:2", name: "Title", type: "TEXT", x: 16, y: 16, w: 100, h: 20, sizing: ["FILL", "HUG"], text: { chars: "Hello", segments: [body] } },
      { id: "1:3", name: "Sub", type: "TEXT", x: 16, y: 40, w: 100, h: 20, text: { chars: "World", cut: 10, segments: [body] } },
      {
        id: "1:4", name: "Avatar", type: "INSTANCE", x: 16, y: 64, w: 40, h: 40,
        component: { name: "Avatar", variant: { Size: "40" }, key: "abc" }, props: { Label: "Ana", Online: true },
        overrides: [{ id: "I1:4;5:6", name: "Label", type: "TEXT", fields: ["characters"], text: { chars: "Ana", segments: [body] } }],
        omitted: 3, omittedBy: "instance",
      },
      { id: "1:5", name: "Card copy", type: "RECTANGLE", x: 0, y: 0, w: 10, h: 10, fills: [card], fillStyle: "Background/Card" },
      { id: "1:6", name: "List", type: "FRAME", x: 0, y: 120, w: 320, h: 80, omitted: 12, omittedBy: "depth" },
    ],
  },
};

const out = formatExtraction(raw);
const lines = out.split("\n");

test("definições compartilhadas aparecem uma vez e são referenciadas por id", () => {
  assert.equal(lines.filter((l) => l.includes('style="Background/Card"')).length, 1);
  assert.ok(lines.includes('  p1 #2F3136{Base/bg-card=#2F3136} style="Background/Card"'));
  assert.ok(lines.includes('  t1 Inter Medium 500 14px lh=20px ls=0px style="Body/M"'));
  assert.ok(lines.includes('  e1 drop(#000000 25% 0,4 blur8) style="Elevation/1"'));
  assert.ok(lines.includes('  k1 "Avatar" variant{Size=40} key=abc'));
  assert.equal(lines.filter((l) => l.startsWith("  t")).length, 1);
});

test("nós trazem só o que difere do padrão, com variáveis e cortes declarados", () => {
  assert.ok(lines.includes('FRAME "Card" 1:1 320x200 fill=p1 r=8 fx=e1 col gap=8{Base/space-2} pad=16 cross=center hidden=1'));
  assert.ok(lines.includes('  TEXT "Title" 1:2 @16,16 100x20 sz=fill/hug text=t1 fill=p2 "Hello"'));
  assert.ok(lines.includes('  TEXT "Sub" 1:3 @16,40 100x20 text=t1 fill=p2 "World"…(+10 chars)'));
  assert.ok(lines.includes('  INSTANCE "Avatar" 1:4 @16,64 40x40 comp=k1 props{Label="Ana", Online=true} +3 cut:instance'));
  assert.ok(lines.includes('    ~ TEXT "Label" I1:4;5:6 [characters] text=t1 fill=p2 "Ana"'));
  assert.ok(lines.includes('  FRAME "List" 1:6 @0,120 320x80 +12 cut:depth'));
});

test("rodapé informa cobertura, falhas de leitura e o que não é extraído", () => {
  assert.ok(lines.includes("stats: 6/40 nodes"));
  assert.ok(lines.includes("  9:9.effects: boom"));
  assert.match(out, /^not extracted: vector geometry/m);
});

const space = { name: "Sem/space/lg", value: 16, coll: "Sem" };
const mode = { name: "Sem/color/bg", value: "#FFFFFF", coll: "Sem", mode: "Light" };

const rich: RawExtraction = {
  file: { key: "K", name: "Kit" },
  page: "P",
  total: 9,
  extracted: 4,
  root: {
    id: "2:1", name: "Form", type: "FRAME", w: 400, h: 300, radius: 16, clip: true, limits: { maxW: 480 },
    vars: {
      topLeftRadius: { name: "Sem/radius/card", value: 16, coll: "Sem" }, topRightRadius: { name: "Sem/radius/card", value: 16, coll: "Sem" },
      bottomRightRadius: { name: "Sem/radius/card", value: 16, coll: "Sem" }, bottomLeftRadius: { name: "Sem/radius/card", value: 16, coll: "Sem" },
      paddingLeft: space, paddingRight: space, itemSpacing: space,
    },
    layout: { mode: "VERTICAL", gap: 16, pad: [0, 16, 0, 16] },
    fills: [{ type: "SOLID", color: "#FFFFFF", var: mode }],
    notes: ["Obrigatório"],
    children: [
      { id: "2:2", name: "Back", type: "FRAME", w: 24, h: 24, icon: { name: "arrow-left", svg: "<svg/>", strokes: [{ type: "SOLID", color: "#000000" }], strokeWeight: 2 }, omitted: 2, omittedBy: "icon" },
      {
        id: "2:3", name: "Save", type: "INSTANCE", w: 80, h: 32, reactions: ["onClick→navigate(9:9 \"Lista\")"],
        component: { name: "Button", key: "b1", setId: "S1", variant: { Kind: "Solid" }, description: "Ação primária", defs: { Kind: "Solid|Outline = Solid" } },
      },
      { id: "2:4", name: "Cancel", type: "INSTANCE", w: 80, h: 32, component: { name: "Button", key: "b2", setId: "S1", variant: { Kind: "Outline" } } },
    ],
  },
  componentDefs: {
    b1: { id: "5:1", name: "Kind=Solid", type: "COMPONENT", w: 80, h: 32, fills: [{ type: "SOLID", color: "#2D49AA" }] },
  },
  variantSets: { S1: { base: "Kind=Solid", variants: [{ name: "Kind=Outline", more: 0, diffs: [{ path: "", field: "fills", value: undefined }, { path: "Label", field: "text", value: { family: "Inter", weight: 500, size: 14, lineHeight: "auto" } }] }] } },
};

const rl = formatExtraction(rich).split(String.fromCharCode(10));

test("variáveis aparecem uma vez, junto do valor, e lados iguais são agrupados", () => {
  assert.ok(rl.some((l) => l.startsWith('FRAME "Form" 2:1 400x300 fill=p1 r=16{Sem/radius/card} ')));
  assert.ok(rl.some((l) => l.includes("gap=16{Sem/space/lg} pad=0,16 clip maxW=480 vars{padX{Sem/space/lg=16}}")));
  assert.ok(!rl.some((l) => l.includes("topLeftRadius")));
});

test("componente: corpo uma vez, variantes comparadas, descrição e propriedades possíveis", () => {
  assert.ok(rl.includes('  k1 "Button" variant{Kind=Solid} key=b1 props{Kind: Solid|Outline = Solid} desc="Ação primária"'));
  assert.ok(rl.includes('    variants (diff vs "Kind=Solid"):'));
  assert.ok(rl.includes("      Kind=Outline: fills=none · Label.text=Inter 500 14px lh=auto"));
  assert.ok(rl.includes("    variants: see k1"));
  assert.ok(rl.some((l) => l.startsWith('    COMPONENT "Kind=Solid" 5:1 80x32 fill=')));
});

test("ícone, anotação, ação de protótipo, tokens e tamanho", () => {
  assert.ok(rl.some((l) => l.startsWith('  FRAME "Back" 2:2 24x24 icon=i1 icon-stroke=') && l.endsWith("+2 cut:icon")));
  assert.ok(rl.includes('  i1 "arrow-left" <svg/>'));
  assert.ok(rl.some((l) => l.includes('note="Obrigatório"')));
  assert.ok(rl.includes('  2:3 "Save" onClick→navigate(9:9 "Lista")'));
  assert.ok(rl.some((l) => l.startsWith("  Sem: ") && l.includes("space/lg=16") && l.includes("color/bg=#FFFFFF[Light]")));
  assert.match(rl.at(-1)!, /^size: \d+ chars \(~\d+ tokens\)$/);
});
