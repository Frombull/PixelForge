import type { Edge, Node } from "@xyflow/react";
import type { GateKind, GateNodeData } from "./types";

export type GateNode = Node<GateNodeData>;

interface EvalContext {
  values: Map<string, boolean>;
  nodes: Map<string, GateNode>;
  incoming: Map<string, Edge[]>;
}

function computeGate(kind: GateKind, inputs: boolean[]): boolean {
  switch (kind) {
    case "AND":
      return inputs.length > 0 && inputs.every(Boolean);
    case "OR":
      return inputs.some(Boolean);
    case "NOT":
      return !(inputs[0] ?? false);
    case "XOR":
      return inputs.reduce((acc, v) => acc !== v, false);
    case "NAND":
      return !(inputs.length > 0 && inputs.every(Boolean));
    case "NOR":
      return !inputs.some(Boolean);
    case "XNOR":
      return !inputs.reduce((acc, v) => acc !== v, false);
    case "OUTPUT":
      return inputs[0] ?? false;
    case "INPUT":
      return false;
  }
}

function evaluateNode(
  id: string,
  ctx: EvalContext,
  visiting: Set<string>
): boolean {
  if (ctx.values.has(id)) return ctx.values.get(id)!;
  if (visiting.has(id)) {
    // Cycle — default to false this tick (combinational only)
    ctx.values.set(id, false);
    return false;
  }
  visiting.add(id);

  const node = ctx.nodes.get(id)!;
  const kind = node.data.kind;

  if (kind === "INPUT") {
    const v = !!node.data.state;
    ctx.values.set(id, v);
    visiting.delete(id);
    return v;
  }

  const incoming = ctx.incoming.get(id) ?? [];
  // Build inputs sorted by target handle index ("in-0", "in-1", ...)
  const byHandle = new Map<number, boolean>();
  for (const edge of incoming) {
    const handle = edge.targetHandle ?? "in-0";
    const idx = parseInt(handle.replace("in-", ""), 10) || 0;
    const sourceVal = evaluateNode(edge.source, ctx, visiting);
    byHandle.set(idx, sourceVal);
  }
  const arity = kind === "NOT" || kind === "OUTPUT" ? 1 : 2;
  const inputs: boolean[] = [];
  for (let i = 0; i < arity; i++) {
    inputs.push(byHandle.get(i) ?? false);
  }

  const out = computeGate(kind, inputs);
  ctx.values.set(id, out);
  visiting.delete(id);
  return out;
}

export interface SimulationResult {
  nodeValues: Map<string, boolean>;
  edgeValues: Map<string, boolean>;
}

export function simulate(nodes: GateNode[], edges: Edge[]): SimulationResult {
  const ctx: EvalContext = {
    values: new Map(),
    nodes: new Map(),
    incoming: new Map(),
  };
  for (const n of nodes) ctx.nodes.set(n.id, n);
  for (const e of edges) {
    if (!ctx.incoming.has(e.target)) ctx.incoming.set(e.target, []);
    ctx.incoming.get(e.target)!.push(e);
  }

  for (const n of nodes) {
    evaluateNode(n.id, ctx, new Set());
  }

  const edgeValues = new Map<string, boolean>();
  for (const e of edges) {
    edgeValues.set(e.id, ctx.values.get(e.source) ?? false);
  }
  return { nodeValues: ctx.values, edgeValues };
}
