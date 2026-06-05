import type { Edge, Node } from "@xyflow/react";
import type { CustomGateDef } from "./customGates";
import { customIdFromKind, isCustomKind } from "./customGates";
import type { BuiltInKind, GateKind, GateNodeData } from "./types";
import { isNaryKind, NARY_MAX_INPUTS, NARY_MIN_INPUTS } from "./types";

export type GateNode = Node<GateNodeData>;

// Chave de cache de valor por (nodeId, handle). Built-ins de 1 saída usam "out-0".
type OutKey = string;
const outKey = (nodeId: string, handle: string): OutKey => `${nodeId}|${handle}`;

interface EvalContext {
  values: Map<OutKey, boolean>;
  nodes: Map<string, GateNode>;
  incoming: Map<string, Edge[]>;
  customs: Map<string, CustomGateDef>;
}

function computeBuiltin(kind: BuiltInKind, inputs: boolean[]): boolean {
  switch (kind) {
    case "AND":  return inputs.length > 0 && inputs.every(Boolean);
    case "OR":   return inputs.some(Boolean);
    case "NOT":  return !(inputs[0] ?? false);
    case "XOR":  return inputs.reduce((acc, v) => acc !== v, false);
    case "NAND": return !(inputs.length > 0 && inputs.every(Boolean));
    case "NOR":  return !inputs.some(Boolean);
    case "XNOR": return !inputs.reduce((acc, v) => acc !== v, false);
    case "OUTPUT": return inputs[0] ?? false;
    case "INPUT":  return false;
  }
}

function builtinArity(kind: BuiltInKind): number {
  if (kind === "NOT" || kind === "OUTPUT") return 1;
  if (kind === "INPUT") return 0;
  return 2;
}

function collectInputs(
  nodeId: string,
  arity: number,
  ctx: EvalContext,
  visiting: Set<string>,
): boolean[] {
  const incoming = ctx.incoming.get(nodeId) ?? [];
  const byHandle = new Map<number, boolean>();
  for (const edge of incoming) {
    const targetHandle = edge.targetHandle ?? "in-0";
    const idx = parseInt(targetHandle.replace("in-", ""), 10) || 0;
    const sourceHandle = edge.sourceHandle ?? "out-0";
    const v = evalOutput(edge.source, sourceHandle, ctx, visiting);
    byHandle.set(idx, v);
  }
  const inputs: boolean[] = [];
  for (let i = 0; i < arity; i++) inputs.push(byHandle.get(i) ?? false);
  return inputs;
}

function evalOutput(
  nodeId: string,
  handle: string,
  ctx: EvalContext,
  visiting: Set<string>,
): boolean {
  const k = outKey(nodeId, handle);
  if (ctx.values.has(k)) return ctx.values.get(k)!;

  if (visiting.has(k)) {
    ctx.values.set(k, false);
    return false;
  }
  visiting.add(k);

  const node = ctx.nodes.get(nodeId);
  if (!node) {
    ctx.values.set(k, false);
    visiting.delete(k);
    return false;
  }

  const kind = node.data.kind;
  let result = false;

  if (kind === "INPUT") {
    result = !!node.data.state;
  } else if (isCustomKind(kind)) {
    const def = ctx.customs.get(customIdFromKind(kind));
    if (def) {
      const inputs = collectInputs(nodeId, def.inputs, ctx, visiting);
      const outputs = simulateSubcircuit(def, inputs, ctx.customs);
      for (let i = 0; i < def.outputs; i++) {
        ctx.values.set(outKey(nodeId, `out-${i}`), outputs[i] ?? false);
      }
      const idx = parseInt(handle.replace("out-", ""), 10) || 0;
      result = outputs[idx] ?? false;
    }
  } else {
    const bk = kind as BuiltInKind;
    let arity = builtinArity(bk);
    if (isNaryKind(bk)) {
      const override = (node.data as GateNodeData).inputs;
      if (typeof override === "number" && Number.isFinite(override)) {
        arity = Math.min(NARY_MAX_INPUTS, Math.max(NARY_MIN_INPUTS, Math.floor(override)));
      }
    }
    const inputs = collectInputs(nodeId, arity, ctx, visiting);
    result = computeBuiltin(bk, inputs);
  }

  ctx.values.set(k, result);
  visiting.delete(k);
  return result;
}

