"use client";

import { ArrowLeft, ChevronRight, Type, X } from "lucide-react";
import { useState } from "react";
import {
  TbBoxMultiple,
  TbCircle,
  TbCircleDotFilled,
  TbLogicAnd,
  TbLogicNand,
  TbLogicNor,
  TbLogicNot,
  TbLogicOr,
  TbLogicXnor,
  TbLogicXor,
} from "react-icons/tb";
import type { CustomGateDef } from "./customGates";
import { customKind } from "./customGates";
import { GATE_CATALOG, type GateKind } from "./types";

interface Props {
  onAdd: (kind: GateKind) => void;
  onAddText: () => void;
  customs: CustomGateDef[];
  onDeleteCustom: (id: string) => void;
}

// ─── Ícones das portas (Tabler) ───────────────────────────────────────────────

const GATE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  INPUT: TbCircleDotFilled,
  OUTPUT: TbCircle,
  AND: TbLogicAnd,
  OR: TbLogicOr,
  NOT: TbLogicNot,
  XOR: TbLogicXor,
  NAND: TbLogicNand,
  NOR: TbLogicNor,
  XNOR: TbLogicXnor,
};

function GateIcon({
  kind,
  color = "#b0b0b0",
  size = 20,
}: {
  kind: GateKind;
  color?: string;
  size?: number;
}) {
  const Icon = GATE_ICONS[kind] ?? TbBoxMultiple;
  return <Icon size={size} color={color} />;
}

// ─── Categoria colapsável ─────────────────────────────────────────────────────

