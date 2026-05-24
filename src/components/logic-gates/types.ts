export type GateKind =
  | "INPUT"
  | "OUTPUT"
  | "AND"
  | "OR"
  | "NOT"
  | "XOR"
  | "NAND"
  | "NOR"
  | "XNOR";

export interface GateDescriptor {
  kind: GateKind;
  label: string;
  inputs: number;
  outputs: number;
  description: string;
}

export const GATE_CATALOG: GateDescriptor[] = [
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

export interface GateNodeData {
  kind: GateKind;
  state: boolean;
  value?: boolean;
  [key: string]: unknown;
}

export function getDescriptor(kind: GateKind): GateDescriptor {
  return GATE_CATALOG.find((g) => g.kind === kind)!;
}
