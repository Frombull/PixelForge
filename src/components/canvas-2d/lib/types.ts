export type Tool = "SELECT" | "POLYGON" | "TRANSLATE" | "ROTATE";

export type ShapeType = "polygon" | "rect" | "circle";

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  /** Local-space points (relative to x,y pivot), unused for circle */
  points: [number, number][];
  /** Circle only */
  radius?: number;
  fill: string;
  stroke: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  /** Snapshot of the shape at creation time — used by "Reset" in Inspector */
  originalPoints?: [number, number][];
  originalX?: number;
  originalY?: number;
  originalRotation?: number;
  originalScaleX?: number;
  originalScaleY?: number;
  originalRadius?: number;
}

export interface ViewState {
  zoom: number;
  offset: { x: number; y: number };
}

export interface EditorSettings {
  snapEnabled: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showVertexDots: boolean;
  showDebug: boolean;
}

export type DragState =
  | { type: "move"; id: string; startX: number; startY: number }
  | { type: "rotate"; id: string; cx: number; cy: number; startAngle: number; origRot: number }
  | { type: "scale"; id: string; dir: string; cx: number; cy: number; origScale: { x: number; y: number }; origDist: number }
  | { type: "translate"; id: string; axis: "x" | "y" | "xy"; startX: number; startY: number; origX: number; origY: number }
  | { type: "vertex"; id: string; vertexIndex: number; startX: number; startY: number; origPoint: [number, number]; axis: "x" | "y" | "xy" }
  | { type: "rotate-tool"; id: string; cx: number; cy: number; startAngle: number; origRot: number; pivotIsVertex: boolean }
  | { type: "pan"; startX: number; startY: number; ox: number; oy: number };
