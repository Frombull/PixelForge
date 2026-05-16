"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import type { Shape, ViewState, EditorSettings, DragState, Tool } from "./lib/types";
import { drawGrid, drawAxes, drawShape, drawPolygonPreview, drawTranslateGizmo, drawRotateGizmo, GIZMO_AXIS_LEN, GIZMO_HIT_RADIUS, ROTATE_GIZMO_RADIUS } from "./lib/draw";

const VERTEX_HIT_RADIUS = 10; // screen px
import {
  screenToWorld,
  hitTest,
  snapPoint,
  uid,
  getWorldPoints,
} from "./lib/geometry";
import {
  COLORS,
  PREVIEW_ID,
  POLYGON_STROKE,
  CLOSE_POLY_THRESHOLD,
} from "./lib/constants";
import ZoomControls from "./ZoomControls";
import SettingsMenu from "./SettingsMenu";

interface EditorCanvasProps {
  shapes: Shape[];
  selectedId: string | null;
  tool: Tool;
  fillColor: string;
  strokeColor: string;
  view: ViewState;
  settings: EditorSettings;
  polyPts: [number, number][] | null;

  // Callbacks
  onShapesChange: (shapes: Shape[]) => void;
  onSelectId: (id: string | null) => void;
  onViewChange: (view: ViewState) => void;
  onPolyPtsChange: (pts: [number, number][] | null) => void;
  onCommit: (shapes: Shape[]) => void;
  onToolChange: (tool: Tool) => void;
  onSettingsChange: (patch: Partial<EditorSettings>) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasClipboard: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export default function EditorCanvas({
  shapes,
  selectedId,
  tool,
  fillColor,
  strokeColor,
  view,
  settings,
  polyPts,
  onShapesChange,
  onSelectId,
  onViewChange,
  onPolyPtsChange,
  onCommit,
  onToolChange,
  onSettingsChange,
  canUndo,
  canRedo,
  hasSelection,
  hasClipboard,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const polyRef = useRef<[number, number][] | null>(null);
  const mouseWorldRef = useRef<[number, number] | null>(null);
  const shiftRef = useRef(false);
  const hoveredAxisRef = useRef<"x" | "y" | "xy" | null>(null);
  const hoveredVertexRef = useRef<number | null>(null);
  const activeVertexRef = useRef<number | null>(null);
  // ROTATE tool state
  const rotateActiveVertexRef = useRef<number | null>(null); // vertex used as pivot (-1 = shape center)
  const rotateMouseSSRef = useRef<[number, number] | null>(null); // screen-space mouse during drag
  const [gizmoCursor, setGizmoCursor] = useState<"grab" | "default">("default");
  const [tick, setTick] = useState(0);

  // Keep latest values accessible in event handlers without stale closures
  const live = useRef({
    shapes, selectedId, tool, fillColor, strokeColor, view, settings, polyPts,
  });
  live.current = { shapes, selectedId, tool, fillColor, strokeColor, view, settings, polyPts };

  // Sync polyRef with external state — when polyPts is cleared (ESC / tool change), reset the ref
  if (polyPts === null && polyRef.current !== null) {
    polyRef.current = null;
  }

  // Stable ref to onViewChange so resize effect doesn't need it as a dep
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  // ── Draw ────────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { shapes, selectedId, tool, view, settings, polyPts, fillColor } = live.current;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (settings.showGrid) drawGrid(ctx, W, H, view);
    if (settings.showAxes) drawAxes(ctx, W, H, view);

    ctx.save();
    ctx.translate(view.offset.x, view.offset.y);
    ctx.scale(view.zoom, view.zoom);

    shapes.forEach((s) => drawShape(ctx, s, s.id === selectedId, settings, view.zoom));

    const snap = settings.snapEnabled && !shiftRef.current;
    if (tool === "POLYGON" && mouseWorldRef.current) {
      drawPolygonPreview(ctx, polyPts ?? [], fillColor, view.zoom, mouseWorldRef.current, snap);
    }

    // Vertex highlights for TRANSLATE / ROTATE tools (world space, before restore)
    if (tool === "TRANSLATE" || tool === "ROTATE") {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel && sel.type !== "circle") {
        const worldPts = getWorldPoints(sel);
        const activeVi = tool === "ROTATE" ? rotateActiveVertexRef.current : activeVertexRef.current;
        worldPts.forEach(([vx, vy], i) => {
          const isHovered  = hoveredVertexRef.current === i;
          const isActive   = activeVi === i;
          const r = (isHovered || isActive ? 7 : 5) / view.zoom;
          ctx.save();
          ctx.beginPath();
          ctx.arc(vx, vy, r, 0, Math.PI * 2);
          ctx.fillStyle = isActive
            ? COLORS.purple
            : isHovered
            ? COLORS.textBright
            : COLORS.textMid;
          ctx.fill();
          ctx.strokeStyle = COLORS.bg;
          ctx.lineWidth = 1.5 / view.zoom;
          ctx.stroke();
          ctx.restore();
        });
      }
    }

    ctx.restore();

    // Translate gizmo is drawn in screen space (after restore)
    if (tool === "TRANSLATE") {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel) {
        let originOverride: [number, number] | undefined;
        if (activeVertexRef.current !== null && sel.type !== "circle") {
          originOverride = getWorldPoints(sel)[activeVertexRef.current];
        }
        drawTranslateGizmo(ctx, sel, view, hoveredAxisRef.current, originOverride);
      }
    }