function Category({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);
  return (
    <div className="border-b border-[#3a3a3a]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left transition-colors duration-100"
        style={{
          background: hovered ? "#363636" : "transparent",
        }}
      >
        <ChevronRight
          size={11}
          strokeWidth={2}
          style={{
            color: hovered ? "#fff" : "#888",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
        <span
          className="flex-1 text-[9px] font-semibold tracking-[0.14em] uppercase font-mono"
          style={{ color: hovered ? "#fff" : "#888" }}
        >
          {title}
        </span>
      </button>
      {open && <div className="px-2 pb-2 pt-1">{children}</div>}
    </div>
  );
}

// ─── Tile de porta (grid 2 colunas) ───────────────────────────────────────────

function GateTile({
  kind,
  label,
  description,
  onAdd,
  onDragStart,
  iconColor,
}: {
  kind: GateKind;
  label: string;
  description: string;
  onAdd: (k: GateKind) => void;
  onDragStart: (e: React.DragEvent, k: GateKind) => void;
  iconColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const resolvedColor = hovered ? "#fff" : iconColor ?? "#b0b0b0";

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, kind)}
      onClick={() => onAdd(kind)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={description}
      className="h-14 flex flex-col items-center justify-center gap-1 px-1 rounded-xs cursor-grab active:cursor-grabbing transition-colors duration-100"
      style={{
        background: hovered ? "#363636" : "#1e1e1e",
        border: `1px solid ${hovered ? "#555" : "#3a3a3a"}`,
      }}
    >
      <GateIcon kind={kind} color={resolvedColor} size={40} />
      <span
        className="font-mono text-[9px] font-semibold tracking-[0.08em] leading-none"
        style={{ color: resolvedColor }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Tile de ferramenta de texto ──────────────────────────────────────────────

function TextTile({
  onAdd,
  onDragStart,
}: {
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = hovered ? "#fff" : "#b0b0b0";
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Insere um bloco de texto editável"
      className="h-14 flex flex-col items-center justify-center gap-1 px-1 rounded-xs cursor-grab active:cursor-grabbing transition-colors duration-100"
      style={{
        background: hovered ? "#363636" : "#1e1e1e",
        border: `1px solid ${hovered ? "#555" : "#3a3a3a"}`,
      }}
    >
      <Type size={18} strokeWidth={2} style={{ color }} />
      <span
        className="font-mono text-[9px] font-semibold tracking-[0.08em] leading-none"
        style={{ color }}
      >
        TEXTO
      </span>
    </button>
  );
}

// ─── Tile de porta customizada ────────────────────────────────────────────────

const CUSTOM_COLOR = "#22d3ee";

function CustomGateTile({
  def,
  onAdd,
  onDelete,
  onDragStart,
}: {
  def: CustomGateDef;
  onAdd: (k: GateKind) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, k: GateKind) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const kind = customKind(def.id);
  const color = hovered ? "#fff" : CUSTOM_COLOR;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Remover a porta customizada "${def.name}"?`)) {
      onDelete(def.id);
    }
  };

  return (
    <div
      className="relative h-14 rounded-xs transition-colors duration-100"
      style={{
        background: hovered ? "#363636" : "#1e1e1e",
        border: `1px solid ${hovered ? "#555" : `${CUSTOM_COLOR}44`}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        draggable
        onDragStart={(e) => onDragStart(e, kind)}
        onClick={() => onAdd(kind)}
        title={`${def.name} — ${def.inputs} in / ${def.outputs} out`}
        className="w-full h-full flex flex-col items-center justify-center gap-1 px-1 cursor-grab active:cursor-grabbing bg-transparent"
      >
        <TbBoxMultiple size={40} color={color} />
        <span
          className="font-mono text-[9px] font-semibold tracking-[0.06em] leading-none max-w-full truncate px-1"
          style={{ color }}
        >
          {def.name}
        </span>
      </button>
      <button
        type="button"
        onClick={handleDelete}
        title="Remover"
        className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-[#6a6a6a] hover:text-[#f87171] transition-colors"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <X size={10} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ onAdd, onAddText, customs, onDeleteCustom }: Props) {
  const onDragStart = (e: React.DragEvent, kind: GateKind) => {
    e.dataTransfer.setData("application/logic-gate", kind);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragStartText = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/logic-gates-text", "1");
    e.dataTransfer.effectAllowed = "move";
  };

  const io = GATE_CATALOG.filter((g) => g.kind === "INPUT" || g.kind === "OUTPUT");
  const gates = GATE_CATALOG.filter((g) => g.kind !== "INPUT" && g.kind !== "OUTPUT");

  return (
    <aside
      onContextMenu={(e) => e.preventDefault()}
      className="w-60 shrink-0 flex flex-col bg-[#2c2c2c] border-r border-[#3a3a3a] select-none"
    >
      {/* Header */}
      <div className="flex items-center h-10 border-b border-[#3a3a3a] shrink-0">
        <a
          href="/"
          title="Voltar"
          className="flex items-center justify-center w-10 h-full shrink-0 border-r border-[#3a3a3a] text-[#6a6a6a] hover:text-white hover:bg-[#363636] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.8} />
        </a>
        <span className="flex-1 px-3 text-[9px] font-semibold tracking-[0.18em] uppercase text-[#aaa] font-mono">
          Portas
        </span>
      </div>

      {/* Categorias */}
      <div className="flex-1 overflow-y-auto">
        <Category title="IO">
          <div className="grid grid-cols-2 gap-1">
            {io.map((g) => (
              <GateTile
                key={g.kind}
                kind={g.kind}
                label={g.label}
                description={g.description}
                onAdd={onAdd}
                onDragStart={onDragStart}
                iconColor={g.kind === "INPUT" ? "#4ade80" : "#f87171"}
              />
            ))}
          </div>
        </Category>

        <Category title="Logic Gates">
          <div className="grid grid-cols-2 gap-1">
            {gates.map((g) => (
              <GateTile
                key={g.kind}
                kind={g.kind}
                label={g.label}
                description={g.description}
                onAdd={onAdd}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </Category>

        <Category title="Text">
          <div className="grid grid-cols-2 gap-1">
            <TextTile onAdd={onAddText} onDragStart={onDragStartText} />
          </div>
        </Category>

        <Category title="Customizadas">
          {customs.length === 0 ? (
            <div className="px-1 py-2 text-[9px] font-mono text-[#6a6a6a] italic leading-4">
              Nenhuma ainda. Use{" "}
              <span className="text-[#aaa]">SAVE GATE</span> no topo do canvas.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {customs.map((def) => (
                <CustomGateTile
                  key={def.id}
                  def={def}
                  onAdd={onAdd}
                  onDelete={onDeleteCustom}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          )}
        </Category>
      </div>
    </aside>
  );
}
