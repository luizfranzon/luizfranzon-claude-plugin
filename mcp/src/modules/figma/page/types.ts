
export interface ExtractOptions {
  nodeId: string;
  depth: number;
  maxNodes: number;
  expandInstances: boolean;
  includeHidden: boolean;
  image: boolean;
  icons: "name" | "svg";
  variants: boolean;
  maxTextLength: number;
}

export interface VarRef {
  name: string;
  value?: string | number | boolean;
  coll?: string;
  mode?: string;
}

export interface RawPaint {
  type: string;
  color?: string;
  stops?: string[];
  opacity?: number;
  scaleMode?: string;
  hash?: string;
  blend?: string;
  var?: VarRef;
}

export interface RawEffect {
  type: string;
  color?: string;
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  vars?: Record<string, VarRef>;
}

export interface RawTextStyle {
  family?: string;
  style?: string;
  weight?: number;
  size?: number;
  lineHeight?: string;
  letterSpacing?: string;
  decoration?: string;
  case?: string;
  textStyle?: string;
  vars?: Record<string, VarRef>;
}

export interface RawTextSegment extends RawTextStyle {
  start: number;
  end: number;
  fills?: RawPaint[];
  fillStyle?: string;
}

export interface RawComponent {
  name: string;
  set?: string;
  variant?: Record<string, string>;
  key?: string;
  remote?: boolean;
  description?: string;
  defs?: Record<string, string>;
  setId?: string;
}

export interface VariantDiff {
  path: string;
  field: string;
  value: unknown;
}

export interface RawVariantSet {
  base: string;
  variants: { name: string; diffs: VariantDiff[]; more: number }[];
}

export interface RawIcon {
  name: string;
  svg?: string;
  svgCut?: string;
  fills?: RawPaint[];
  strokes?: RawPaint[];
  strokeWeight?: number | number[];
}

export interface RawNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotation?: number;
  opacity?: number;
  blend?: string;
  mask?: boolean;
  fills?: RawPaint[];
  fillStyle?: string;
  strokes?: RawPaint[];
  strokeStyle?: string;
  strokeWeight?: number | number[];
  strokeAlign?: string;
  dash?: number[];
  radius?: number | number[];
  smoothing?: number;
  effects?: RawEffect[];
  effectStyle?: string;
  text?: { chars: string; cut?: number; align?: string; valign?: string; autoResize?: string; segments: RawTextSegment[] };
  layout?: {
    mode: string;
    wrap?: boolean;
    gap?: number;
    crossGap?: number;
    pad?: number[];
    main?: string;
    cross?: string;
  };
  sizing?: string[];
  absolute?: boolean;
  grow?: number;
  constraints?: string;
  clip?: boolean;
  limits?: Record<string, number>;
  notes?: string[];
  reactions?: string[];
  icon?: RawIcon;
  vars?: Record<string, VarRef>;
  component?: RawComponent;
  props?: Record<string, string | boolean>;
  propDefs?: Record<string, string>;
  overrides?: (RawNode & { fields: string[] })[];
  omitted?: number;
  omittedBy?: "depth" | "maxNodes" | "instance" | "icon";
  hidden?: number;
  children?: RawNode[];
}

export interface RawExtraction {
  error?: "no-figma" | "not-found";
  file?: { key?: string; name: string };
  page?: string;
  root?: RawNode;
  total?: number;
  extracted?: number;
  unreadable?: string[];
  componentDefs?: Record<string, RawNode>;
  variantSets?: Record<string, RawVariantSet>;
  image?: string;
}
