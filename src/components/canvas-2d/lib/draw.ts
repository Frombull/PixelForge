import type { Shape, ViewState, EditorSettings, BezierKind, BezierVisibility } from "./types";
import {
  getBounds,
  getWorldPoints,
  snapPoint,
  sampleBezier,
  bezierConstructionLevels,
} from "./geometry";
import {
  COLORS,
  GRID_STEP,
  CLOSE_POLY_THRESHOLD,
  BEZIER_STROKE,
  BEZIER_CONTROL_COLOR,
  BEZIER_CONSTRUCTION_GREEN,
  BEZIER_CONSTRUCTION_BLUE,
  BEZIER_CURVE_RESOLUTION,
  BEZIER_CURVE_WIDTH,
  BEZIER_PREVIEW_WIDTH,
  FONT_FAMILY,
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

  if (shape.type === "bezier") {
    const curvePts = sampleBezier(pts, BEZIER_CURVE_RESOLUTION);
    ctx.beginPath();
    curvePts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = shape.stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BEZIER_CURVE_WIDTH / zoom;
    ctx.stroke();

    if (settings.showVertexDots) {
      pts.forEach(([x, y]) => {
        ctx.fillStyle = selected ? COLORS.textBright : BEZIER_CONTROL_COLOR;
        ctx.beginPath();
        ctx.arc(x, y, 4 / zoom, 0, Math.PI * 2);
        ctx.fill();
      });
    }

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
    return;
  }

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
  ctx.lineWidth = (shape.type === "polygon" ? 5 : 2.5) / zoom;
  ctx.stroke();

  // ── Vertex dots
  if (settings.showVertexDots && shape.type !== "circle") {
    pts.forEach(([x, y]) => {
      ctx.fillStyle = selected ? COLORS.textBright : COLORS.textSubtle;
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
  ctx.font = `600 13px ${FONT_FAMILY}`;
  const tw = ctx.measureText(label).width;
  const lx = sx + sq / 2 + 6;
  const ly = sy - sq / 2 - 6;
  ctx.fillStyle = "rgba(13,13,15,0.85)";
  ctx.fillRect(lx - 2, ly - 14, tw + 8, 18);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, lx + 2, ly - 1);

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
  ctx.strokeStyle = "rgba(167,139,250,0.45)";
  ctx.lineWidth = 3;
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
    ctx.font = `700 14px ${FONT_FAMILY}`;
    const tw = ctx.measureText(label).width;
    const lx = handleSX + Math.cos(handleA) * 14;
    const ly = handleSY + Math.sin(handleA) * 14;
    ctx.fillStyle = "rgba(13,13,15,0.85)";
    ctx.fillRect(lx - 5, ly - 16, tw + 10, 21);
    ctx.fillStyle = "#c4b5fd";
    ctx.fillText(label, lx, ly - 2);
  }

  ctx.restore();
}

// ─── Scale gizmo ──────────────────────────────────────────────────────────────

export const SCALE_GIZMO_AXIS_LEN  = 140; // screen px (axis arms)
export const SCALE_GIZMO_HIT_RADIUS = 14; // screen px for handle hit test

/**
 * Draw the SCALE gizmo in screen space.
 *
 * Arms:
 *   - Red  (right)  → X-only scale
 *   - Green (up)    → Y-only scale
 *   - White square at origin → XY uniform scale
 *
 * @param origin       World-space position of the gizmo pivot (shape center OR active vertex)
 * @param hoveredAxis  Which handle is currently under the cursor
 * @param shape        The current shape (used for scale label)
 */
export function drawScaleGizmo(
  ctx: CanvasRenderingContext2D,
  origin: [number, number],
  view: ViewState,
  hoveredAxis: "x" | "y" | "xy" | null,
  shape: Shape,
): void {
  const sx = origin[0] * view.zoom + view.offset.x;
  const sy = origin[1] * view.zoom + view.offset.y;

  const len  = SCALE_GIZMO_AXIS_LEN;
  const sq   = 18; // XY square half-size for arm offset (half)
  const bsq  = 10; // end box half-size

  const colorX  = hoveredAxis === "x"  || hoveredAxis === "xy" ? "#ff6b6b" : COLORS.axisX;
  const colorY  = hoveredAxis === "y"  || hoveredAxis === "xy" ? "#6bff8e" : COLORS.axisY;
  const colorXY = hoveredAxis === "xy" ? "#ffffff" : COLORS.textMid;

  ctx.save();
  ctx.lineWidth = 2;

  // ── X arm (right) with end box
  ctx.strokeStyle = colorX;
  ctx.fillStyle   = colorX;
  ctx.beginPath();
  ctx.moveTo(sx + sq / 2, sy);
  ctx.lineTo(sx + len - bsq, sy);
  ctx.stroke();
  // End box
  ctx.fillRect(sx + len - bsq, sy - bsq, bsq * 2, bsq * 2);

  // ── Y arm (up) with end box
  ctx.strokeStyle = colorY;
  ctx.fillStyle   = colorY;
  ctx.beginPath();
  ctx.moveTo(sx, sy - sq / 2);
  ctx.lineTo(sx, sy - len + bsq);
  ctx.stroke();
  // End box
  ctx.fillRect(sx - bsq, sy - len - bsq, bsq * 2, bsq * 2);

  // ── XY square at origin
  ctx.fillStyle   = colorXY;
  ctx.strokeStyle = COLORS.bg;
  ctx.lineWidth   = 2;
  ctx.fillRect(sx - sq / 2, sy - sq / 2, sq, sq);
  ctx.strokeRect(sx - sq / 2, sy - sq / 2, sq, sq);

  // ── Scale label
  const fmt = (v: number) => v.toFixed(3);
  const label = `${fmt(shape.scaleX)}, ${fmt(shape.scaleY)}`;
  ctx.font = `600 13px ${FONT_FAMILY}`;
  const tw = ctx.measureText(label).width;
  const lx = sx + sq / 2 + 6;
  const ly = sy - sq / 2 - 6;
  ctx.fillStyle = "rgba(13,13,15,0.85)";
  ctx.fillRect(lx - 2, ly - 14, tw + 8, 18);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, lx + 2, ly - 1);

  ctx.restore();
}