function simulateSubcircuit(
  def: CustomGateDef,
  inputValues: boolean[],
  customs: Map<string, CustomGateDef>,
): boolean[] {
  // Clona os nós internos, injetando o estado dos INPUTs a partir dos valores externos.
  const inputIndex = new Map<string, number>();
  def.inputIds.forEach((id, i) => inputIndex.set(id, i));

  const nodes: GateNode[] = def.nodes.map((n) => {
    const idx = inputIndex.get(n.id);
    if (idx !== undefined) {
      return { ...n, data: { ...n.data, state: !!inputValues[idx] } };
    }
    return { ...n };
  });

  const sub = simulateWithCustoms(nodes, def.edges, customs);
  // Cada OUTPUT interno guarda seu valor em out-0 (convenção do simulador).
  return def.outputIds.map((id) => sub.nodeValues.get(outKey(id, "out-0")) ?? false);
}

export interface SimulationResult {
  // Indexado por `${nodeId}|${handle}`.
  nodeValues: Map<OutKey, boolean>;
  // Indexado por edgeId.
  edgeValues: Map<string, boolean>;
}

function simulateWithCustoms(
  nodes: GateNode[],
  edges: Edge[],
  customs: Map<string, CustomGateDef>,
): SimulationResult {
  const ctx: EvalContext = {
    values: new Map(),
    nodes: new Map(),
    incoming: new Map(),
    customs,
  };
  for (const n of nodes) ctx.nodes.set(n.id, n);
  for (const e of edges) {
    if (!ctx.incoming.has(e.target)) ctx.incoming.set(e.target, []);
    ctx.incoming.get(e.target)!.push(e);
  }

  // Avalia o output principal de cada nó (out-0 funciona como cache canônico
  // até pra OUTPUT, que armazena o valor recebido em in-0).
  for (const n of nodes) {
    const kind = n.data.kind;
    if (isCustomKind(kind)) {
      const def = customs.get(customIdFromKind(kind));
      const count = def?.outputs ?? 1;
      for (let i = 0; i < Math.max(1, count); i++) {
        evalOutput(n.id, `out-${i}`, ctx, new Set());
      }
    } else if (kind === "OUTPUT") {
      // Armazena valor em out-0 pra leitura uniforme (sub-circuitos).
      const inputs = collectInputs(n.id, 1, ctx, new Set());
      ctx.values.set(outKey(n.id, "out-0"), inputs[0] ?? false);
    } else {
      evalOutput(n.id, "out-0", ctx, new Set());
    }
  }

  const edgeValues = new Map<string, boolean>();
  for (const e of edges) {
    const sh = e.sourceHandle ?? "out-0";
    edgeValues.set(e.id, ctx.values.get(outKey(e.source, sh)) ?? false);
  }
  return { nodeValues: ctx.values, edgeValues };
}

export function simulate(
  nodes: GateNode[],
  edges: Edge[],
  customs: CustomGateDef[] = [],
): SimulationResult {
  const map = new Map<string, CustomGateDef>();
  for (const c of customs) map.set(c.id, c);
  return simulateWithCustoms(nodes, edges, map);
}

// Helper: valor "visual" de um nó (true se qualquer saída está ativa).
export function nodeIsActive(
  nodeId: string,
  outputCount: number,
  values: Map<OutKey, boolean>,
): boolean {
  const n = Math.max(1, outputCount);
  for (let i = 0; i < n; i++) {
    if (values.get(outKey(nodeId, `out-${i}`))) return true;
  }
  return false;
}

export { outKey };
