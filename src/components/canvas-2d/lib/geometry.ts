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
  const { x, y, rotation = 0, scaleX = 1, scaleY = 1, shearX = 0, shearY = 0 } = shape;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return shape.points.map(([lx, ly]) => {
    // Apply scale + shear in local space, then rotate
    // Transform matrix (column-major, pre-rotation):
    //   | scaleX  shearX |
    //   | shearY  scaleY |
    const tx = lx * scaleX + ly * shearX;
    const ty = lx * shearY + ly * scaleY;
    return [x + tx * cos - ty * sin, y + tx * sin + ty * cos];
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

// ─── Bezier ───────────────────────────────────────────────────────────────────

/** Evaluate a quadratic (3 pts) or cubic (4 pts) bezier curve at parameter t (0..1) */
export function evaluateBezier(points: [number, number][], t: number): [number, number] {
  if (points.length === 3) {
    const [p0, p1, p2] = points;
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    return [x, y];
  }
  const [p0, p1, p2, p3] = points;
  const x =
    (1 - t) ** 3 * p0[0] +
    3 * (1 - t) ** 2 * t * p1[0] +
    3 * (1 - t) * t ** 2 * p2[0] +
    t ** 3 * p3[0];
  const y =
    (1 - t) ** 3 * p0[1] +
    3 * (1 - t) ** 2 * t * p1[1] +
    3 * (1 - t) * t ** 2 * p2[1] +
    t ** 3 * p3[1];
  return [x, y];
}

/** Sample a bezier curve into a polyline of `resolution` segments */
export function sampleBezier(points: [number, number][], resolution: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= resolution; i++) {
    out.push(evaluateBezier(points, i / resolution));
  }
  return out;
}

/** De Casteljau construction levels at parameter t — used to draw the classic bezier construction lines */
export function bezierConstructionLevels(
  points: [number, number][],
  t: number
): [number, number][][] {
  const levels: [number, number][][] = [points];
  let current = points;
  while (current.length > 1) {
    const next: [number, number][] = [];
    for (let i = 0; i < current.length - 1; i++) {
      const [ax, ay] = current[i];
      const [bx, by] = current[i + 1];
      next.push([(1 - t) * ax + t * bx, (1 - t) * ay + t * by]);
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

// ─── Keyframe interpolation ───────────────────────────────────────────────────

/** Linearly interpolate between two keyframe snapshots (requires matching point counts) */
export function lerpSnapshot(
  a: { x: number; y: number; points: [number, number][] },
  b: { x: number; y: number; points: [number, number][] },
  t: number
): { x: number; y: number; points: [number, number][] } {
  const points: [number, number][] =
    a.points.length === b.points.length
      ? a.points.map(([ax, ay], i) => {
          const [bx, by] = b.points[i];
          return [ax + (bx - ax) * t, ay + (by - ay) * t];
        })
      : a.points;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    points,
  };
}
