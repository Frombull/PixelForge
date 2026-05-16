import type { Shape, ViewState } from "./types";
import { GRID_STEP } from "./constants";

// ─── Coordinate helpers ───────────────────────────────────────────────────────

export function screenToWorld(
  screenX: number,
  screenY: number,
  view: ViewState
): [number, number] {
  return [
    (screenX - view.offset.x) / view.zoom,
    (screenY - view.offset.y) / view.zoom,
  ];
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  view: ViewState
): [number, number] {
  return [
    worldX * view.zoom + view.offset.x,
    worldY * view.zoom + view.offset.y,
  ];
}

// ─── Snap ─────────────────────────────────────────────────────────────────────

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_STEP) * GRID_STEP;
}

export function snapPoint(
  x: number,
  y: number,
  snapEnabled: boolean
): [number, number] {
  if (!snapEnabled) return [x, y];
  return [snapToGrid(x), snapToGrid(y)];
}

// ─── World-space points ───────────────────────────────────────────────────────

export function getWorldPoints(shape: Shape): [number, number][] {
  const { x, y, rotation = 0, scaleX = 1, scaleY = 1 } = shape;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return shape.points.map(([lx, ly]) => {
    const sx = lx * scaleX;
    const sy = ly * scaleY;
    return [x + sx * cos - sy * sin, y + sx * sin + sy * cos];
  });
}

// ─── Bounding box ─────────────────────────────────────────────────────────────

export interface Bounds {
  x: number; // left
  y: number; // top
  w: number;
  h: number;
}

export function getBounds(shape: Shape): Bounds {
  if (shape.type === "circle") {
    const r = (shape.radius ?? 0) * Math.max(shape.scaleX, shape.scaleY);
    return { x: shape.x - r, y: shape.y - r, w: r * 2, h: r * 2 };
  }
  const pts = getWorldPoints(shape);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

// ─── Hit testing ──────────────────────────────────────────────────────────────

function pointInPolygon(
  px: number,
  py: number,
  points: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function hitTest(shape: Shape, px: number, py: number): boolean {
  if (shape.type === "circle") {
    const r = (shape.radius ?? 0) * Math.max(shape.scaleX, shape.scaleY);
    const dx = px - shape.x;
    const dy = py - shape.y;
    return Math.sqrt(dx * dx + dy * dy) <= r;
  }
  return pointInPolygon(px, py, getWorldPoints(shape));
}

// ─── Mirror ───────────────────────────────────────────────────────────────────

/**
 * Mirror a shape across the canvas world X axis (x = 0).
 * Reflects the pivot and flips local X coords.
 */
export function mirrorX(shape: Shape): Shape {
  return {
    ...shape,
    x: -shape.x,
    points: shape.points.map(([lx, ly]) => [-lx, ly] as [number, number]),
    rotation: -shape.rotation,
  };
}

/**
 * Mirror a shape across the canvas world Y axis (y = 0).
 * Reflects the pivot and flips local Y coords.
 */
export function mirrorY(shape: Shape): Shape {
  return {
    ...shape,
    y: -shape.y,
    points: shape.points.map(([lx, ly]) => [lx, -ly] as [number, number]),
    rotation: -shape.rotation,
  };
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function cloneShape(s: Shape): Shape {
  return JSON.parse(JSON.stringify(s));
}
