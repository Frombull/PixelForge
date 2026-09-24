export type Tool = "SELECT" | "POLYGON" | "TRANSLATE" | "ROTATE" | "SCALE" | "SHEAR" | "BEZIER" | "ANIMATE";

export type ShapeType = "polygon" | "rect" | "circle" | "bezier";

export type BezierKind = "quadratic" | "cubic";

/** Per-step visibility toggles for the De Casteljau construction display (control points always shown) */
export interface BezierVisibility {
  levelDots: boolean[];
  levelLines: boolean[];
  finalPoint: boolean;
  curve: boolean;
}

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  /** Local-space points (relative to x,y pivot), unused for circle. For bezier shapes, these are the control points. */
  points: [number, number][];
  /** Circle only */
  radius?: number;
  /** Bezier only — quadratic (3 control points) or cubic (4 control points) */
  bezierKind?: BezierKind;
  fill: string;
  stroke: string;
  rotation: number;
  scaleX: number;
  scaleY: number;
  /** Shear (skew) factors — applied before rotation in the transform matrix */
  shearX: number;
  shearY: number;
  /** Snapshot of the shape at creation time — used by "Reset" in Inspector */
  originalPoints?: [number, number][];
  originalX?: number;
  originalY?: number;
  originalRotation?: number;
  originalScaleX?: number;
  originalScaleY?: number;
  originalShearX?: number;
  originalShearY?: number;
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
  | { type: "scale-tool"; id: string; axis: "x" | "y" | "xy"; startX: number; startY: number; origScaleX: number; origScaleY: number; pivotWorld: [number, number] }
  | { type: "shear-tool"; id: string; axis: "x" | "y"; startX: number; startY: number; origShearX: number; origShearY: number }
  | { type: "bezier-point"; id: string; pointIndex: number }
  | { type: "pan"; startX: number; startY: number; ox: number; oy: number };

// ─── Keyframe animation ─────────────────────────────────────────────────────

/** Snapshot of a shape's animatable properties at a given keyframe */
export interface KeyframeSnapshot {
  x: number;
  y: number;
  points: [number, number][];
}

/** frame number -> shapeId -> snapshot */
export type KeyframeMap = Map<number, Map<string, KeyframeSnapshot>>;

export interface AnimationState {
  keyframes: KeyframeMap;
  isPlaying: boolean;
  currentFrame: number;
  maxFrames: number;
  frameRate: number;
  loop: boolean;
}
