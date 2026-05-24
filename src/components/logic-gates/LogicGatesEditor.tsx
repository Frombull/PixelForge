"use client";

import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getSmoothStepPath,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./logic-gates.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GateNode from "./GateNode";
import Sidebar from "./Sidebar";
import { simulate, type GateNode as GNode } from "./simulator";
import { GATE_CATALOG, type GateKind, type GateNodeData } from "./types";

// ─── Wire edge ────────────────────────────────────────────────────────────────

function WireEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, selected }: EdgeProps) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 8 });
  const s = style as React.CSSProperties & { stroke?: string; strokeWidth?: number };
  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{ stroke: selected ? "#ccc" : (s?.stroke ?? "#888"), strokeWidth: s?.strokeWidth ?? 1.5, fill: "none" }}
    />
  );
}

// ─── Histórico (Undo / Redo) ──────────────────────────────────────────────────

interface Snapshot {
  nodes: GNode[];
  edges: Edge[];
}

interface History {
  stack: Snapshot[];
  index: number;
}

function makeHistory(snapshot: Snapshot): History {
  return { stack: [snapshot], index: 0 };
}

function pushSnapshot(history: History, snapshot: Snapshot): History {
  const trimmed = history.stack.slice(0, history.index + 1);
  const stack = [...trimmed, snapshot].slice(-64);
  return { stack, index: stack.length - 1 };
}

function undoSnapshot(history: History): { history: History; snapshot: Snapshot } | null {
  if (history.index <= 0) return null;
  const index = history.index - 1;
  return { history: { ...history, index }, snapshot: history.stack[index] };
}

