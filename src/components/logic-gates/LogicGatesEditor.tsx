"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./logic-gates.css";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContextMenu, { type ContextMenuEntry } from "./ContextMenu";
import GateNode from "./GateNode";
import PropertiesSidebar from "./PropertiesSidebar";
import Sidebar from "./Sidebar";
import WireEdge from "./WireEdge";
import { WireCommitContext, type WireCommit } from "./wireEditContext";
import {
  buildCustomFromCanvas,
  loadCustomGates,
  saveCustomGates,
  type CustomGateDef,
} from "./customGates";
import { CustomGatesProvider } from "./customGatesContext";
import { nodeIsActive, outKey, simulate, type GateNode as GNode } from "./simulator";
import TruthTableNode from "./TruthTableNode";
import { buildTruthTable, currentRowIndex } from "./truthTable";
import { TruthTableProvider } from "./truthTableContext";
import { GATE_CATALOG, getDescriptor, type GateKind, type GateNodeData } from "./types";

const TRUTH_TABLE_KIND = "TRUTHTABLE";
const TRUTH_TABLE_TYPE = "truthtable";

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

const nodeTypes: NodeTypes = { gate: GateNode, truthtable: TruthTableNode };
const edgeTypes: EdgeTypes = { wire: WireEdge };

const GRID = 24;
const snap = (v: number) => Math.round(v / GRID) * GRID;
const snapPos = (p: { x: number; y: number }) => ({ x: snap(p.x), y: snap(p.y) });

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

// ─── Shared colors ────────────────────────────────────────────────────────────

const C = {
  panel:      "#2c2c2c",
  panelAlt:   "#363636",
  border:     "#3a3a3a",
  borderAct:  "#888888",
  textMid:    "#b0b0b0",
  textBright: "#ffffff",
  textSubtle: "#6a6a6a",
} as const;

// ─── Action button ─────────────────────────────────────────

