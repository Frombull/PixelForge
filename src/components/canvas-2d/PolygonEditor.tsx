"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

import Toolbar     from "./Toolbar";
import EditorCanvas from "./EditorCanvas";
import Inspector   from "./Inspector";

import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from "./lib/history";
import { cloneShape, mirrorX, mirrorY, uid } from "./lib/geometry";
import { DEFAULT_SETTINGS, COLORS, TOOL_KEY_MAP } from "./lib/constants";
import type { Shape, Tool, ViewState, EditorSettings } from "./lib/types";

export default function PolygonEditor() {
  // ── Shapes & history ────────────────────────────────────────────────────────
  const [shapes,    setShapes]    = useState<Shape[]>([]);
  const [history,   setHistory]   = useState(createHistory([]));

  // ── Selection ────────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Tool ────────────────────────────────────────────────────────────────────
  const [tool, setTool] = useState<Tool>("SELECT");

  // ── Colors ──────────────────────────────────────────────────────────────────
  const [fillColor]   = useState("#3d8fff");
  const [strokeColor] = useState("#7eb8ff");

  // ── View (zoom + pan) ────────────────────────────────────────────────────────
  const [view, setView] = useState<ViewState>({ zoom: 2, offset: { x: 0, y: 0 } });

  // ── Settings ─────────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

  // ── Clipboard ────────────────────────────────────────────────────────────────
  const [clipboard, setClipboard] = useState<Shape | null>(null);

  // ── In-progress polygon ──────────────────────────────────────────────────────
  const [polyPts, setPolyPts] = useState<[number, number][] | null>(null);

  // ── Action log (last 4 actions, newest last) ──────────────────────────────
  const [actionLog, setActionLog] = useState<string[]>([]);

  const flash = useCallback((msg: string) => {
    setActionLog((prev) => [...prev.slice(-3), msg]);
  }, []);

  // ── Live ref for keybinding handlers ────────────────────────────────────────
  const live = useRef({ shapes, selectedId, history, clipboard, polyPts, tool });
  live.current = { shapes, selectedId, history, clipboard, polyPts, tool };

  // ── Commit helper (push to history) ─────────────────────────────────────────
  const commit = useCallback((newShapes: Shape[]) => {
    setHistory((h) => pushHistory(h, newShapes));
    setShapes(newShapes);
  }, []);

  // ── Undo ─────────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const result = undoHistory(live.current.history);
    if (!result) return;
    setHistory(result.history);
    setShapes(result.shapes);
    flash("undo");
  }, [flash]);

  // ── Redo ─────────────────────────────────────────────────────────────────────
  const redo = useCallback(() => {
    const result = redoHistory(live.current.history);
    if (!result) return;
    setHistory(result.history);
    setShapes(result.shapes);
    flash("redo");
  }, [flash]);

  // ── Copy ──────────────────────────────────────────────────────────────────────
  const copy = useCallback(() => {
    const { shapes, selectedId } = live.current;
    const sel = shapes.find((s) => s.id === selectedId);
    if (!sel) return;
    setClipboard(cloneShape(sel));
    flash("copiado");
  }, [flash]);

  // ── Paste ─────────────────────────────────────────────────────────────────────
  const paste = useCallback(() => {
    const { clipboard, shapes } = live.current;
    if (!clipboard) return;
    const pasted: Shape = { ...cloneShape(clipboard), id: uid(), x: clipboard.x + 16, y: clipboard.y + 16 };
    commit([...shapes, pasted]);
    setSelectedId(pasted.id);
    flash("colado");
  }, [commit, flash]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const { shapes, selectedId } = live.current;
    if (!selectedId) return;
    commit(shapes.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [commit]);

  // ── Mirror ────────────────────────────────────────────────────────────────────
  const handleMirrorX = useCallback(() => {
    const { shapes, selectedId } = live.current;
    if (!selectedId) return;
    commit(shapes.map((s) => (s.id === selectedId ? mirrorX(s) : s)));
    flash("espelhar X");
  }, [commit, flash]);

  const handleMirrorY = useCallback(() => {
    const { shapes, selectedId } = live.current;
    if (!selectedId) return;
    commit(shapes.map((s) => (s.id === selectedId ? mirrorY(s) : s)));
    flash("espelhar Y");
  }, [commit, flash]);

  // ── Reset to original ─────────────────────────────────────────────────────────
  const handleResetShape = useCallback(() => {
    const { shapes, selectedId } = live.current;
    if (!selectedId) return;
    commit(
      shapes.map((s) => {
        if (s.id !== selectedId || !s.originalPoints) return s;
        return {
          ...s,
          x:        s.originalX        ?? s.x,
          y:        s.originalY        ?? s.y,
          points:   s.originalPoints.map(([x, y]) => [x, y] as [number, number]),
          rotation: s.originalRotation ?? 0,
          scaleX:   s.originalScaleX   ?? 1,
          scaleY:   s.originalScaleY   ?? 1,
          ...(s.originalRadius !== undefined ? { radius: s.originalRadius } : {}),
        };
      })
    );
    flash("resetado");
  }, [commit, flash]);

  // ── Inspector update ──────────────────────────────────────────────────────────
  const handleUpdateShape = useCallback(
    (key: keyof Shape, value: unknown) => {
      const { shapes, selectedId } = live.current;
      if (!selectedId) return;
      commit(shapes.map((s) => (s.id === selectedId ? { ...s, [key]: value } : s)));
    },
    [commit]
  );

  // ── Cancel polygon / deselect ────────────────────────────────────────────────
  const cancelPolygon = useCallback(() => {
    setPolyPts(null);
    setSelectedId(null);
    setTool("SELECT");
  }, []);

  // ── Tool change (also clears in-progress polygon) ───────────────────────────
  const handleToolChange = useCallback((t: Tool) => {
    setTool(t);
    if (t !== "POLYGON") {
      setPolyPts(null);
    }
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrl && key === "z" && !e.shiftKey) { e.preventDefault(); undo();  return; }
      if (ctrl && key === "z" && e.shiftKey)  { e.preventDefault(); redo();  return; }
      if (ctrl && key === "y")                 { e.preventDefault(); redo();  return; }
      if (ctrl && key === "c") { e.preventDefault(); copy();  return; }
      if (ctrl && key === "v") { e.preventDefault(); paste(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { deleteSelected(); return; }
      if (e.key === "Escape") { cancelPolygon(); return; }

      // Tool shortcuts (no modifier)
      if (!ctrl) {
        const mapped = TOOL_KEY_MAP[e.key.toLowerCase()];
        if (mapped) handleToolChange(mapped);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, copy, paste, deleteSelected, cancelPolygon, handleToolChange]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedShape = shapes.find((s) => s.id === selectedId) ?? null;
  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: COLORS.bg,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        color: COLORS.text,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* ── Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Toolbar
          activeTool={tool}
          onToolChange={handleToolChange}
        />

        <EditorCanvas
          shapes={shapes}
          selectedId={selectedId}
          tool={tool}
          fillColor={fillColor}
          strokeColor={strokeColor}
          view={view}
          settings={settings}
          polyPts={polyPts}
          actionLog={actionLog}
          onShapesChange={setShapes}
          onSelectId={setSelectedId}
          onViewChange={setView}
          onPolyPtsChange={setPolyPts}
          onCommit={commit}
          onToolChange={handleToolChange}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={!!selectedId}
          hasClipboard={!!clipboard}
          onUndo={undo}
          onRedo={redo}
          onCopy={copy}
          onPaste={paste}
          onDelete={deleteSelected}
        />

        <Inspector
          selectedShape={selectedShape}
          onUpdateShape={handleUpdateShape}
          onMirrorX={handleMirrorX}
          onMirrorY={handleMirrorY}
          onResetShape={handleResetShape}
        />
      </div>


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { display: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${COLORS.panel}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; }

      `}</style>
    </div>
  );
}