    // Rotate gizmo is drawn in screen space (after restore)
    if (tool === "ROTATE") {
      const sel = shapes.find((s) => s.id === selectedId);
      if (sel) {
        let pivotWorld: [number, number] = [sel.x, sel.y];
        const vi = rotateActiveVertexRef.current;
        if (vi !== null && vi >= 0 && sel.type !== "circle") {
          pivotWorld = getWorldPoints(sel)[vi];
        }
        drawRotateGizmo(
          ctx, sel, view,
          rotateMouseSSRef.current,
          pivotWorld,
          sel.rotation,
          shiftRef.current,
        );
      }
    }

    if (settings.showDebug) {
      drawDebug(ctx, shapes, selectedId, view);
    }
  }, []);

  // ── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    draw();
  }, [draw, shapes, selectedId, tool, view, settings, polyPts, fillColor, tick]);

  // ── Canvas resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      setTick((t) => t + 1);
    });
    obs.observe(canvas);

    // Initial size + center camera
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    onViewChangeRef.current({
      zoom: 2,
      offset: { x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2 },
    });
    setTick((t) => t + 1);

    return () => obs.disconnect();
  }, []);

  // ── Shift key tracking — redraw polygon cursor when Shift is pressed/released
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;
      shiftRef.current = e.type === "keydown";
      const { tool } = live.current;
      if (tool === "POLYGON" && mouseWorldRef.current) draw();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [draw]);

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.91;

      const { view } = live.current;
      const newZoom = Math.min(16, Math.max(0.05, view.zoom * factor));
      onViewChange({
        zoom: newZoom,
        offset: {
          x: cx - (cx - view.offset.x) * (newZoom / view.zoom),
          y: cy - (cy - view.offset.y) * (newZoom / view.zoom),
        },
      });
    };

    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [onViewChange]);

  // ── Zoom controls ───────────────────────────────────────────────────────────
  const zoomAt = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const { view } = live.current;
      const newZoom = Math.min(16, Math.max(0.05, view.zoom * factor));
      onViewChange({
        zoom: newZoom,
        offset: {
          x: cx - (cx - view.offset.x) * (newZoom / view.zoom),
          y: cy - (cy - view.offset.y) * (newZoom / view.zoom),
        },
      });
    },
    [onViewChange]
  );

  const handleZoomIn  = useCallback(() => zoomAt(1.25), [zoomAt]);
  const handleZoomOut = useCallback(() => zoomAt(0.8),  [zoomAt]);
  const handleResetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onViewChange({
      zoom: 2,
      offset: { x: canvas.offsetWidth / 2, y: canvas.offsetHeight / 2 },
    });
  }, [onViewChange]);

  // ── Mouse down ──────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const { shapes, tool, fillColor, view, settings } =
        live.current;
      const [wx, wy] = screenToWorld(cx, cy, view);

      if (e.button === 1 || e.button === 2) {
        panRef.current = { startX: cx, startY: cy, ox: view.offset.x, oy: view.offset.y };
        return;
      }

      // ── SELECT tool ────────────────────────────────────────────────────────
      if (tool === "SELECT") {
        let hit: Shape | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (shapes[i].id === PREVIEW_ID) continue;
          if (hitTest(shapes[i], wx, wy)) { hit = shapes[i]; break; }
        }

        if (hit) {
          onSelectId(hit.id);
        } else {
          onSelectId(null);
          panRef.current = { startX: cx, startY: cy, ox: view.offset.x, oy: view.offset.y };
        }
        return;
      }

      // ── POLYGON tool ───────────────────────────────────────────────────────
      if (tool === "POLYGON") {
        const pts = polyRef.current ?? [];
        const [snX, snY] = snapPoint(wx, wy, settings.snapEnabled && !e.shiftKey);

        if (pts.length >= 3) {
          const [fx, fy] = pts[0];
          if (Math.hypot(snX - fx, snY - fy) < CLOSE_POLY_THRESHOLD / view.zoom) {
            finalizePolygon(pts, fillColor, shapes, onCommit, onSelectId, onToolChange, onPolyPtsChange);
            polyRef.current = null;
            mouseWorldRef.current = null;
            return;
          }
        }

        const updated: [number, number][] = [...pts, [snX, snY]];
        polyRef.current = updated;
        onPolyPtsChange(updated);
        return;
      }

      // ── TRANSLATE tool ─────────────────────────────────────────────────────
      if (tool === "TRANSLATE") {
        const sel = shapes.find((s) => s.id === live.current.selectedId);
        if (!sel) {
          let hit: Shape | null = null;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].id === PREVIEW_ID) continue;
            if (hitTest(shapes[i], wx, wy)) { hit = shapes[i]; break; }
          }
          if (hit) onSelectId(hit.id);
          return;
        }

        // Vertex hit-test (priority over gizmo and fill)
        if (sel.type !== "circle") {
          const worldPts = getWorldPoints(sel);
          const threshold = VERTEX_HIT_RADIUS / view.zoom;
          for (let i = 0; i < worldPts.length; i++) {
            const [vx, vy] = worldPts[i];
            if (Math.hypot(wx - vx, wy - vy) <= threshold) {
              activeVertexRef.current = i;
              dragRef.current = {
                type: "vertex",
                id: sel.id,
                vertexIndex: i,
                startX: wx,
                startY: wy,
                origPoint: [...sel.points[i]],
                axis: "xy",
              };
              draw();
              return;
            }
          }
        }

        const axis = hoveredAxisRef.current;
        if (axis && activeVertexRef.current !== null && sel.type !== "circle") {
          // Gizmo drag on active vertex — move the vertex
          const vi = activeVertexRef.current;
          dragRef.current = {
            type: "vertex",
            id: sel.id,
            vertexIndex: vi,
            startX: wx,
            startY: wy,
            origPoint: [...sel.points[vi]],
            axis,
          };
        } else if (axis) {
          // Gizmo drag on shape pivot — clear vertex selection
          activeVertexRef.current = null;
          dragRef.current = {
            type: "translate",
            id: sel.id,
            axis,
            startX: wx,
            startY: wy,
            origX: sel.x,
            origY: sel.y,
          };
        } else if (hitTest(sel, wx, wy)) {
          // Click on fill — go back to pivot mode
          if (activeVertexRef.current !== null) {
            activeVertexRef.current = null;
            draw();
          }
        } else {
          // Click outside current shape — check if another shape was clicked
          activeVertexRef.current = null;
          let other: Shape | null = null;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].id === PREVIEW_ID || shapes[i].id === sel.id) continue;
            if (hitTest(shapes[i], wx, wy)) { other = shapes[i]; break; }
          }
          onSelectId(other ? other.id : null);
        }
        return;
      }

      // ── ROTATE tool ────────────────────────────────────────────────────────
      if (tool === "ROTATE") {
        const sel = shapes.find((s) => s.id === live.current.selectedId);
        if (!sel) {
          // Select a shape first
          let hit: Shape | null = null;
          for (let i = shapes.length - 1; i >= 0; i--) {
            if (shapes[i].id === PREVIEW_ID) continue;
            if (hitTest(shapes[i], wx, wy)) { hit = shapes[i]; break; }
          }
          if (hit) onSelectId(hit.id);
          return;
        }

        // Vertex hit — set as rotation pivot
        if (sel.type !== "circle") {
          const worldPts = getWorldPoints(sel);
          const threshold = VERTEX_HIT_RADIUS / view.zoom;
          for (let i = 0; i < worldPts.length; i++) {
            const [vx, vy] = worldPts[i];
            if (Math.hypot(wx - vx, wy - vy) <= threshold) {
              rotateActiveVertexRef.current = i;
              draw();
              return;
            }
          }
        }

        // Click on fill — start drag using current active pivot (center or vertex)
        if (hitTest(sel, wx, wy)) {
          const vi = rotateActiveVertexRef.current;
          let pivotX = sel.x, pivotY = sel.y;
          const pivotIsVertex = vi !== null && vi >= 0 && sel.type !== "circle";
          if (pivotIsVertex) {
            [pivotX, pivotY] = getWorldPoints(sel)[vi!];
          }
          const startAngle = Math.atan2(wy - pivotY, wx - pivotX);
          dragRef.current = {
            type: "rotate-tool",
            id: sel.id,
            cx: pivotX,
            cy: pivotY,
            startAngle,
            origRot: sel.rotation,
            pivotIsVertex,
          };
          return;
        }

        // Click outside — check if dragging from ring area around gizmo
        // Compute pivot in screen space
        const vi = rotateActiveVertexRef.current;
        let pwx = sel.x, pwy = sel.y;
        if (vi !== null && vi >= 0 && sel.type !== "circle") {
          [pwx, pwy] = getWorldPoints(sel)[vi];
        }
        const [psx, psy] = [pwx * view.zoom + view.offset.x, pwy * view.zoom + view.offset.y];
        const distPx = Math.hypot(cx - psx, cy - psy);
        if (distPx <= ROTATE_GIZMO_RADIUS + 20) {
          // Start rotation drag
          const startAngle = Math.atan2(wy - pwy, wx - pwx);
          dragRef.current = {
            type: "rotate-tool",
            id: sel.id,
            cx: pwx,
            cy: pwy,
            startAngle,
            origRot: sel.rotation,
            pivotIsVertex: vi !== null,
          };
          return;
        }

        // Click outside current shape — check if another shape was clicked
        rotateActiveVertexRef.current = null;
        let other: Shape | null = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
          if (shapes[i].id === PREVIEW_ID || shapes[i].id === sel.id) continue;
          if (hitTest(shapes[i], wx, wy)) { other = shapes[i]; break; }
        }
        onSelectId(other ? other.id : null);
        return;
      }
    },
    [onSelectId, onCommit, onToolChange, onPolyPtsChange, onShapesChange]
  );

  // ── Mouse move ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const { shapes, tool, view, settings } = live.current;

      shiftRef.current = e.shiftKey;
      const snap = settings.snapEnabled && !e.shiftKey;
      const [wx, wy] = screenToWorld(cx, cy, view);
      const [snWx, snWy] = snapPoint(wx, wy, snap);

      // Pan
      if (panRef.current) {
        const { startX, startY, ox, oy } = panRef.current;
        onViewChange({ ...view, offset: { x: ox + (cx - startX), y: oy + (cy - startY) } });
        return;
      }

      // Polygon cursor preview — store raw world coords; snap is applied in draw via shiftRef
      if (tool === "POLYGON") {
        mouseWorldRef.current = [wx, wy];
        draw();
      }

      // ROTATE tool: vertex hover + mouse screen-space tracking
      if (tool === "ROTATE") {
        const sel = shapes.find((s) => s.id === live.current.selectedId);
        if (sel) {
          // Always track mouse SS position for gizmo label/arc
          rotateMouseSSRef.current = [cx, cy];

          if (sel.type !== "circle" && !dragRef.current) {
            const threshold = VERTEX_HIT_RADIUS / view.zoom;
            const worldPts = getWorldPoints(sel);
            const hit = worldPts.findIndex(([vx, vy]) => Math.hypot(wx - vx, wy - vy) <= threshold);
            const newHov = hit === -1 ? null : hit;
            if (newHov !== hoveredVertexRef.current) {
              hoveredVertexRef.current = newHov;
              draw();
            }
          }
        }
      }

      // Translate gizmo hover detection (screen space)
      if (tool === "TRANSLATE" && !dragRef.current) {
        const sel = shapes.find((s) => s.id === live.current.selectedId);
        if (sel) {
          const activeVi = activeVertexRef.current;
          const origin = (activeVi !== null && sel.type !== "circle")
            ? getWorldPoints(sel)[activeVi]
            : [sel.x, sel.y];
          const sx = origin[0] * view.zoom + view.offset.x;
          const sy = origin[1] * view.zoom + view.offset.y;
          const len = GIZMO_AXIS_LEN;
          const hr = GIZMO_HIT_RADIUS;
          const sq = 16;

          let axis: "x" | "y" | "xy" | null = null;
          // XY square (checked first — priority)
          if (Math.abs(cx - sx) <= sq / 2 && Math.abs(cy - sy) <= sq / 2) {
            axis = "xy";
          } else if (
            cx >= sx && cx <= sx + len &&
            Math.abs(cy - sy) <= hr
          ) {
            axis = "x";
          } else if (
            cy <= sy && cy >= sy - len &&
            Math.abs(cx - sx) <= hr
          ) {
            axis = "y";
          }

          if (axis !== hoveredAxisRef.current) {
            hoveredAxisRef.current = axis;
            setGizmoCursor(axis ? "grab" : "default");
            draw();
          }

          // Vertex hover detection (world space)
          if (sel.type !== "circle") {
            const threshold = VERTEX_HIT_RADIUS / view.zoom;
            const worldPts = getWorldPoints(sel);
            const hit = worldPts.findIndex(([vx, vy]) => Math.hypot(wx - vx, wy - vy) <= threshold);
            const newHov = hit === -1 ? null : hit;
            if (newHov !== hoveredVertexRef.current) {
              hoveredVertexRef.current = newHov;
              draw();
            }
          }
        } else {
          if (hoveredVertexRef.current !== null) {
            hoveredVertexRef.current = null;
            draw();
          }
        }
      }

      if (!dragRef.current) return;
      const d = dragRef.current;

      if (d.type === "move") {
        onShapesChange(
          shapes.map((s) =>
            s.id === d.id ? { ...s, x: snWx - d.startX, y: snWy - d.startY } : s
          )
        );
      }

      if (d.type === "rotate") {
        const angle = Math.atan2(wy - d.cy, wx - d.cx);
        const delta = angle - d.startAngle;
        onShapesChange(
          shapes.map((s) => s.id === d.id ? { ...s, rotation: d.origRot + delta } : s)
        );
      }

      if (d.type === "rotate-tool") {
        const rawAngle = Math.atan2(wy - d.cy, wx - d.cx);
        const delta = rawAngle - d.startAngle;
        let newRot = d.origRot + delta;

        // Shift: snap to 15° increments
        if (e.shiftKey) {
          const snapRad = (15 * Math.PI) / 180;
          newRot = Math.round(newRot / snapRad) * snapRad;
        }

        // Track mouse screen position for gizmo label
        rotateMouseSSRef.current = [cx, cy];

        onShapesChange(
          shapes.map((s) => {
            if (s.id !== d.id) return s;

            if (d.pivotIsVertex) {
              // Rotate around vertex pivot: recompute shape pivot position
              // The vertex local coords must remain pointing to the same world position.
              // Find the vertex index from the original shape
              const vi = rotateActiveVertexRef.current;
              if (vi === null || vi < 0) return { ...s, rotation: newRot };

              // Original world position of the pivot vertex (from original rotation)
              const origShape = { ...s, rotation: d.origRot };
              const origWorldPts = getWorldPoints(origShape);
              const [pvx, pvy] = origWorldPts[vi]; // pivot vertex world pos (fixed)

              // With new rotation, where would the shape pivot end up?
              // pivot_world = vertex_world - R_new * local_vertex
              const [lx, ly] = s.points[vi];
              const cos = Math.cos(newRot);
              const sin = Math.sin(newRot);
              const newPivotX = pvx - (lx * s.scaleX * cos - ly * s.scaleY * sin);
              const newPivotY = pvy - (lx * s.scaleX * sin + ly * s.scaleY * cos);

              return { ...s, rotation: newRot, x: newPivotX, y: newPivotY };
            }

            return { ...s, rotation: newRot };
          })
        );
        draw();
      }

      if (d.type === "scale") {
        const dist = Math.hypot(wx - d.cx, wy - d.cy);
        const ratio = Math.max(0.01, dist / (d.origDist || 1));
        onShapesChange(
          shapes.map((s) =>
            s.id === d.id
              ? { ...s, scaleX: Math.max(0.01, d.origScale.x * ratio), scaleY: Math.max(0.01, d.origScale.y * ratio) }
              : s
          )
        );
      }

      if (d.type === "translate") {
        onShapesChange(
          shapes.map((s) => {
            if (s.id !== d.id) return s;
            const rawX = d.origX + (wx - d.startX);
            const rawY = d.origY + (wy - d.startY);
            const [newX, newY] = snapPoint(rawX, rawY, snap);
            return {
              ...s,
              x: d.axis === "y" ? d.origX : newX,
              y: d.axis === "x" ? d.origY : newY,
            };
          })
        );
      }

      if (d.type === "vertex") {
        const deltaX = wx - d.startX;
        const deltaY = wy - d.startY;
        const rawX = d.origPoint[0] + deltaX;
        const rawY = d.origPoint[1] + deltaY;
        const [snDx, snDy] = snapPoint(rawX, rawY, snap);
        const finalX = d.axis === "y" ? d.origPoint[0] : snDx;
        const finalY = d.axis === "x" ? d.origPoint[1] : snDy;
        onShapesChange(
          shapes.map((s) => {
            if (s.id !== d.id) return s;
            const newPoints = s.points.map((p, i) =>
              i === d.vertexIndex ? [finalX, finalY] as [number, number] : p
            );
            return { ...s, points: newPoints };
          })
        );
      }
    },
    [draw, onViewChange, onShapesChange]
  );

  // ── Mouse leave ─────────────────────────────────────────────────────────────
  const handleMouseLeave = useCallback(() => {
    let needDraw = false;
    if (mouseWorldRef.current !== null)    { mouseWorldRef.current = null;    needDraw = true; }
    if (hoveredVertexRef.current !== null) { hoveredVertexRef.current = null;  needDraw = true; }
    if (rotateMouseSSRef.current !== null) { rotateMouseSSRef.current = null;  needDraw = true; }
    if (needDraw) draw();
  }, [draw]);

  // ── Mouse up ────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    panRef.current = null;
    if (!dragRef.current) return;
    const d = dragRef.current;
    dragRef.current = null;

    const { shapes } = live.current;

    if (d.type === "move" || d.type === "rotate" || d.type === "scale" || d.type === "translate" || d.type === "vertex" || d.type === "rotate-tool") {
      onCommit(shapes);
    }
    if (d.type === "rotate-tool") {
      rotateMouseSSRef.current = null;
    }
  }, [onCommit]);

  const cursor =
    tool === "TRANSLATE" ? gizmoCursor    :
    tool === "ROTATE"    ? "crosshair"    :
    tool === "SELECT"    ? "default"      : "crosshair";

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        style={{ width: "100%", height: "100%", display: "block", cursor }}
      />

      {/* Floating action buttons — top left of canvas */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 50,
          display: "flex",
          gap: 2,
        }}
      >
        {(
          [
            { label: "UNDO",   shortcut: "^Z",       onClick: onUndo,   disabled: !canUndo      },
            { label: "REDO",   shortcut: "^⇧Z",      onClick: onRedo,   disabled: !canRedo      },
            { label: "COPY",   shortcut: "^C",        onClick: onCopy,   disabled: !hasSelection },
            { label: "PASTE",  shortcut: "^V",        onClick: onPaste,  disabled: !hasClipboard },
            { label: "DELETE", shortcut: "Del",       onClick: onDelete, disabled: !hasSelection },
          ] as const
        ).map((a) => (
          <ActionButton key={a.label} {...a} />
        ))}
      </div>

      {tool === "POLYGON" && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111114",
            border: "1px solid #1e1e28",
            padding: "4px 14px",
            fontSize: 10,
            color: "#4a4d58",
            pointerEvents: "none",
            letterSpacing: "0.08em",
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: "nowrap",
          }}
        >
          {polyPts
            ? `${polyPts.length} vertices, clique perto do primeiro ponto para fechar o polígono`
            : "clique para colocar o primeiro vértice"}
        </div>
      )}

      {/* Floating settings button — top right of canvas */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 50,
        }}
      >
        <SettingsMenu settings={settings} onChange={onSettingsChange} />
      </div>

      <ZoomControls
        zoom={view.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
      />
    </div>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
  label,
  shortcut,
  onClick,
  disabled,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !disabled ? COLORS.panelAlt : COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        color: disabled ? COLORS.textDim : hovered ? COLORS.textBright : COLORS.textMid,
        cursor: disabled ? "default" : "pointer",
        fontSize: 10,
        padding: "0 10px",
        height: 28,
        letterSpacing: "0.08em",
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'JetBrains Mono', monospace",
        opacity: disabled ? 0.4 : 1,
        transition: "color 0.1s, background 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span style={{ fontSize: 9, color: COLORS.textDim }}>{shortcut}</span>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function finalizePolygon(
  pts: [number, number][],
  fillColor: string,
  shapes: Shape[],
  onCommit: (s: Shape[]) => void,
  onSelectId: (id: string | null) => void,
  onToolChange: (t: Tool) => void,
  onPolyPtsChange: (pts: [number, number][] | null) => void
) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  const localPts: [number, number][] = pts.map(([x, y]) => [x - cx, y - cy]);

  const shape: Shape = {
    id: uid(),
    type: "polygon",
    x: cx,
    y: cy,
    points: localPts,
    fill: fillColor,
    stroke: POLYGON_STROKE,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    originalPoints: localPts.map(([x, y]) => [x, y]),
    originalX: cx,
    originalY: cy,
    originalRotation: 0,
    originalScaleX: 1,
    originalScaleY: 1,
  };

  onCommit([...shapes.filter((s) => s.id !== PREVIEW_ID), shape]);
  onSelectId(shape.id);
  onToolChange("SELECT");
  onPolyPtsChange(null);
}

