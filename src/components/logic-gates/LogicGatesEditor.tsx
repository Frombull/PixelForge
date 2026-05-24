"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GateNode from "./GateNode";
import Sidebar from "./Sidebar";
import { simulate, type GateNode as GNode } from "./simulator";
import { GATE_CATALOG, type GateKind, type GateNodeData } from "./types";

const nodeTypes: NodeTypes = { gate: GateNode };

let idCounter = 1;
const nextId = () => `n${idCounter++}`;

function buildInitialGraph(): { nodes: GNode[]; edges: Edge[] } {
  // Half-adder demo
  const make = (id: string, kind: GateKind, x: number, y: number): GNode => ({
    id,
    type: "gate",
    position: { x, y },
    data: { kind, state: false },
  });

  const nodes = [
    make("demo-a",     "INPUT",  80,  100),
    make("demo-b",     "INPUT",  80,  220),
    make("demo-xor",   "XOR",   300,  110),
    make("demo-and",   "AND",   300,  240),
    make("demo-sum",   "OUTPUT", 520, 115),
    make("demo-carry", "OUTPUT", 520, 245),
  ];

  const edges: Edge[] = [
    { id: "e1", source: "demo-a",   target: "demo-xor",   sourceHandle: "out-0", targetHandle: "in-0" },
    { id: "e2", source: "demo-b",   target: "demo-xor",   sourceHandle: "out-0", targetHandle: "in-1" },
    { id: "e3", source: "demo-a",   target: "demo-and",   sourceHandle: "out-0", targetHandle: "in-0" },
    { id: "e4", source: "demo-b",   target: "demo-and",   sourceHandle: "out-0", targetHandle: "in-1" },
    { id: "e5", source: "demo-xor", target: "demo-sum",   sourceHandle: "out-0", targetHandle: "in-0" },
    { id: "e6", source: "demo-and", target: "demo-carry", sourceHandle: "out-0", targetHandle: "in-0" },
  ];

  return { nodes, edges };
}

// ─── Thin toolbar button ──────────────────────────────────────────────────────
function TBtn({
  children,
  onClick,
  active,
  danger,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const [hovered, setHovered] = useState(false);

  let borderColor = "#3a3a3a";
  let textColor = "#b0b0b0";
  let bg = "transparent";

  if (active) { borderColor = "#aaa"; textColor = "#fff"; bg = "#363636"; }
  else if (hovered && !disabled) {
    if (danger) { borderColor = "#f87171"; textColor = "#f87171"; }
    else { borderColor = "#666"; textColor = "#fff"; }
    bg = "#363636";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="font-mono text-[10px] tracking-[0.08em] uppercase px-3 h-6 rounded-xs transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      style={{ border: `1px solid ${borderColor}`, color: textColor, background: bg }}
    >
      {children}
    </button>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono text-[9px] tracking-[0.08em] text-[#6a6a6a]">
      {label} <span className="text-[#aaa]">{value}</span>
    </span>
  );
}

// ─── Inner editor (needs ReactFlow context) ───────────────────────────────────
function EditorInner() {
  const initial = useMemo(buildInitialGraph, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  // Raw topology — no style. Drives simulation and ReactFlow change handlers.
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds)),
    []
  );

  const addNode = useCallback(
    (kind: GateKind, position?: { x: number; y: number }) => {
      const pos = position ?? { x: 200 + Math.random() * 180, y: 160 + Math.random() * 160 };
      setNodes((nds) => [
        ...nds,
        { id: nextId(), type: "gate", position: pos, data: { kind, state: false } } as GNode,
      ]);
    },
    [setNodes]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/logic-gate") as GateKind;
      if (!kind || !GATE_CATALOG.find((g) => g.kind === kind)) return;
      addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [addNode, screenToFlowPosition]
  );

  // Simulation reads topology only — style fields on edges are irrelevant here.
  const simResult = useMemo(() => simulate(nodes as GNode[], edges), [nodes, edges, tick]);

  const decoratedNodes = useMemo(
    () =>
      nodes.map((n) => {
        const v = simResult.nodeValues.get(n.id) ?? false;
        return n.data.value === v ? n : { ...n, data: { ...n.data, value: v } };
      }),
    [nodes, simResult]
  );

  // Pure derivation — no setState, no side-effects, no loops.
  // ReactFlow receives this array; the raw `edges` state stays topology-only.
  const styledEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => {
        const on = simResult.edgeValues.get(e.id) ?? false;
        return {
          ...e,
          type: e.type || "smoothstep",
          animated: running && on,
          style: { stroke: on ? "#4ade80" : "#666", strokeWidth: on ? 2 : 1.5 },
        };
      }),
    [edges, simResult, running]
  );

  // Play loop
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      if (t - last >= 100) { setTick((k) => k + 1); last = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const handleStep = useCallback(() => setTick((k) => k + 1), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setNodes((nds) =>
      nds.map((n) =>
        n.data.kind === "INPUT" ? { ...n, data: { ...n.data, state: false } } : n
      )
    );
    setTick((k) => k + 1);
  }, [setNodes]);

  const handleClear = useCallback(() => {
    setRunning(false);
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

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
      {/* ── Sidebar ── */}
      <Sidebar onAdd={addNode} />

      {/* ── Stage ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-3 h-10 px-4 bg-[#2c2c2c] border-b border-[#3a3a3a] shrink-0">
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#aaa] mr-1">
            Editor de Portas Lógicas
          </span>

          <div className="h-4 w-px bg-[#3a3a3a]" />

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <TBtn active={running} onClick={() => setRunning((r) => !r)} title="Play / Pause">
              {running ? "❚❚ pause" : "▶ play"}
            </TBtn>
            <TBtn onClick={handleStep} disabled={running} title="Avaliar um ciclo">
              ⏭ step
            </TBtn>
            <TBtn onClick={handleReset} title="Zerar todos os INPUTs">
              ↺ reset
            </TBtn>
            <TBtn danger onClick={handleClear} title="Remover tudo">
              ✕ limpar
            </TBtn>
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3">
            <Stat label="gates" value={counts.gates} />
            <Stat label="in"    value={counts.inputs} />
            <Stat label="out"   value={counts.outputs} />
            <Stat label="wires" value={counts.wires} />
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={wrapperRef}
          className="flex-1 relative bg-[#161616] min-h-0"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={decoratedNodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { stroke: "#666", strokeWidth: 1.5 },
            }}
            connectionLineStyle={{ stroke: "#aaa", strokeWidth: 1.5, strokeDasharray: "4 3" }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#333"
            />
            <MiniMap
              pannable
              zoomable
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
        </div>
      </div>

      {/* ReactFlow dark-theme overrides (minimal — only what Tailwind can't reach) */}
      <style>{`
        /* Fix dark-mode edge visibility — default var is #3e3e3e (invisible on dark bg) */
        .react-flow {
          --xy-edge-stroke-default: #666;
          --xy-edge-stroke-width-default: 1.5;
          --xy-edge-stroke-selected-default: #aaa;
        }
        .react-flow__controls button {
          background: #2c2c2c;
          border-bottom: 1px solid #3a3a3a;
          color: #b0b0b0;
          fill: #b0b0b0;
        }
        .react-flow__controls button:hover {
          background: #363636;
          color: #fff;
          fill: #fff;
        }
        .react-flow__node.selected > div,
        .react-flow__node.selected > button {
          box-shadow: 0 0 0 1px #888 !important;
        }
        .react-flow__handle { cursor: crosshair; }
        .react-flow__connection-path { stroke: #aaa; }
      `}</style>
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
