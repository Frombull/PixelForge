import type { Edge } from "@xyflow/react";
import type { CustomGateDef } from "./customGates";
import { outKey, simulate, type GateNode } from "./simulator";

export const TRUTH_TABLE_MAX_INPUTS = 8;

export interface PinInfo {
  id: string;
  label: string;
}

export type TruthTableStatus =
  | "ok"
  | "empty"
  | "no-outputs"
  | "no-inputs"
  | "overflow";

export interface TruthTableData {
  inputs: PinInfo[];
  outputs: PinInfo[];
  // 2^inputs.length linhas. Cada linha tem outputs.length booleanos.
  // Bit MSB = primeiro input (índice 0). Ex.: 3 inputs, linha 5 (101) = [1, 0, 1].
  rows: boolean[][] | null;
  status: TruthTableStatus;
  inputCount: number;
}

function pinLabel(node: GateNode, idx: number, prefix: string): string {
  const name = node.data.name?.trim();
  return name && name.length > 0 ? name : `${prefix}${idx}`;
}

function sortPins(nodes: GateNode[]): GateNode[] {
  return nodes.slice().sort((a, b) => {
    const an = a.data.name?.trim() ?? "";
    const bn = b.data.name?.trim() ?? "";
    if (an && bn && an !== bn) return an.localeCompare(bn);
    if (an && !bn) return -1;
    if (!an && bn) return 1;
    const dy = a.position.y - b.position.y;
    if (dy !== 0) return dy;
    return a.position.x - b.position.x;
  });
}

export function buildTruthTable(
  nodes: GateNode[],
  edges: Edge[],
  customs: CustomGateDef[],
): TruthTableData {
  const inputsSorted = sortPins(nodes.filter((n) => n.data.kind === "INPUT"));
  const outputsSorted = sortPins(nodes.filter((n) => n.data.kind === "OUTPUT"));

  const inputs: PinInfo[] = inputsSorted.map((n, i) => ({
    id: n.id,
    label: pinLabel(n, i, "in"),
  }));
  const outputs: PinInfo[] = outputsSorted.map((n, i) => ({
    id: n.id,
    label: pinLabel(n, i, "out"),
  }));

  if (inputs.length === 0 && outputs.length === 0) {
    return { inputs, outputs, rows: null, status: "empty", inputCount: 0 };
  }
  if (outputs.length === 0) {
    return { inputs, outputs, rows: null, status: "no-outputs", inputCount: inputs.length };
  }
  if (inputs.length === 0) {
    // Sem inputs ainda há uma "linha 0" (estado constante), mas sem combinações.
    const sim = simulate(nodes, edges, customs);
    const row = outputs.map((p) => sim.nodeValues.get(outKey(p.id, "out-0")) ?? false);
    return { inputs, outputs, rows: [row], status: "no-inputs", inputCount: 0 };
  }
  if (inputs.length > TRUTH_TABLE_MAX_INPUTS) {
    return { inputs, outputs, rows: null, status: "overflow", inputCount: inputs.length };
  }

  const inputIdSet = new Set(inputs.map((p) => p.id));
  const totalRows = 1 << inputs.length;
  const rows: boolean[][] = [];

  for (let r = 0; r < totalRows; r++) {
    const bitFor = new Map<string, boolean>();
    for (let i = 0; i < inputs.length; i++) {
      const bit = (r >> (inputs.length - 1 - i)) & 1;
      bitFor.set(inputs[i].id, bit === 1);
    }
    const patched = nodes.map((n) =>
      inputIdSet.has(n.id)
        ? { ...n, data: { ...n.data, state: !!bitFor.get(n.id) } }
        : n,
    );
    const sim = simulate(patched, edges, customs);
    rows.push(outputs.map((p) => sim.nodeValues.get(outKey(p.id, "out-0")) ?? false));
  }

  return { inputs, outputs, rows, status: "ok", inputCount: inputs.length };
}

export function currentRowIndex(
  data: TruthTableData,
  nodes: GateNode[],
): number | null {
  if (data.status !== "ok" || !data.rows) return null;
  const state = new Map<string, boolean>();
  for (const n of nodes) {
    if (n.data.kind === "INPUT") state.set(n.id, !!n.data.state);
  }
  let idx = 0;
  for (let i = 0; i < data.inputs.length; i++) {
    if (state.get(data.inputs[i].id)) {
      idx |= 1 << (data.inputs.length - 1 - i);
    }
  }
  return idx;
}