function ActionButton({
  label,
  shortcut,
  onClick,
  disabled,
  active,
  danger,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  const bg    = active   ? C.panelAlt
              : (hovered && !disabled) ? C.panelAlt
              : C.panel;
  const color = disabled ? C.textSubtle
              : danger && hovered ? "#f87171"
              : active  ? C.textBright
              : hovered ? C.textBright
              : C.textMid;
  const borderColor = active   ? C.borderAct
                    : danger && hovered ? "#f87171"
                    : C.border;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        color,
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
        transition: "color 0.1s, background 0.1s, border-color 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {shortcut && (
        <span style={{ fontSize: 9, color: C.textSubtle }}>{shortcut}</span>
      )}
    </button>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.08em",
        color: C.textSubtle,
      }}
    >
      {label} <span style={{ color: "#aaa" }}>{value}</span>
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
        bottom: 12,
        left: 64,
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

  const [nodes, setNodes] = useState<GNode[]>(initial.nodes as GNode[]);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [customs, setCustoms] = useState<CustomGateDef[]>([]);

  // Carrega customs do localStorage no mount (client-side only).
  useEffect(() => {
    setCustoms(loadCustomGates());
  }, []);

  const [history, setHistory] = useState<History>(() =>
    makeHistory({ nodes: initial.nodes as GNode[], edges: initial.edges })
  );

  const [actionLog, setActionLog] = useState<string[]>([]);
  const flash = useCallback((msg: string) => {
    setActionLog((prev) => [...prev.slice(-3), msg]);
  }, []);

  const live = useRef({ nodes, edges, history });
  live.current = { nodes, edges, history };

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const clipboard = useRef<{ nodes: GNode[]; edges: Edge[] } | null>(null);
  const pasteCount = useRef(0);
  const { screenToFlowPosition } = useReactFlow();

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);
  const [renameTick, setRenameTick] = useState(0);
  // Ref pra acessar duplicateSelection dentro do handler de atalhos
  // sem ter que reordenar declarações.
  const duplicateRef = useRef<() => void>(() => {});

  // ── Commit ────────────────────────────────────────────────────────────────────
  const commit = useCallback((newNodes: GNode[], newEdges: Edge[], label?: string) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setHistory((h) => pushSnapshot(h, { nodes: newNodes, edges: newEdges }));
    if (label) flash(label);
  }, [flash]);

  // ── Undo / Redo ───────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const result = undoSnapshot(live.current.history);
    if (!result) return;
    setHistory(result.history);
    setNodes(result.snapshot.nodes);
    setEdges(result.snapshot.edges);
    flash("undo");
  }, [flash]);

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

  // ── Copy / Paste ──────────────────────────────────────────────────────────────
  const copySelection = useCallback(() => {
    const selectedNodes = live.current.nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = live.current.edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    clipboard.current = {
      nodes: selectedNodes.map((n) => ({
        ...n,
        data: { ...n.data },
      })),
      edges: internalEdges.map((e) => ({ ...e })),
    };
    pasteCount.current = 0;
    flash(selectedNodes.length === 1 ? "copiado" : `${selectedNodes.length} copiados`);
  }, [flash]);

  const pasteClipboard = useCallback((target?: { x: number; y: number }) => {
    const clip = clipboard.current;
    if (!clip || clip.nodes.length === 0) return;

    // Se um alvo foi passado (ex: context menu), ancoramos o canto superior
    // esquerdo do bounding box no alvo. Senão, offset incremental.
    let delta: { x: number; y: number };
    if (target) {
      const minX = Math.min(...clip.nodes.map((n) => n.position.x));
      const minY = Math.min(...clip.nodes.map((n) => n.position.y));
      delta = { x: target.x - minX, y: target.y - minY };
      pasteCount.current = 0;
    } else {
      pasteCount.current += 1;
      const offset = GRID * 2 * pasteCount.current;
      delta = { x: offset, y: offset };
    }

    const idMap = new Map<string, string>();
    const newNodes: GNode[] = clip.nodes.map((n) => {
      const newId = nextId();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: snapPos({ x: n.position.x + delta.x, y: n.position.y + delta.y }),
        selected: true,
        data: { ...n.data, value: undefined },
      };
    });

    const newEdges: Edge[] = clip.edges.map((e) => ({
      ...e,
      id: `e${idCounter++}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      selected: true,
    }));

    const deselectedExisting: GNode[] = live.current.nodes.map((n) =>
      n.selected ? { ...n, selected: false } : n,
    );
    const deselectedExistingEdges: Edge[] = live.current.edges.map((e) =>
      e.selected ? { ...e, selected: false } : e,
    );

    const mergedNodes = [...deselectedExisting, ...newNodes];
    const mergedEdges = [...deselectedExistingEdges, ...newEdges];
    commit(mergedNodes, mergedEdges, newNodes.length === 1 ? "colado" : `${newNodes.length} colados`);
  }, [commit]);

  // ── Atalhos de teclado ────────────────────────────────────────────────────────
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      // F2 → renomeia nó selecionado
      if (e.key === "F2") {
        const sel = live.current.nodes.filter((n) => n.selected);
        if (sel.length === 1) {
          e.preventDefault();
          setRenameTick((t) => t + 1);
        }
        return;
      }
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); return; }
      if (e.key === "c" || e.key === "C") { e.preventDefault(); copySelection(); return; }
      if (e.key === "v" || e.key === "V") { e.preventDefault(); pasteClipboard(); return; }
      if (e.key === "d" || e.key === "D") { e.preventDefault(); duplicateRef.current(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, copySelection, pasteClipboard]);

  // ── onNodesChange ─────────────────────────────────────────────────────────────
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const next = applyNodeChanges(changes, live.current.nodes) as GNode[];
    const hasRemove   = changes.some((c) => c.type === "remove");
    const nowDragging = changes.some((c) => c.type === "position" && (c as { dragging?: boolean }).dragging === true);
    const dragEnded   = changes.some((c) => c.type === "position" && (c as { dragging?: boolean }).dragging === false);

    if (hasRemove) {
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
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const next = applyEdgeChanges(changes, live.current.edges);
    setEdges(next);
    const removals = changes.filter((c) => c.type === "remove");
    if (removals.length === 0) return;
    const currentEdgeIds = new Set(live.current.edges.map((e) => e.id));
    const isManualDelete = removals.some((c) => currentEdgeIds.has(c.id));
    if (!isManualDelete) return;
    setHistory((h) => pushSnapshot(h, { nodes: live.current.nodes, edges: next }));
    flash(removals.length === 1 ? "fio removido" : `${removals.length} fios removidos`);
  }, [flash]);

  // ── Connect ───────────────────────────────────────────────────────────────────
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

  // ── Commit de fim de drag de fio (segmento do meio) ───────────────────────────
  const wireCommit: WireCommit = useCallback(
    (label) => {
      setHistory((h) =>
        pushSnapshot(h, { nodes: live.current.nodes, edges: live.current.edges }),
      );
      if (label) flash(label);
    },
    [flash],
  );

  // ── Adicionar nó ──────────────────────────────────────────────────────────────
  const addNode = useCallback(
    (kind: GateKind, position?: { x: number; y: number }) => {
      const raw = position ?? { x: 200 + Math.random() * 180, y: 160 + Math.random() * 160 };
      const pos = snapPos(raw);
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

  // ── Botão direito para pan (bloqueia context menu) ────────────────────────────
  // O ReactFlow usa panOnDrag={[1, 2]} para aceitar MB do meio e MB direito.
  // O context menu do browser é bloqueado via onContextMenu no wrapper.
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ── Simulação ─────────────────────────────────────────────────────────────────
  const gateNodes = useMemo(
    () => nodes.filter((n) => n.type !== TRUTH_TABLE_TYPE) as GNode[],
    [nodes],
  );

  const simResult = useMemo(
    () => simulate(gateNodes, edges, customs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gateNodes, edges, customs, tick],
  );

  // Chave estrutural: muda só quando topologia / kind / nome de pin muda.
  // Evita rebuild da tabela quando o user só toggla um INPUT.
  const structuralKey = useMemo(() => {
    const nk = gateNodes
      .map((n) => `${n.id}:${n.data.kind}:${n.data.name ?? ""}`)
      .join("|");
    const ek = edges
      .map((e) => `${e.id}:${e.source}>${e.target}:${e.sourceHandle ?? ""}/${e.targetHandle ?? ""}`)
      .join("|");
    return `${nk}#${ek}`;
  }, [gateNodes, edges]);

  const truthTableData = useMemo(
    () => buildTruthTable(gateNodes, edges, customs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structuralKey, customs],
  );

  const truthTableRow = useMemo(
    () => currentRowIndex(truthTableData, gateNodes),
    [truthTableData, gateNodes],
  );

  const decoratedNodes = useMemo(() =>
    nodes.map((n) => {
      if (n.type === TRUTH_TABLE_TYPE) return n;
      const desc = getDescriptor(n.data.kind, customs);
      const outCount = desc.outputs;
      let v: boolean;
      if (n.data.kind === "OUTPUT") {
        v = simResult.nodeValues.get(outKey(n.id, "out-0")) ?? false;
      } else {
        v = nodeIsActive(n.id, outCount, simResult.nodeValues);
      }
      return (n.data.value ?? false) === v ? n : { ...n, data: { ...n.data, value: v } };
    }),
  [nodes, simResult, customs]);

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

  // ── Salvar canvas como custom gate ────────────────────────────────────────────
  const handleSaveAsGate = useCallback(() => {
    const gateOnly = nodes.filter((n) => n.type !== TRUTH_TABLE_TYPE) as GNode[];
    const gateIds = new Set(gateOnly.map((n) => n.id));
    const gateEdges = edges.filter(
      (e) => gateIds.has(e.source) && gateIds.has(e.target),
    );
    const inCount = gateOnly.filter((n) => n.data.kind === "INPUT").length;
    const outCount = gateOnly.filter((n) => n.data.kind === "OUTPUT").length;
    if (inCount === 0 && outCount === 0) {
      flash("nada pra salvar");
      return;
    }
    const name = window.prompt(
      `Nome da nova porta (${inCount} in / ${outCount} out):`,
    );
    if (!name || !name.trim()) return;
    const def = buildCustomFromCanvas(name, gateOnly, gateEdges);
    setCustoms((prev) => {
      const next = [...prev, def];
      saveCustomGates(next);
      return next;
    });
    flash(`salvo: ${def.name}`);
  }, [nodes, edges, flash]);

  // ── Inserir Truth Table ───────────────────────────────────────────────────────
  const addTruthTable = useCallback(() => {
    const pos = snapPos({ x: 640, y: 80 + Math.random() * 80 });
    const newNode: GNode = {
      id: nextId(),
      type: TRUTH_TABLE_TYPE,
      position: pos,
      data: { kind: TRUTH_TABLE_KIND, state: false },
    };
    setNodes((nds) => {
      const next = [...nds, newNode] as GNode[];
      setHistory((h) => pushSnapshot(h, { nodes: next, edges: live.current.edges }));
      flash("+ truth table");
      return next;
    });
  }, [flash]);

  const handleDeleteCustom = useCallback(
    (id: string) => {
      setCustoms((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveCustomGates(next);
        return next;
      });
      flash("custom removido");
    },
    [flash],
  );

  const handleRenameNode = useCallback(
    (nodeId: string, name: string) => {
      const trimmed = name.trim();
      const nextNodes = live.current.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = { ...n.data };
        if (trimmed) data.name = trimmed;
        else delete data.name;
        return { ...n, data };
      });
      commit(nextNodes, live.current.edges, trimmed ? "renomear" : "remover nome");
    },
    [commit],
  );

  // ── Seleção ───────────────────────────────────────────────────────────────────
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedNode =
    selectedNodes.length === 1
      ? decoratedNodes.find((n) => n.id === selectedNodes[0].id) ?? selectedNodes[0]
      : null;

  // ── Ações reutilizadas pelo menu ──────────────────────────────────────────────
  const selectOnly = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.selected === (n.id === nodeId) ? n : { ...n, selected: n.id === nodeId })),
    );
    setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)));
  }, []);

  const deleteNodesByIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      const nextNodes = live.current.nodes.filter((n) => !idSet.has(n.id));
      const nextEdges = live.current.edges.filter(
        (e) => !idSet.has(e.source) && !idSet.has(e.target),
      );
      commit(nextNodes, nextEdges, ids.length === 1 ? "nó removido" : `${ids.length} nós removidos`);
    },
    [commit],
  );

  const toggleInputState = useCallback(
    (nodeId: string) => {
      const nextNodes = live.current.nodes.map((n) =>
        n.id === nodeId && n.data.kind === "INPUT"
          ? { ...n, data: { ...n.data, state: !n.data.state } }
          : n,
      );
      setNodes(nextNodes);
    },
    [],
  );

  const duplicateSelection = useCallback(() => {
    const sel = live.current.nodes.filter((n) => n.selected);
    if (sel.length === 0) return;
    const selectedIds = new Set(sel.map((n) => n.id));
    const internalEdges = live.current.edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    const offset = GRID * 2;
    const idMap = new Map<string, string>();
    const cloned: GNode[] = sel.map((n) => {
      const newId = nextId();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: snapPos({ x: n.position.x + offset, y: n.position.y + offset }),
        selected: true,
        data: { ...n.data, value: undefined },
      };
    });
    const newEdges: Edge[] = internalEdges.map((e) => ({
      ...e,
      id: `e${idCounter++}`,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
      selected: true,
    }));
    const baseNodes = live.current.nodes.map((n) =>
      n.selected ? { ...n, selected: false } : n,
    );
    const baseEdges = live.current.edges.map((e) =>
      e.selected ? { ...e, selected: false } : e,
    );
    commit(
      [...baseNodes, ...cloned],
      [...baseEdges, ...newEdges],
      cloned.length === 1 ? "duplicado" : `${cloned.length} duplicados`,
    );
  }, [commit]);

  const requestRename = useCallback((nodeId: string) => {
    selectOnly(nodeId);
    setRenameTick((t) => t + 1);
  }, [selectOnly]);

  // Mantém o ref do atalho Ctrl+D apontando pra função atual.
  useEffect(() => {
    duplicateRef.current = duplicateSelection;
  }, [duplicateSelection]);

  // ── Context menu ──────────────────────────────────────────────────────────────
  const closeMenu = useCallback(() => setMenu(null), []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: GNode) => {
      event.preventDefault();
      const isAlreadySelected = node.selected;
      if (!isAlreadySelected) selectOnly(node.id);
      setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    },
    [selectOnly],
  );

  const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setMenu({ x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY, nodeId: null });
  }, []);

  const menuItems: ContextMenuEntry[] = useMemo(() => {
    if (!menu) return [];
    const hasClipboard = !!clipboard.current && clipboard.current.nodes.length > 0;
    const pasteHere = () =>
      pasteClipboard(snapPos(screenToFlowPosition({ x: menu.x, y: menu.y })));

    if (menu.nodeId) {
      const node = live.current.nodes.find((n) => n.id === menu.nodeId);
      const selCount = live.current.nodes.filter((n) => n.selected).length;
      const targetCount = Math.max(selCount, 1);
      const items: ContextMenuEntry[] = [
        {
          label: "Renomear",
          shortcut: "F2",
          onClick: () => requestRename(menu.nodeId!),
        },
        "separator",
        {
          label: targetCount > 1 ? `Copiar (${targetCount})` : "Copiar",
          shortcut: "Ctrl+C",
          onClick: copySelection,
        },
        {
          label: targetCount > 1 ? `Duplicar (${targetCount})` : "Duplicar",
          shortcut: "Ctrl+D",
          onClick: duplicateSelection,
        },
        {
          label: "Colar aqui",
          shortcut: "Ctrl+V",
          onClick: pasteHere,
          disabled: !hasClipboard,
        },
      ];
      if (node?.data.kind === "INPUT") {
        items.push("separator", {
          label: node.data.state ? "Desligar (→ 0)" : "Ligar (→ 1)",
          onClick: () => toggleInputState(menu.nodeId!),
        });
      }
      items.push(
        "separator",
        {
          label: targetCount > 1 ? `Deletar (${targetCount})` : "Deletar",
          shortcut: "Del",
          onClick: () => {
            const ids = live.current.nodes.filter((n) => n.selected).map((n) => n.id);
            deleteNodesByIds(ids.length > 0 ? ids : [menu.nodeId!]);
          },
          danger: true,
        },
      );
      return items;
    }

    // Pane (vazio)
    return [
      {
        label: "Colar aqui",
        shortcut: "Ctrl+V",
        onClick: pasteHere,
        disabled: !hasClipboard,
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, copySelection, duplicateSelection, pasteClipboard, deleteNodesByIds, toggleInputState, requestRename, screenToFlowPosition]);

  const counts = useMemo(() => {
    let gates = 0, inputs = 0, outputs = 0;
    for (const n of nodes) {
      if (n.type === TRUTH_TABLE_TYPE)        continue;
      else if (n.data.kind === "INPUT")  inputs++;
      else if (n.data.kind === "OUTPUT") outputs++;
      else                               gates++;
    }
    return { gates, inputs, outputs, wires: edges.length };
  }, [nodes, edges]);

  return (
    <CustomGatesProvider value={customs}>
    <TruthTableProvider value={{ data: truthTableData, currentRow: truthTableRow }}>
    <WireCommitContext.Provider value={wireCommit}>
    <div className="flex h-screen overflow-hidden bg-[#1e1e1e] font-mono text-white">
      <Sidebar onAdd={addNode} customs={customs} onDeleteCustom={handleDeleteCustom} />

      {/* Canvas — ocupa todo o restante, sem toolbar */}
      <div
        ref={wrapperRef}
        className="flex-1 relative bg-[#161616] min-h-0"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onContextMenu={handleContextMenu}
      >
        <ReactFlow
          nodes={decoratedNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "wire" }}
          connectionLineStyle={{ stroke: "#aaa", strokeWidth: 1.5, strokeDasharray: "4 3" }}
          deleteKeyCode={["Backspace", "Delete"]}
          // MB do meio (1) e MB direito (2) arrastam a câmera; click direito
          // sem drag dispara onPaneContextMenu / onNodeContextMenu.
          panOnDrag={[1, 2]}
          selectionOnDrag
          selectionMode={SelectionMode.Partial}
          snapToGrid
          snapGrid={[GRID, GRID]}
        >
          <Background variant={BackgroundVariant.Dots} gap={GRID} size={1} color="#333" />
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

        {/* ── Botões de ação — topo esquerdo (estilo canvas-2d) ── */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Linha 1: histórico + simulação */}
          <div style={{ display: "flex", gap: 2 }}>
            <ActionButton label="UNDO"  shortcut="^Z"  onClick={undo}                    disabled={!canUndo} />
            <ActionButton label="REDO"  shortcut="^Y"  onClick={redo}                    disabled={!canRedo} />
            <div style={{ width: 1, background: C.border, margin: "0 2px", alignSelf: "stretch" }} />
            <ActionButton
              label={running ? "❚❚ PAUSE" : "▶ PLAY"}
              onClick={() => setRunning((r) => !r)}
              active={running}
            />
            <ActionButton label="↺ RESET" onClick={handleReset} />
            <ActionButton label="✕ LIMPAR" onClick={handleClear} danger />
            <div style={{ width: 1, background: C.border, margin: "0 2px", alignSelf: "stretch" }} />
            <ActionButton label="⎘ SAVE GATE" onClick={handleSaveAsGate} />
            <div style={{ width: 1, background: C.border, margin: "0 2px", alignSelf: "stretch" }} />
            <ActionButton label="⊞ TRUTH TABLE" onClick={addTruthTable} />
          </div>

          {/* Linha 2: stats */}
          <div style={{ display: "flex", gap: 10, paddingLeft: 2 }}>
            <Stat label="gates"  value={counts.gates}   />
            <Stat label="in"     value={counts.inputs}  />
            <Stat label="out"    value={counts.outputs} />
            <Stat label="wires"  value={counts.wires}   />
          </div>
        </div>

        {/* Action log — canto inferior esquerdo */}
        <ActionLog log={actionLog} />
      </div>

      <PropertiesSidebar
        node={selectedNode}
        selectionCount={selectedNodes.length}
        customs={customs}
        onRename={handleRenameNode}
        focusRenameSignal={renameTick}
      />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={closeMenu}
        />
      )}
    </div>
    </WireCommitContext.Provider>
    </TruthTableProvider>
    </CustomGatesProvider>
  );
}

export default function LogicGatesEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
