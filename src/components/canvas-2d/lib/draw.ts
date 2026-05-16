import type { Shape, ViewState, EditorSettings } from "./types";
import {
  getBounds,
  getWorldPoints,
  snapPoint,
} from "./geometry";
import {
  COLORS,
  GRID_STEP,
  CLOSE_POLY_THRESHOLD,
} from "./constants";


// ─── Grid ─────────────────────────────────────────────────────────────────────

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: ViewState
): void {
  const step = GRID_STEP * view.zoom;
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;

  const ox = ((view.offset.x % step) + step) % step;
  const oy = ((view.offset.y % step) + step) % step;

  for (let x = ox; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = oy; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Axes ─────────────────────────────────────────────────────────────────────

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: ViewState
): void {
  const ox = view.offset.x;
  const oy = view.offset.y;

  ctx.save();
  ctx.lineWidth = 1;

  // X axis (horizontal, red)
  if (oy >= 0 && oy <= height) {
    ctx.strokeStyle = COLORS.axisX;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(width, oy);
    ctx.stroke();

    // X label
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.axisX;
    ctx.font = `bold 10px "JetBrains Mono", monospace`;
    ctx.fillText("X", width - 14, oy - 5);
  }

  // Y axis (vertical, green)
  if (ox >= 0 && ox <= width) {
    ctx.strokeStyle = COLORS.axisY;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, height);
    ctx.stroke();

    // Y label
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.axisY;
    ctx.font = `bold 10px "JetBrains Mono", monospace`;
    ctx.fillText("Y", ox + 5, 14);
  }

  // Origin dot
  if (ox >= 0 && ox <= width && oy >= 0 && oy <= height) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.textDim;
    ctx.beginPath();
    ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Shape ────────────────────────────────────────────────────────────────────

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  selected: boolean,
  settings: EditorSettings,
  zoom: number
): void {
  const pts = getWorldPoints(shape);

  ctx.save();

  // ── Path
  ctx.beginPath();
  if (shape.type === "circle") {
    const r = (shape.radius ?? 0) * Math.max(shape.scaleX, shape.scaleY);
    ctx.arc(shape.x, shape.y, r, 0, Math.PI * 2);
  } else {
    pts.forEach(([x, y], i) =>
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    );
    ctx.closePath();
  }

  ctx.fillStyle = shape.fill + "66";
  ctx.fill();
  ctx.strokeStyle = shape.stroke;
  ctx.lineWidth = 1.5 / zoom;
  ctx.stroke();

  // ── Vertex dots
  if (settings.showVertexDots && shape.type !== "circle") {
    pts.forEach(([x, y]) => {
      ctx.fillStyle = selected ? COLORS.borderAct : COLORS.textDim;
      ctx.beginPath();
      ctx.arc(x, y, 4 / zoom, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── Selection: bounding box only (no scale/rotation handles)
  if (selected) {
    const b = getBounds(shape);
    ctx.strokeStyle = COLORS.borderAct;
    ctx.lineWidth = 1 / zoom;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Translate gizmo ──────────────────────────────────────────────────────────

export const GIZMO_AXIS_LEN   = 156; // screen px
export const GIZMO_HEAD_SIZE  = 21;  // arrowhead half-size screen px
export const GIZMO_HIT_RADIUS = 14;  // screen px for hit testing

export function drawTranslateGizmo(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  view: ViewState,
  hoveredAxis: "x" | "y" | "xy" | null,
  originOverride?: [number, number] // world-space origin, replaces shape pivot
): void {
  const wx = originOverride ? originOverride[0] : shape.x;
  const wy = originOverride ? originOverride[1] : shape.y;
  const [sx, sy] = [
    wx * view.zoom + view.offset.x,
    wy * view.zoom + view.offset.y,
  ];

  const len = GIZMO_AXIS_LEN;
  const hs  = GIZMO_HEAD_SIZE;
  const colorX  = hoveredAxis === "x"  || hoveredAxis === "xy" ? "#ff6b6b" : COLORS.axisX;
  const colorY  = hoveredAxis === "y"  || hoveredAxis === "xy" ? "#6bff8e" : COLORS.axisY;

  ctx.save();
  ctx.lineWidth = 2;

  // ── X axis arrow (right)
  ctx.strokeStyle = colorX;
  ctx.fillStyle   = colorX;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + len, sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + len,      sy);
  ctx.lineTo(sx + len - hs, sy - hs * 0.5);
  ctx.lineTo(sx + len - hs, sy + hs * 0.5);
  ctx.closePath();
  ctx.fill();

  // ── Y axis arrow (up — screen Y is inverted)
  ctx.strokeStyle = colorY;
  ctx.fillStyle   = colorY;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx, sy - len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx,             sy - len);
  ctx.lineTo(sx - hs * 0.5, sy - len + hs);
  ctx.lineTo(sx + hs * 0.5, sy - len + hs);
  ctx.closePath();
  ctx.fill();

  // ── XY square handle at origin
  const sq = 16;
  const sqColor = hoveredAxis === "xy" ? "#ffffff" : COLORS.textMid;
  ctx.fillStyle   = sqColor;
  ctx.strokeStyle = COLORS.bg;
  ctx.lineWidth   = 2;
  ctx.fillRect(sx - sq / 2, sy - sq / 2, sq, sq);
  ctx.strokeRect(sx - sq / 2, sy - sq / 2, sq, sq);

  // ── Coordinate label — above and to the right of the center point
  const fmt = (v: number) => parseFloat((v / GRID_STEP).toFixed(2)).toString();
  const label = `${fmt(wx)}, ${fmt(wy)}`;
  ctx.font = `10px "JetBrains Mono", monospace`;
  const tw = ctx.measureText(label).width;
  const lx = sx + sq / 2 + 6;
  const ly = sy - sq / 2 - 6;
  ctx.fillStyle = "rgba(13,13,15,0.75)";
  ctx.fillRect(lx - 2, ly - 11, tw + 6, 14);
  ctx.fillStyle = COLORS.textBright;
  ctx.fillText(label, lx + 1, ly);

  ctx.restore();
}

// ─── Rotate gizmo ─────────────────────────────────────────────────────────────

export const ROTATE_GIZMO_RADIUS = 72; // screen px

export function drawRotateGizmo(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  view: ViewState,
  /** Screen-space mouse position for live arc & label. null = idle (no drag) */
  mouseSS: [number, number] | null,
  /** World-space pivot (shape center or a vertex) */
  pivotWorld: [number, number],
  /** Current rotation of the shape (radians) */
  currentAngle: number,
  /** Whether angle snap is active */
  snapActive: boolean,
): void {
  const px = pivotWorld[0] * view.zoom + view.offset.x;
  const py = pivotWorld[1] * view.zoom + view.offset.y;

  const R      = ROTATE_GIZMO_RADIUS;
  const accent = COLORS.purple;

  ctx.save();

  // ── Guide circle
  ctx.beginPath();
  ctx.arc(px, py, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(167,139,250,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Pivot crosshair + dot
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py);
  ctx.moveTo(px, py - 7); ctx.lineTo(px, py + 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  // ── Handle at current rotation angle
  const handleA  = currentAngle;
  const handleSX = px + Math.cos(handleA) * R;
  const handleSY = py + Math.sin(handleA) * R;

  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(handleSX, handleSY);
  ctx.strokeStyle = mouseSS ? accent : "rgba(167,139,250,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(handleSX, handleSY, 5, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.globalAlpha = mouseSS ? 1 : 0.65;
  ctx.fill();
  ctx.globalAlpha = 1;

  if (mouseSS) {
    const [mx, my] = mouseSS;
    const mouseA = Math.atan2(my - py, mx - px);

    // ── Reference line at 0° (right)
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + R, py);
    ctx.strokeStyle = "rgba(167,139,250,0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Filled arc from 0 to current rotation
    const ccw = handleA < 0;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, R * 0.52, 0, handleA, ccw);
    ctx.closePath();
    ctx.fillStyle = "rgba(167,139,250,0.13)";
    ctx.fill();

    // ── Cursor position on ring (where mouse projects)
    const cursorSX = px + Math.cos(mouseA) * R;
    const cursorSY = py + Math.sin(mouseA) * R;
    ctx.beginPath();
    ctx.arc(cursorSX, cursorSY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(167,139,250,0.55)";
    ctx.fill();

    // ── Angle label: show current shape rotation in degrees
    const deg   = ((currentAngle * 180) / Math.PI).toFixed(1);
    const snap  = snapActive ? " ⇧15°" : "";
    const label = `${deg}°${snap}`;
    ctx.font = `bold 11px "JetBrains Mono", monospace`;
    const tw = ctx.measureText(label).width;
    const lx = handleSX + Math.cos(handleA) * 14;
    const ly = handleSY + Math.sin(handleA) * 14;
    ctx.fillStyle = "rgba(13,13,15,0.82)";
    ctx.fillRect(lx - 4, ly - 13, tw + 8, 17);
    ctx.fillStyle = accent;
    ctx.fillText(label, lx, ly);
  }

  ctx.restore();
}

// ─── In-progress polygon preview ──────────────────────────────────────────────

export function drawPolygonPreview(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  fill: string,
  zoom: number,
  cursor: [number, number] | null,
  snapEnabled: boolean = false
): void {
  if (pts.length === 0 && !cursor) return;
  ctx.save();

  const snappedCursor = cursor ? snapPoint(cursor[0], cursor[1], snapEnabled) : null;

  // Fill preview when 2+ placed points + cursor forms a triangle
  if (pts.length >= 2) {
    const fillPts = snappedCursor ? [...pts, snappedCursor] : pts;
    ctx.beginPath();
    fillPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.18;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Placed edges
  if (pts.length >= 2) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2.5 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Preview line from last vertex to snapped cursor
  if (snappedCursor && pts.length >= 1) {
    const [lx, ly] = pts[pts.length - 1];
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(snappedCursor[0], snappedCursor[1]);
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2.5 / zoom;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Snap vertex indicator at cursor position
  if (snappedCursor) {
    const sv = 6 / zoom;
    ctx.fillStyle = COLORS.accent;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(snappedCursor[0] - sv, snappedCursor[1] - sv, sv * 2, sv * 2);
    ctx.globalAlpha = 1;
  }

  // Vertex squares
  pts.forEach(([x, y], i) => {
    const s = 6 / zoom;
    ctx.fillStyle = i === 0 ? COLORS.textBright : fill;
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  });

  // Close indicator: red ring on first vertex when cursor is near it
  if (snappedCursor && pts.length >= 3) {
    const [fx, fy] = pts[0];
    const dist = Math.hypot(snappedCursor[0] - fx, snappedCursor[1] - fy);
    if (dist < CLOSE_POLY_THRESHOLD / zoom) {
      ctx.beginPath();
      ctx.arc(fx, fy, (CLOSE_POLY_THRESHOLD * 1.4) / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2.5 / zoom;
      ctx.stroke();
    }
  }

  // Coordinate label next to the cursor point (next vertex to be placed)
  if (snappedCursor) {
    const [cx, cy] = snappedCursor;
    const gx = cx / GRID_STEP;
    const gy = cy / GRID_STEP;
    const label = snapEnabled
      ? `${Math.round(gx)}, ${Math.round(gy)}`
      : `${gx.toFixed(2)}, ${gy.toFixed(2)}`;
    const fontSize = 10 / zoom;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    const tw = ctx.measureText(label).width;
    const ox = 10 / zoom;
    const oy = -10 / zoom;
    ctx.fillStyle = "rgba(13,13,15,0.75)";
    ctx.fillRect(cx + ox - 2 / zoom, cy + oy - fontSize, tw + 6 / zoom, fontSize + 4 / zoom);
    ctx.fillStyle = COLORS.textBright;
    ctx.fillText(label, cx + ox + 1 / zoom, cy + oy);
  }

  ctx.restore();
}