// ─── Shear gizmo ─────────────────────────────────────────────────────────────

export const SHEAR_HANDLE_HALF   = 84;  // half-length of the handle bar (screen px)
export const SHEAR_HANDLE_HIT    = 14;  // hit-test radius around handle bar (screen px)
export const SHEAR_HANDLE_OFFSET = 18;  // distance above/right of the bbox edge (screen px)

/**
 * Draw the SHEAR gizmo in screen space.
 *
 * Two sliding handles on the bounding-box edges:
 *   - Cyan bar on the TOP edge  → shearX  (drag left/right)
 *   - Orange bar on the RIGHT edge → shearY (drag up/down)
 *
 * The bar shifts horizontally/vertically proportionally to the current shear value
 * so you can see how far the shape is already skewed.
 */
export function drawShearGizmo(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  view: ViewState,
  hoveredAxis: "x" | "y" | null,
): void {
  const b = getBounds(shape);

  // Convert bbox corners to screen space
  const toSX = (wx: number) => wx * view.zoom + view.offset.x;
  const toSY = (wy: number) => wy * view.zoom + view.offset.y;

  const bLeft   = toSX(b.x);
  const bRight  = toSX(b.x + b.w);
  const bTop    = toSY(b.y);
  const bBottom = toSY(b.y + b.h);
  const bMidX   = (bLeft + bRight)  / 2;
  const bMidY   = (bTop  + bBottom) / 2;

  const shearX = shape.shearX ?? 0;
  const shearY = shape.shearY ?? 0;
  const off    = SHEAR_HANDLE_OFFSET;
  const hl     = SHEAR_HANDLE_HALF;

  // ShearX handle: sits above the top edge, shifts horizontally with shearX
  // The visual offset in screen px is proportional to shearX * half-bbox-height
  const shiftX   = shearX * (bBottom - bTop) * 0.5; // screen px shift
  const hxCX     = bMidX + shiftX;
  const hxCY     = bTop - off;
  const colorX   = "#22d3ee";

  // ShearY handle: sits right of the right edge, shifts vertically with shearY
  const shiftY   = shearY * (bRight - bLeft) * 0.5;
  const hyCX     = bRight + off;
  const hyCY     = bMidY + shiftY;
  const colorY   = "#fb923c";

  ctx.save();

  // ── Bbox reference dashes
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(bLeft, bTop, bRight - bLeft, bBottom - bTop);
  ctx.setLineDash([]);

  // ── ShearX handle bar (horizontal, above top edge)
  // Dashed guide line from top-mid to handle centre
  ctx.beginPath();
  ctx.moveTo(bMidX, bTop);
  ctx.lineTo(hxCX, hxCY);
  ctx.strokeStyle = hoveredAxis === "x" ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bar
  ctx.beginPath();
  ctx.moveTo(hxCX - hl, hxCY);
  ctx.lineTo(hxCX + hl, hxCY);
  ctx.strokeStyle = colorX;
  ctx.lineWidth = hoveredAxis === "x" ? 4.5 : 3.5;
  ctx.stroke();

  // Centre dot
  ctx.beginPath();
  ctx.arc(hxCX, hxCY, hoveredAxis === "x" ? 5 : 4, 0, Math.PI * 2);
  ctx.fillStyle = colorX;
  ctx.fill();

  // ── ShearY handle bar (vertical, right of right edge)
  ctx.beginPath();
  ctx.moveTo(bRight, bMidY);
  ctx.lineTo(hyCX, hyCY);
  ctx.strokeStyle = hoveredAxis === "y" ? "rgba(251,146,60,0.5)" : "rgba(251,146,60,0.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(hyCX, hyCY - hl);
  ctx.lineTo(hyCX, hyCY + hl);
  ctx.strokeStyle = colorY;
  ctx.lineWidth = hoveredAxis === "y" ? 4.5 : 3.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(hyCX, hyCY, hoveredAxis === "y" ? 5 : 4, 0, Math.PI * 2);
  ctx.fillStyle = colorY;
  ctx.fill();

  // ── Labels
  ctx.font = `600 13px ${FONT_FAMILY}`;

  const fmtShear = (v: number) => (v >= 0 ? "+" : "") + v.toFixed(3);
  const labelX = `shX ${fmtShear(shearX)}`;
  const labelY = `shY ${fmtShear(shearY)}`;

  // ShearX label (above handle)
  const twX = ctx.measureText(labelX).width;
  ctx.fillStyle = "rgba(13,13,15,0.85)";
  ctx.fillRect(hxCX - twX / 2 - 4, hxCY - 27, twX + 8, 18);
  ctx.fillStyle = "#22d3ee";
  ctx.fillText(labelX, hxCX - twX / 2, hxCY - 14);

  // ShearY label (right of handle)
  const twY = ctx.measureText(labelY).width;
  ctx.fillStyle = "rgba(13,13,15,0.85)";
  ctx.fillRect(hyCX + 10, hyCY - 10, twY + 8, 18);
  ctx.fillStyle = "#fb923c";
  ctx.fillText(labelY, hyCX + 14, hyCY + 4);

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
    ctx.lineWidth = 3 / zoom;
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
    ctx.lineWidth = 3 / zoom;
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
    const fontSize = 13 / zoom;
    ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`;
    const tw = ctx.measureText(label).width;
    const ox = 10 / zoom;
    const oy = -10 / zoom;
    ctx.fillStyle = "rgba(13,13,15,0.85)";
    ctx.fillRect(cx + ox - 3 / zoom, cy + oy - fontSize - 1 / zoom, tw + 8 / zoom, fontSize + 6 / zoom);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, cx + ox + 2 / zoom, cy + oy + 1 / zoom);
  }

  ctx.restore();
}

// ─── Bezier tool (in-progress editing) ─────────────────────────────────────────

/** Draws the control points + connection lines while placing/editing a bezier curve (before it's committed) */
export function drawBezierControlPoints(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  zoom: number,
  hoveredIndex: number | null
): void {
  if (points.length > 1) {
    ctx.save();
    ctx.beginPath();
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.strokeStyle = BEZIER_CONTROL_COLOR;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 5 / zoom;
    ctx.stroke();
    ctx.restore();
  }

  points.forEach(([x, y], i) => {
    ctx.save();
    const r = (hoveredIndex === i ? 12 : 9) / zoom;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 / zoom;
    ctx.stroke();
    ctx.font = `${10 / zoom}px "JetBrains Mono", monospace`;
    ctx.fillStyle = COLORS.textMid;
    ctx.fillText(`P${i}`, x + 6 / zoom, y - 6 / zoom);
    ctx.restore();
  });
}

/** Draws the final bezier curve as a polyline (used both for the committed shape and live preview) */
export function drawBezierCurve(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  zoom: number,
  progress: number = 1
): void {
  const clamped = Math.min(1, Math.max(0, progress));
  const resolution = BEZIER_CURVE_RESOLUTION;
  const full = sampleBezier(points, resolution);
  // Advance by exact arc-length parameter so the traced line always ends
  // exactly at the De Casteljau point for `progress`, instead of snapping
  // to the nearest sampled segment (which made the line visibly lag behind it).
  const exactT = clamped * resolution;
  const count = Math.floor(exactT);
  const visible = full.slice(0, count + 1);
  if (clamped < 1) {
    const frac = exactT - count;
    if (frac > 0 && count + 1 < full.length) {
      const [ax, ay] = full[count];
      const [bx, by] = full[count + 1];
      visible.push([ax + (bx - ax) * frac, ay + (by - ay) * frac]);
    }
  } else if (visible[visible.length - 1] !== full[full.length - 1]) {
    visible.push(full[full.length - 1]);
  }

  ctx.save();
  ctx.beginPath();
  visible.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.strokeStyle = BEZIER_STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = BEZIER_CURVE_WIDTH / zoom;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the classic De Casteljau construction lines/points at parameter t.
 * `levels[0]` = original control points (drawn separately, always visible),
 * `levels[1..n-2]` = intermediate interpolated levels, `levels[n-1]` = the
 * final point on the curve. Drawn in fixed z-order: level 1 → level 2 → … → final point on top.
 */
export function drawBezierConstruction(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  t: number,
  zoom: number,
  visibility: BezierVisibility
): void {
  const levels = bezierConstructionLevels(points, t);
  const lastIndex = levels.length - 1;
  const levelColors = [BEZIER_CONSTRUCTION_GREEN, BEZIER_CONSTRUCTION_BLUE];

  ctx.save();

  // Intermediate levels (dots + lines), drawn bottom-to-top so later levels sit on top.
  // levels[0] = original control points (handled separately by drawBezierControlPoints),
  // so intermediate level li (UI-facing, 0-indexed) corresponds to levels[li + 1].
  for (let li = 0; li < lastIndex - 1; li++) {
    const level = levels[li + 1];
    const color = levelColors[Math.min(li, levelColors.length - 1)];

    if (visibility.levelLines[li] && level.length > 1) {
      ctx.beginPath();
      level.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = BEZIER_PREVIEW_WIDTH / zoom;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (visibility.levelDots[li]) {
      level.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 6 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      });
    }
  }

  // Final point on the curve — always on top
  if (visibility.finalPoint) {
    const [fx, fy] = levels[lastIndex][0];
    ctx.beginPath();
    ctx.arc(fx, fy, 9 / zoom, 0, Math.PI * 2);
    ctx.fillStyle = BEZIER_STROKE;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 / zoom;
    ctx.stroke();
  }

  ctx.restore();
}

export function getBezierMaxPoints(kind: BezierKind): number {
  return kind === "cubic" ? 4 : 3;
}