function redoSnapshot(history: History): { history: History; snapshot: Snapshot } | null {
  if (history.index >= history.stack.length - 1) return null;
  const index = history.index + 1;
  return { history: { ...history, index }, snapshot: history.stack[index] };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = { gate: GateNode };
const edgeTypes: EdgeTypes = { wire: WireEdge };

let idCounter = 1;
const nextId = () => `n${idCounter++}`;

// ─── Grafo inicial ────────────────────────────────────────────────────────────

function buildInitialGraph(): { nodes: GNode[]; edges: Edge[] } {
  const make = (id: string, kind: GateKind, x: number, y: number): GNode => ({
    id, type: "gate", position: { x, y }, data: { kind, state: false },
  });
  return {
    nodes: [
      make("demo-a",     "INPUT",  80,  100),
      make("demo-b",     "INPUT",  80,  220),
      make("demo-xor",   "XOR",   300,  110),
      make("demo-and",   "AND",   300,  240),
      make("demo-sum",   "OUTPUT", 520, 115),
      make("demo-carry", "OUTPUT", 520, 245),
    ],
    edges: [
      { id: "e1", type: "wire", source: "demo-a",   target: "demo-xor",   sourceHandle: "out-0", targetHandle: "in-0" },
      { id: "e2", type: "wire", source: "demo-b",   target: "demo-xor",   sourceHandle: "out-0", targetHandle: "in-1" },
      { id: "e3", type: "wire", source: "demo-a",   target: "demo-and",   sourceHandle: "out-0", targetHandle: "in-0" },
      { id: "e4", type: "wire", source: "demo-b",   target: "demo-and",   sourceHandle: "out-0", targetHandle: "in-1" },
      { id: "e5", type: "wire", source: "demo-xor", target: "demo-sum",   sourceHandle: "out-0", targetHandle: "in-0" },
      { id: "e6", type: "wire", source: "demo-and", target: "demo-carry", sourceHandle: "out-0", targetHandle: "in-0" },
    ],
  };
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function TBtn({ children, onClick, active, danger, disabled, title }: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const [hovered, setHovered] = useState(false);
  let border = "#3a3a3a", color = "#b0b0b0", bg = "transparent";
  if (active)                    { border = "#aaa";    color = "#fff";    bg = "#363636"; }
  else if (hovered && !disabled) { border = danger ? "#f87171" : "#666"; color = danger ? "#f87171" : "#fff"; bg = "#363636"; }
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="font-mono text-[10px] tracking-[0.08em] uppercase px-3 h-6 rounded-xs transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      style={{ border: `1px solid ${border}`, color, background: bg }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono text-[9px] tracking-[0.08em] text-[#6a6a6a]">
      {label} <span className="text-[#aaa]">{value}</span>
    </span>
  );
}

// ─── Action Log overlay ───────────────────────────────────────────────────────

function ActionLog({ log }: { log: string[] }) {
  if (log.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: 12,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        zIndex: 10,
      }}
    >
      {log.map((msg, i) => {
        const opacity = 0.15 + (i / (log.length - 1 || 1)) * 0.85;
        return (
          <span
            key={i}
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              letterSpacing: "0.1em",
              color: "#6a6a6a",
              opacity,
            }}
          >
            {msg.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorInner() {
  const initial = useMemo(buildInitialGraph, []);

  // Estado bruto dos nodes/edges (controlado manualmente, sem useNodesState)
  const [nodes, setNodes] = useState<GNode[]>(initial.nodes as GNode[]);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);

  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  // ── Histórico ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<History>(() =>
    makeHistory({ nodes: initial.nodes as GNode[], edges: initial.edges })
  );

  // ── Action log (últimas 4 ações) ──────────────────────────────────────────
  const [actionLog, setActionLog] = useState<string[]>([]);
  const flash = useCallback((msg: string) => {
    setActionLog((prev) => [...prev.slice(-3), msg]);
  }, []);

  // Live ref para atalhos de teclado (evita stale closure)
  const live = useRef({ nodes, edges, history });
  live.current = { nodes, edges, history };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const { screenToFlowPosition } = useReactFlow();

  // ── Commit: aplica snapshot e salva no histórico ──────────────────────────────
  const commit = useCallback((newNodes: GNode[], newEdges: Edge[], label?: string) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setHistory((h) => pushSnapshot(h, { nodes: newNodes, edges: newEdges }));
    if (label) flash(label);
  }, [flash]);

  // ── Undo ─────────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const result = undoSnapshot(live.current.history);
    if (!result) return;
    setHistory(result.history);
    setNodes(result.snapshot.nodes);
    setEdges(result.snapshot.edges);
    flash("undo");
  }, [flash]);

  // ── Redo ─────────────────────────────────────────────────────────────────────
  const redo = useCallback(() => {
    const result = redoSnapshot(live.current.history);
    if (!result) return;
    setHistory(result.history);
    setNodes(result.snapshot.nodes);
    setEdges(result.snapshot.edges);
    flash("redo");
  }, [flash]);

  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  // ── Atalhos de teclado (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z) ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── onNodesChange ─────────────────────────────────────────────────────────────
  // Lê nodes/edges do live.current (fora de updaters) para operar atomicamente.
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const next = applyNodeChanges(changes, live.current.nodes) as GNode[];

    const hasRemove   = changes.some((c) => c.type === "remove");
    const nowDragging = changes.some((c) => c.type === "position" && (c as { dragging?: boolean }).dragging === true);
    const dragEnded   = changes.some((c) => c.type === "position" && (c as { dragging?: boolean }).dragging === false);

    if (hasRemove) {
      // Filtra edges órfãos no mesmo snapshot — um único undo desfaz tudo.
      const nodeIds    = new Set(next.map((n) => n.id));
      const cleanEdges = live.current.edges.filter(
        (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
      );
      const removed = changes.filter((c) => c.type === "remove").length;
      setNodes(next);
      setEdges(cleanEdges);
      setHistory((h) => pushSnapshot(h, { nodes: next, edges: cleanEdges }));
      flash(removed === 1 ? "nó removido" : `${removed} nós removidos`);
    } else {
      setNodes(next);
      if (nowDragging) {
        isDragging.current = true;
      } else if (dragEnded && isDragging.current) {
        isDragging.current = false;
        setHistory((h) => pushSnapshot(h, { nodes: next, edges: live.current.edges }));
        flash("mover");
      }
    }
  }, [flash]);

  // ── onEdgesChange ─────────────────────────────────────────────────────────────
  // Só salva snapshot em remoções manuais de fio (não as disparadas por delete de nó,
  // que já foram tratadas atomicamente em onNodesChange acima).
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const next = applyEdgeChanges(changes, live.current.edges);
    setEdges(next);

    const removals = changes.filter((c) => c.type === "remove");
    if (removals.length === 0) return;

    // Se todos os fios removidos já sumiram do live (nó deletado tratou antes), ignora.
    const currentEdgeIds = new Set(live.current.edges.map((e) => e.id));
    const isManualDelete = removals.some((c) => currentEdgeIds.has(c.id));
    if (!isManualDelete) return;

    setHistory((h) => pushSnapshot(h, { nodes: live.current.nodes, edges: next }));
    flash(removals.length === 1 ? "fio removido" : `${removals.length} fios removidos`);
  }, [flash]);

  // ── Connect: adiciona fio e salva snapshot ────────────────────────────────────
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge({ ...params, type: "wire" }, eds);
        setHistory((h) => pushSnapshot(h, { nodes: live.current.nodes, edges: next }));
        flash("fio conectado");
        return next;
      });
    },
    [flash],
  );

  // ── Adicionar nó ─────────────────────────────────────────────────────────────
  const addNode = useCallback(
    (kind: GateKind, position?: { x: number; y: number }) => {
      const pos = position ?? { x: 200 + Math.random() * 180, y: 160 + Math.random() * 160 };
      const newNode: GNode = { id: nextId(), type: "gate", position: pos, data: { kind, state: false } };
      setNodes((nds) => {
        const next = [...nds, newNode] as GNode[];
        setHistory((h) => pushSnapshot(h, { nodes: next, edges: live.current.edges }));
        flash(`+ ${kind.toLowerCase()}`);
        return next;
      });
    },
    [flash],
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/logic-gate") as GateKind;
    if (!kind || !GATE_CATALOG.find((g) => g.kind === kind)) return;
    addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [addNode, screenToFlowPosition]);

  // ── Simulação ─────────────────────────────────────────────────────────────────
  const simResult = useMemo(() => simulate(nodes, edges), [nodes, edges, tick]);

  const decoratedNodes = useMemo(() =>
    nodes.map((n) => {
      const v = simResult.nodeValues.get(n.id) ?? false;
      return (n.data.value ?? false) === v ? n : { ...n, data: { ...n.data, value: v } };
    }),
  [nodes, simResult]);

  const styledEdges = useMemo<Edge[]>(() =>
    edges.map((e) => {
      const on = simResult.edgeValues.get(e.id) ?? false;
      return { ...e, type: "wire", animated: running && on, style: { stroke: on ? "#4ade80" : "#888", strokeWidth: on ? 2.5 : 1.5 } };
    }),
  [edges, simResult, running]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((k) => k + 1), 100);
    return () => clearInterval(id);
  }, [running]);

  // ── Controles ─────────────────────────────────────────────────────────────────
  const handleStep = useCallback(() => setTick((k) => k + 1), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setNodes((nds) => nds.map((n) => n.data.kind === "INPUT" ? { ...n, data: { ...n.data, state: false } } : n));
    setTick((k) => k + 1);
    flash("reset");
  }, [flash]);

  const handleClear = useCallback(() => {
    setRunning(false);
    commit([], [], "limpar");
  }, [commit]);

  const counts = useMemo(() => {
    let gates = 0, inputs = 0, outputs = 0;
    for (const n of nodes) {
      if      (n.data.kind === "INPUT")  inputs++;
      else if (n.data.kind === "OUTPUT") outputs++;
      else                               gates++;
    }
    return { gates, inputs, outputs, wires: edges.length };
  }, [nodes, edges]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1e1e1e] font-mono text-white">
      <Sidebar onAdd={addNode} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 h-10 px-4 bg-[#2c2c2c] border-b border-[#3a3a3a] shrink-0">
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#aaa] mr-1">
            Editor de Portas Lógicas
          </span>
          <div className="h-4 w-px bg-[#3a3a3a]" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <TBtn onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)">↩ undo</TBtn>
            <TBtn onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)">↪ redo</TBtn>
          </div>
          <div className="h-4 w-px bg-[#3a3a3a]" />

          {/* Simulação */}
          <div className="flex items-center gap-1.5">
            <TBtn active={running} onClick={() => setRunning((r) => !r)} title="Play / Pause">
              {running ? "❚❚ pause" : "▶ play"}
            </TBtn>
            <TBtn onClick={handleStep} disabled={running} title="Avaliar um ciclo">⏭ step</TBtn>
            <TBtn onClick={handleReset} title="Zerar todos os INPUTs">↺ reset</TBtn>
            <TBtn danger onClick={handleClear} title="Remover tudo">✕ limpar</TBtn>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Stat label="gates"  value={counts.gates} />
            <Stat label="in"     value={counts.inputs} />
            <Stat label="out"    value={counts.outputs} />
            <Stat label="wires"  value={counts.wires} />
          </div>
        </div>

        {/* Canvas */}
        <div ref={wrapperRef} className="flex-1 relative bg-[#161616] min-h-0" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={decoratedNodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "wire" }}
            connectionLineStyle={{ stroke: "#aaa", strokeWidth: 1.5, strokeDasharray: "4 3" }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#333" />
            <MiniMap
              pannable zoomable
              nodeColor={(n) => {
                const k = (n.data as GateNodeData)?.kind;
                if (k === "INPUT")  return "#4ade80";
                if (k === "OUTPUT") return "#f87171";
                return "#555";
              }}
              maskColor="rgba(22,22,22,0.75)"
              style={{ background: "#1e1e1e", border: "1px solid #3a3a3a", borderRadius: 2 }}
            />
            <Controls
              showInteractive={false}
              style={{ background: "#2c2c2c", border: "1px solid #3a3a3a", borderRadius: 2 }}
            />
          </ReactFlow>

          {/* Action log — bottom left */}
          <ActionLog log={actionLog} />
        </div>
      </div>
    </div>
  );
}

export default function LogicGatesEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
