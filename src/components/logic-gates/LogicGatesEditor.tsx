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
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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

// ─── Toolbar ──────────────────────────────────────────────────────────────────

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
  if (active)                  { border = "#aaa";    color = "#fff";    bg = "#363636"; }
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

// ─── Editor ───────────────────────────────────────────────────────────────────

function EditorInner() {
  const initial = useMemo(buildInitialGraph, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "wire" }, eds)),
    [setEdges],
  );

  const addNode = useCallback(
    (kind: GateKind, position?: { x: number; y: number }) => {
      const pos = position ?? { x: 200 + Math.random() * 180, y: 160 + Math.random() * 160 };
      setNodes((nds) => [...nds, { id: nextId(), type: "gate", position: pos, data: { kind, state: false } } as GNode]);
    },
    [setNodes],
  );

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/logic-gate") as GateKind;
    if (!kind || !GATE_CATALOG.find((g) => g.kind === kind)) return;
    addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [addNode, screenToFlowPosition]);

  const simResult = useMemo(() => simulate(nodes as GNode[], edges), [nodes, edges, tick]);

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

  const handleStep  = useCallback(() => setTick((k) => k + 1), []);
  const handleReset = useCallback(() => {
    setRunning(false);
    setNodes((nds) => nds.map((n) => n.data.kind === "INPUT" ? { ...n, data: { ...n.data, state: false } } : n));
    setTick((k) => k + 1);
  }, [setNodes]);
  const handleClear = useCallback(() => { setRunning(false); setNodes([]); setEdges([]); }, [setNodes, setEdges]);

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
          <div className="flex items-center gap-1.5">
            <TBtn active={running} onClick={() => setRunning((r) => !r)} title="Play / Pause">
              {running ? "❚❚ pause" : "▶ play"}
            </TBtn>
            <TBtn onClick={handleStep} disabled={running} title="Avaliar um ciclo">⏭ step</TBtn>
            <TBtn onClick={handleReset} title="Zerar todos os INPUTs">↺ reset</TBtn>
            <TBtn danger onClick={handleClear} title="Remover tudo">✕ limpar</TBtn>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Stat label="gates" value={counts.gates} />
            <Stat label="in"    value={counts.inputs} />
            <Stat label="out"   value={counts.outputs} />
            <Stat label="wires" value={counts.wires} />
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
        </div>
      </div>

      <style>{`
        .react-flow__edges, .react-flow__edges svg {
          width: 100%; height: 100%; position: absolute; top: 0; left: 0; overflow: visible;
        }
        .react-flow__controls button {
          background: #2c2c2c; border-bottom: 1px solid #3a3a3a; color: #b0b0b0; fill: #b0b0b0;
        }
        .react-flow__controls button:hover { background: #363636; color: #fff; fill: #fff; }
        .react-flow__node.selected > div,
        .react-flow__node.selected > button { box-shadow: 0 0 0 1px #888 !important; }
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
