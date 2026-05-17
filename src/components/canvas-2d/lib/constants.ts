import type { Tool, EditorSettings } from "./types";

// ─── Theme ────────────────────────────────────────────────────────────────────
export const COLORS = {
  bg:         "#1e1e1e",
  panel:      "#2c2c2c",
  panelAlt:   "#363636",
  border:     "#3a3a3a",
  borderAct:  "#888888",
  accent:     "#aaaaaa",
  accentDim:  "#3a3a3a",
  accentHover:"#cccccc",
  green:      "#4ade80",
  red:        "#f87171",
  yellow:     "#fbbf24",
  purple:     "#a78bfa",
  text:       "#ffffff",
  textDim:    "#ffffff",
  textMid:    "#b0b0b0",
  textBright: "#ffffff",
  textLabel:  "#ffffff",
  textSubtle: "#6a6a6a",
  axisX:      "#f87171",   // red  → X axis
  axisY:      "#4ade80",   // green → Y axis
  grid:       "#272727",
  handle:     "#aaaaaa",
  selection:  "#aaaaaa",
} as const;

// ─── Grid / Snap ──────────────────────────────────────────────────────────────
/** Base grid cell size in world units */
export const GRID_STEP = 24;

// ─── Tools ───────────────────────────────────────────────────────────────────
export const TOOLS: { id: Tool; icon: string; shortcut: string; label: string }[] = [
  { id: "SELECT",    icon: "⊹", shortcut: "V", label: "Selecionar" },
  { id: "POLYGON",   icon: "⬡", shortcut: "P", label: "Criar Polígono"   },
  { id: "TRANSLATE", icon: "⤢", shortcut: "T", label: "Translate" },
  { id: "ROTATE",    icon: "↻", shortcut: "R", label: "Rotacionar" },
];

export const TOOL_KEY_MAP: Record<string, Tool> = {
  v: "SELECT",
  p: "POLYGON",
  t: "TRANSLATE",
  r: "ROTATE",
};

// ─── Placeholder buttons ──────────────────────────────────────────────────────
export const PLACEHOLDER_TOOLS = [
  { label: "Curvas",                group: "Ferramentas" },
  { label: "Animação",              group: "Ferramentas" },
  { label: "Cisalhamento Uniforme", group: "Transformações" },
  { label: "Cisalh. Não-Uniforme",  group: "Transformações" },
] as const;

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
  showDebug:      false,
};

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const PREVIEW_ID = "__preview__";
export const POLYGON_STROKE = "#404052";
export const ROTATION_HANDLE_OFFSET = 24; // px above bounding box top in world units
export const HANDLE_SIZE = 4;             // half-size of scale handles in px (screen space)
export const CLOSE_POLY_THRESHOLD = 12;  // world units to snap-close a polygon