// ─── Debug overlay ─────────────────────────────────────────────────────────────

function drawDebug(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  selectedId: string | null,
  view: ViewState
) {
  const visible = shapes.filter((s) => s.id !== PREVIEW_ID);
  const sel = visible.find((s) => s.id === selectedId);

  const lines: string[] = [
    `shapes: ${visible.length}`,
    `zoom: ${view.zoom.toFixed(3)}`,
    `offset: ${view.offset.x.toFixed(1)}, ${view.offset.y.toFixed(1)}`,
    `selected: ${selectedId ?? "none"}`,
  ];

  if (sel) {
    lines.push("─────────────");
    lines.push(`type: ${sel.type}`);
    lines.push(`x: ${sel.x.toFixed(2)}  y: ${sel.y.toFixed(2)}`);
    lines.push(`rot: ${((sel.rotation * 180) / Math.PI).toFixed(2)}°`);
    lines.push(`scale: ${sel.scaleX.toFixed(3)}, ${sel.scaleY.toFixed(3)}`);
    if (sel.type !== "circle") lines.push(`pts: ${sel.points.length}`);
  }

  const padX = 8;
  const padY = 44; // below action buttons (8 top + 28 height + 8 gap)
  const lineH = 16;
  const boxW = 200;
  const boxH = lines.length * lineH + 10 * 2;

  ctx.save();
  ctx.fillStyle = "rgba(13,13,15,0.85)";
  ctx.fillRect(padX, padY, boxW, boxH);
  ctx.strokeStyle = "#1e1e28";
  ctx.lineWidth = 1;
  ctx.strokeRect(padX, padY, boxW, boxH);

  ctx.font = `10px "JetBrains Mono", monospace`;
  lines.forEach((line, i) => {
    ctx.fillStyle = line.startsWith("─") ? "#1e1e28" : i === 0 ? "#3d8fff" : "#7a7e8a";
    ctx.fillText(line, padX + 8, padY + lineH * i + 12);
  });

  ctx.restore();
}
