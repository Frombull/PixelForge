import type { Tool, EditorSettings } from "./types";

// ─── Theme (light) ────────────────────────────────────────────────────────────
export const COLORS = {
  bg:         "#f5f5f4",
  panel:      "#ffffff",
  panelAlt:   "#ececea",
  border:     "#d8d6d2",
  borderAct:  "#57534e",
  accent:     "#57534e",
  accentDim:  "#e7e5e2",
  accentHover:"#292524",
  green:      "#16a34a",
  red:        "#dc2626",
  yellow:     "#d97706",
  purple:     "#7c3aed",
  text:       "#1c1917",
  textDim:    "#1c1917",
  textMid:    "#57534e",
  textBright: "#0c0a09",
  textLabel:  "#1c1917",
  textSubtle: "#a19d98",
  axisX:      "#dc2626",   // red  → X axis
  axisY:      "#16a34a",   // green → Y axis
  grid:       "#e7e5e2",
  handle:     "#57534e",
  selection:  "#57534e",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT_FAMILY = "'Inter', 'Inter Tight', system-ui, sans-serif";
export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";

// ─── Grid / Snap ──────────────────────────────────────────────────────────────
/** Base grid cell size in world units */
export const GRID_STEP = 24;

// ─── Tools ───────────────────────────────────────────────────────────────────
export const TOOLS: { id: Tool; icon: string; shortcut: string; label: string }[] = [
  { id: "SELECT",    icon: "⊹", shortcut: "V", label: "Selecionar" },
  { id: "POLYGON",   icon: "⬡", shortcut: "P", label: "Criar Polígono"   },
  { id: "TRANSLATE", icon: "⤢", shortcut: "T", label: "Translate" },
  { id: "ROTATE",    icon: "↻", shortcut: "R", label: "Rotacionar" },
  { id: "SCALE",     icon: "⇲", shortcut: "S", label: "Escala" },
  { id: "SHEAR",     icon: "⧖", shortcut: "H", label: "Cisalhamento" },
  { id: "BEZIER",    icon: "◠", shortcut: "B", label: "Curvas Bézier" },
  { id: "ANIMATE",   icon: "▶", shortcut: "A", label: "Animação" },
];

export const TOOL_KEY_MAP: Record<string, Tool> = {
  v: "SELECT",
  p: "POLYGON",
  t: "TRANSLATE",
  r: "ROTATE",
  s: "SCALE",
  h: "SHEAR",
  b: "BEZIER",
  a: "ANIMATE",
};

// ─── Placeholder buttons ──────────────────────────────────────────────────────
export const PLACEHOLDER_TOOLS = [
  { label: "Cisalhamento Uniforme", group: "Transformações" },
  { label: "Cisalh. Não-Uniforme",  group: "Transformações" },
] as const;

// ─── Bezier ───────────────────────────────────────────────────────────────────
export const BEZIER_STROKE = "#d97706";
export const BEZIER_CONTROL_COLOR = "#0891b2";
export const BEZIER_CONSTRUCTION_GREEN = "#16a34a";
export const BEZIER_CONSTRUCTION_BLUE = "#2563eb";
export const BEZIER_CURVE_RESOLUTION = 32;
export const BEZIER_CURVE_WIDTH = 10; // world units / zoom — final curve stroke weight
export const BEZIER_PREVIEW_WIDTH = 7; // construction/preview curve stroke weight

// ─── Animation ────────────────────────────────────────────────────────────────
export const DEFAULT_ANIMATION = {
  currentFrame: 0,
  maxFrames: 60,
  frameRate: 24,
  isPlaying: false,
  loop: true,
} as const;

// ─── Color palette ────────────────────────────────────────────────────────────
export const PALETTE: string[] = [
  "#3d8fff", "#4ade80", "#f87171", "#fbbf24",
  "#a78bfa", "#fb923c", "#e879f9", "#22d3ee",
  "#f1f5f9", "#374151",
];

// ─── Default settings ─────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: EditorSettings = {
  snapEnabled:    true,
  showGrid:       true,
  showAxes:       true,
  showVertexDots: true,
  showDebug:      true,
};

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const PREVIEW_ID = "__preview__";
export const POLYGON_STROKE = "#404052";
export const ROTATION_HANDLE_OFFSET = 24; // px above bounding box top in world units
export const HANDLE_SIZE = 4;             // half-size of scale handles in px (screen space)
export const CLOSE_POLY_THRESHOLD = 12;   // world units to snap-close a polygon
