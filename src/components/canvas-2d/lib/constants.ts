import type { Tool, EditorSettings } from "./types";

// ─── Theme ────────────────────────────────────────────────────────────────────
export const COLORS = {
  bg:         "#0d0d0f",
  panel:      "#111114",
  panelAlt:   "#13131a",
  border:     "#1e1e28",
  borderAct:  "#3d8fff",
  accent:     "#3d8fff",
  accentDim:  "#162847",
  accentHover:"#5aa3ff",
  green:      "#4ade80",
  red:        "#f87171",
  yellow:     "#fbbf24",
  purple:     "#a78bfa",
  text:       "#c9ccd1",
  textDim:    "#4a4d58",
  textMid:    "#7a7e8a",
  textBright: "#e8eaf0",
  axisX:      "#f87171",   // red  → X axis
  axisY:      "#4ade80",   // green → Y axis
  grid:       "#16161c",
  handle:     "#3d8fff",
  selection:  "#3d8fff",
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
