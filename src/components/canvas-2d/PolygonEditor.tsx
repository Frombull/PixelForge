"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

import Toolbar     from "./Toolbar";
import EditorCanvas from "./EditorCanvas";
import Inspector   from "./Inspector";
import BezierPanel from "./BezierPanel";
import AnimationPanel from "./AnimationPanel";

import {
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from "./lib/history";
import { cloneShape, mirrorX, mirrorY, uid, lerpSnapshot } from "./lib/geometry";
import { DEFAULT_SETTINGS, DEFAULT_ANIMATION, COLORS, TOOL_KEY_MAP, FONT_FAMILY, FONT_IMPORT_URL } from "./lib/constants";
import type { Shape, Tool, ViewState, EditorSettings, BezierKind, BezierVisibility, KeyframeMap, KeyframeSnapshot } from "./lib/types";

/** Number of intermediate De Casteljau levels for a bezier kind (excludes control points & final point) */
function bezierIntermediateLevelCount(kind: BezierKind): number {
  return kind === "cubic" ? 2 : 1;
}

function makeBezierVisibility(kind: BezierKind): BezierVisibility {
  const n = bezierIntermediateLevelCount(kind);
  return {
    levelDots: Array(n).fill(true),
    levelLines: Array(n).fill(true),
    finalPoint: true,
    curve: true,
  };
}

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

  // ── Bezier tool ──────────────────────────────────────────────────────────────
  const [bezierPts, setBezierPts] = useState<[number, number][]>([]);
  const [bezierKind, setBezierKind] = useState<BezierKind>("cubic");
  const [bezierProgress, setBezierProgress] = useState(0);
  const [bezierAnimating, setBezierAnimating] = useState(false);
  const [bezierSpeed, setBezierSpeed] = useState(1);
  const [bezierLoop, setBezierLoop] = useState(true);
  const [bezierVisibility, setBezierVisibility] = useState<BezierVisibility>(() => makeBezierVisibility("cubic"));

  const clearBezier = useCallback(() => {
    setBezierPts([]);
    setBezierProgress(0);
    setBezierAnimating(false);
  }, []);

  // ── Keyframe animation ───────────────────────────────────────────────────────
  const [keyframes, setKeyframes] = useState<KeyframeMap>(new Map());
  const [animFrame, setAnimFrame] = useState<number>(DEFAULT_ANIMATION.currentFrame);
  const [animMaxFrames, setAnimMaxFrames] = useState<number>(DEFAULT_ANIMATION.maxFrames);
  const [animFrameRate, setAnimFrameRate] = useState<number>(DEFAULT_ANIMATION.frameRate);
  const [animPlaying, setAnimPlaying] = useState<boolean>(DEFAULT_ANIMATION.isPlaying);
  const [animLoop, setAnimLoop] = useState<boolean>(DEFAULT_ANIMATION.loop);

  // ── Action log (last 4 actions, newest last) ──────────────────────────────
  const [actionLog, setActionLog] = useState<string[]>([]);

  const flash = useCallback((msg: string) => {
    setActionLog((prev) => [...prev.slice(-3), msg]);
  }, []);

  // ── Live ref for keybinding handlers ────────────────────────────────────────
  const live = useRef({ shapes, selectedId, history, clipboard, polyPts, tool, keyframes, animFrame, animMaxFrames });
  live.current = { shapes, selectedId, history, clipboard, polyPts, tool, keyframes, animFrame, animMaxFrames };

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
          shearX:   s.originalShearX   ?? 0,
          shearY:   s.originalShearY   ?? 0,
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

  // ── Tool change (also clears in-progress polygon / bezier / animation playback) ──
  const handleToolChange = useCallback((t: Tool) => {
    setTool(t);
    if (t !== "POLYGON") {
      setPolyPts(null);
    }
    if (t !== "BEZIER") {
      clearBezier();
    }
    if (t !== "ANIMATE") {
      setAnimPlaying(false);
    }
  }, [clearBezier]);

  // ── Keyframes ────────────────────────────────────────────────────────────────
  const getShapeKeyframeFrames = useCallback((shapeId: string): number[] => {
    const frames: number[] = [];
    live.current.keyframes.forEach((frameData, frame) => {
      if (frameData.has(shapeId)) frames.push(frame);
    });
    return frames.sort((a, b) => a - b);
  }, []);

  const applyKeyframeState = useCallback((frame: number, source: KeyframeMap) => {
    setShapes((prevShapes) =>
      prevShapes.map((s) => {
        const shapeFrames: number[] = [];
        source.forEach((frameData, f) => {
          if (frameData.has(s.id)) shapeFrames.push(f);
        });
        if (shapeFrames.length < 1) return s;
        shapeFrames.sort((a, b) => a - b);

        let prev = -1;
        let next = -1;
        for (const f of shapeFrames) {
          if (f <= frame) prev = f;
          if (f >= frame && next === -1) next = f;
        }

        const snap = (f: number): KeyframeSnapshot => source.get(f)!.get(s.id)!;

        if (prev === frame && next === frame) return { ...s, ...snap(frame) };
        if (prev !== -1 && next === -1) return { ...s, ...snap(prev) };
        if (prev === -1 && next !== -1) return { ...s, ...snap(next) };
        if (prev !== -1 && next !== -1) {
          if (prev === next) return { ...s, ...snap(prev) };
          const t = (frame - prev) / (next - prev);
          const interpolated = lerpSnapshot(snap(prev), snap(next), t);
          return { ...s, ...interpolated };
        }
        return s;
      })
    );
  }, []);

  const jumpToAnimFrame = useCallback((frame: number) => {
    const clamped = Math.max(0, Math.min(live.current.animMaxFrames, Math.round(frame)));
    setAnimFrame(clamped);
    applyKeyframeState(clamped, live.current.keyframes);
  }, [applyKeyframeState]);

  const addKeyframe = useCallback(() => {
    const { selectedId, shapes, animFrame } = live.current;
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;

    setKeyframes((prev) => {
      const next: KeyframeMap = new Map(prev);
      const frameData = new Map(next.get(animFrame) ?? []);
      frameData.set(selectedId, {
        x: shape.x,
        y: shape.y,
        points: shape.points.map(([x, y]) => [x, y] as [number, number]),
      });
      next.set(animFrame, frameData);
      return next;
    });
    flash(`keyframe adicionado (frame ${animFrame})`);
  }, [flash]);

  const deleteKeyframe = useCallback(() => {
    const { selectedId, animFrame } = live.current;
    if (!selectedId) return;

    setKeyframes((prev) => {
      const existing = prev.get(animFrame);
      if (!existing || !existing.has(selectedId)) return prev;
      const next: KeyframeMap = new Map(prev);
      const frameData = new Map(existing);
      frameData.delete(selectedId);
      if (frameData.size === 0) {
        next.delete(animFrame);
      } else {
        next.set(animFrame, frameData);
      }
      return next;
    });
    flash(`keyframe removido (frame ${animFrame})`);
  }, [flash]);

  const nextKeyframe = useCallback(() => {
    const { selectedId, animFrame } = live.current;
    if (!selectedId) return;
    const frames = getShapeKeyframeFrames(selectedId);
    if (frames.length === 0) return;
    const found = frames.find((f) => f > animFrame);
    jumpToAnimFrame(found ?? frames[0]);
  }, [getShapeKeyframeFrames, jumpToAnimFrame]);

  const prevKeyframe = useCallback(() => {
    const { selectedId, animFrame } = live.current;
    if (!selectedId) return;
    const frames = getShapeKeyframeFrames(selectedId);
    if (frames.length === 0) return;
    let found: number | undefined;
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i] < animFrame) { found = frames[i]; break; }
    }
    jumpToAnimFrame(found ?? frames[frames.length - 1]);
  }, [getShapeKeyframeFrames, jumpToAnimFrame]);

  const handleMaxFramesChange = useCallback((v: number) => {
    const value = Math.round(v);
    setAnimMaxFrames(value);
    if (live.current.animFrame > value) {
      jumpToAnimFrame(value);
    }
  }, [jumpToAnimFrame]);

  // ── Bezier animation playback (requestAnimationFrame) ───────────────────────
  useEffect(() => {
    if (!bezierAnimating) return;
    let raf: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setBezierProgress((p) => {
        let next = p + dt * bezierSpeed * 0.5;
        if (next >= 1) {
          if (bezierLoop) {
            next = 0;
          } else {
            next = 1;
            setBezierAnimating(false);
          }
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bezierAnimating, bezierSpeed, bezierLoop]);

  // ── Keyframe animation playback (requestAnimationFrame) ─────────────────────
  useEffect(() => {
    if (!animPlaying) return;
    let raf: number;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      acc += dt;
      const frameDuration = 1 / Math.max(1, animFrameRate);
      if (acc >= frameDuration) {
        acc = 0;
        const { animFrame, animMaxFrames, keyframes } = live.current;
        let nextFrame = animFrame + 1;
        if (nextFrame > animMaxFrames) {
          if (animLoop) {
            nextFrame = 0;
          } else {
            nextFrame = animMaxFrames;
            setAnimPlaying(false);
          }
        }
        setAnimFrame(nextFrame);
        applyKeyframeState(nextFrame, keyframes);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animPlaying, animFrameRate, animLoop, applyKeyframeState]);

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
        fontFamily: FONT_FAMILY,
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
          selectedShape={selectedShape}
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
          bezierPts={bezierPts}
          onBezierPtsChange={setBezierPts}
          bezierKind={bezierKind}
          bezierProgress={bezierProgress}
          bezierVisibility={bezierVisibility}
          onBezierComplete={(shape) => {
            commit([...shapes, shape]);
            setSelectedId(shape.id);
            clearBezier();
          }}
        />

        {tool === "BEZIER" ? (
          <BezierPanel
            bezierKind={bezierKind}
            onBezierKindChange={(k) => {
              setBezierKind(k);
              clearBezier();
              setBezierVisibility(makeBezierVisibility(k));
            }}
            pointCount={bezierPts.length}
            isComplete={bezierPts.length === (bezierKind === "cubic" ? 4 : 3)}
            progress={bezierProgress}
            onProgressChange={(t) => { setBezierAnimating(false); setBezierProgress(t); }}
            isAnimating={bezierAnimating}
            onToggleAnimating={() => {
              setBezierAnimating((a) => {
                if (!a && bezierProgress >= 0.999) setBezierProgress(0);
                return !a;
              });
            }}
            onReset={() => { setBezierAnimating(false); setBezierProgress(0); }}
            speed={bezierSpeed}
            onSpeedChange={setBezierSpeed}
            loop={bezierLoop}
            onLoopChange={setBezierLoop}
            visibility={bezierVisibility}
            onVisibilityChange={setBezierVisibility}
            onClear={clearBezier}
          />
        ) : tool === "ANIMATE" ? (
          <AnimationPanel
            hasSelection={!!selectedId}
            currentFrame={animFrame}
            maxFrames={animMaxFrames}
            frameRate={animFrameRate}
            isPlaying={animPlaying}
            loop={animLoop}
            keyframeFrames={selectedId ? getShapeKeyframeFrames(selectedId) : []}
            onJumpToFrame={jumpToAnimFrame}
            onTogglePlaying={() => setAnimPlaying((p) => !p)}
            onNextKeyframe={nextKeyframe}
            onPrevKeyframe={prevKeyframe}
            onAddKeyframe={addKeyframe}
            onDeleteKeyframe={deleteKeyframe}
            onMaxFramesChange={handleMaxFramesChange}
            onFrameRateChange={(v) => setAnimFrameRate(Math.round(v))}
            onLoopChange={setAnimLoop}
          />
        ) : (
          <Inspector
            selectedShape={selectedShape}
            onUpdateShape={handleUpdateShape}
            onMirrorX={handleMirrorX}
            onMirrorY={handleMirrorY}
            onResetShape={handleResetShape}
          />
        )}
      </div>


      <style>{`
        @import url('${FONT_IMPORT_URL}');
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
