import type { CustomGateDef } from "./customGates";
import { customIdFromKind, isCustomKind } from "./customGates";

export type BuiltInKind =
  | "INPUT"
  | "OUTPUT"
  | "AND"
  | "OR"
  | "NOT"
  | "XOR"
  | "NAND"
  | "NOR"
  | "XNOR";

// Built-ins + custom (string `custom:<id>`).
export type GateKind = BuiltInKind | string;

export interface GateDescriptor {
  kind: GateKind;
  label: string;
  inputs: number;
  outputs: number;
  description: string;
  custom?: boolean;
}

export const BUILTIN_CATALOG: GateDescriptor[] = [
  { kind: "INPUT", label: "INPUT", inputs: 0, outputs: 1, description: "Entrada clicável (0/1)" },
  { kind: "OUTPUT", label: "OUTPUT", inputs: 1, outputs: 0, description: "Saída / LED" },
  { kind: "AND", label: "AND", inputs: 2, outputs: 1, description: "1 se todas as entradas forem 1" },
  { kind: "OR", label: "OR", inputs: 2, outputs: 1, description: "1 se alguma entrada for 1" },
  { kind: "NOT", label: "NOT", inputs: 1, outputs: 1, description: "Inverte o sinal" },
  { kind: "XOR", label: "XOR", inputs: 2, outputs: 1, description: "1 se as entradas diferem" },
  { kind: "NAND", label: "NAND", inputs: 2, outputs: 1, description: "AND negado" },
  { kind: "NOR", label: "NOR", inputs: 2, outputs: 1, description: "OR negado" },
  { kind: "XNOR", label: "XNOR", inputs: 2, outputs: 1, description: "XOR negado" },
];

// Mantido para compatibilidade.
export const GATE_CATALOG = BUILTIN_CATALOG;

export interface GateNodeData {
  kind: GateKind;
  state: boolean;
  value?: boolean;
  name?: string;
  [key: string]: unknown;
}

export function getDescriptor(
  kind: GateKind,
  customs?: CustomGateDef[],
): GateDescriptor {
  if (isCustomKind(kind)) {
    const id = customIdFromKind(kind);
    const def = customs?.find((c) => c.id === id);
    if (def) {
      return {
        kind,
        label: def.name,
        inputs: def.inputs,
        outputs: def.outputs,
        description: `Custom: ${def.name}`,
        custom: true,
      };
    }
    // Definição não encontrada (foi deletada) — placeholder neutro.
    return {
      kind,
      label: "?",
      inputs: 0,
      outputs: 0,
      description: "Custom gate ausente",
      custom: true,
    };
  }
  return BUILTIN_CATALOG.find((g) => g.kind === kind)!;
}
