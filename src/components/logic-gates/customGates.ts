import type { Edge } from "@xyflow/react";
import type { GateNode } from "./simulator";

export interface CustomGateDef {
  id: string;
  name: string;
  inputs: number;
  outputs: number;
  // IDs internos dos nós INPUT/OUTPUT ordenados por posição Y (top → bottom).
  // Definem o mapeamento handle externo → nó interno.
  inputIds: string[];
  outputIds: string[];
  // Labels exibidas ao lado de cada handle. Mesmo comprimento de inputIds/outputIds.
  inputNames: string[];
  outputNames: string[];
  nodes: GateNode[];
  edges: Edge[];
  createdAt: number;
}

const STORAGE_KEY = "polyforge.logic-gates.custom";
const CUSTOM_PREFIX = "custom:";

export function customKind(id: string): string {
  return `${CUSTOM_PREFIX}${id}`;
}

export function isCustomKind(kind: string): boolean {
  return kind.startsWith(CUSTOM_PREFIX);
}

export function customIdFromKind(kind: string): string {
  return kind.slice(CUSTOM_PREFIX.length);
}

export function loadCustomGates(): CustomGateDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migração: garante inputNames/outputNames em defs salvos antes do campo existir.
    return parsed.map((def: CustomGateDef) => ({
      ...def,
      inputNames:
        def.inputNames ?? def.inputIds.map((_, i) => `in${i}`),
      outputNames:
        def.outputNames ?? def.outputIds.map((_, i) => `out${i}`),
    }));
  } catch {
    return [];
  }
}

export function saveCustomGates(list: CustomGateDef[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sem espaço / modo privado — silencioso
  }
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomFromCanvas(
  name: string,
  nodes: GateNode[],
  edges: Edge[],
): CustomGateDef {
  const inputs = nodes
    .filter((n) => n.data.kind === "INPUT")
    .sort((a, b) => a.position.y - b.position.y);
  const outputs = nodes
    .filter((n) => n.data.kind === "OUTPUT")
    .sort((a, b) => a.position.y - b.position.y);

  // Clona — guardamos o snapshot estrutural sem o `value` runtime.
  const snapshotNodes: GateNode[] = nodes.map((n) => ({
    ...n,
    data: {
      kind: n.data.kind,
      state: !!n.data.state,
      ...(n.data.name ? { name: n.data.name } : {}),
    },
  }));
  const snapshotEdges: Edge[] = edges.map((e) => ({ ...e }));

  const pinName = (n: GateNode, idx: number, prefix: string) =>
    (n.data.name && n.data.name.trim()) || `${prefix}${idx}`;

  return {
    id: genId(),
    name: name.trim(),
    inputs: inputs.length,
    outputs: outputs.length,
    inputIds: inputs.map((n) => n.id),
    outputIds: outputs.map((n) => n.id),
    inputNames: inputs.map((n, i) => pinName(n, i, "in")),
    outputNames: outputs.map((n, i) => pinName(n, i, "out")),
    nodes: snapshotNodes,
    edges: snapshotEdges,
    createdAt: Date.now(),
  };
}
