"use client";

import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import type { CustomGateDef } from "./customGates";
import { customKind } from "./customGates";
import { GATE_CATALOG, type GateKind } from "./types";

interface Props {
  onAdd: (kind: GateKind) => void;
  customs: CustomGateDef[];
  onDeleteCustom: (id: string) => void;
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold tracking-[0.14em] uppercase text-[#888] font-mono">
      {label}
    </div>
  );
}

function GateItem({ kind, label, description, onAdd, onDragStart }: {
  kind: GateKind;
  label: string;
  description: string;
  onAdd: (k: GateKind) => void;
  onDragStart: (e: React.DragEvent, k: GateKind) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onDragStart(e, kind)}
      onClick={() => onAdd(kind)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={description}
      className="w-full h-8 flex items-center gap-2 px-2 rounded-xs cursor-grab active:cursor-grabbing text-left transition-colors duration-100"
      style={{
        background: hovered ? "#363636" : "transparent",
        border: `1px solid ${hovered ? "#555" : "transparent"}`,
      }}
    >
      <span className="font-mono text-[10px] font-semibold tracking-[0.06em] flex-1"
        style={{ color: hovered ? "#fff" : "#b0b0b0" }}>
        {label}
      </span>
      {(kind === "INPUT" || kind === "OUTPUT") && (
        <span className="text-[8px] font-mono tracking-wide px-1 py-0.5 rounded-xs border"
          style={{
            color: kind === "INPUT" ? "#4ade80" : "#f87171",
            borderColor: kind === "INPUT" ? "#4ade8044" : "#f8717144",
            background: kind === "INPUT" ? "#4ade8010" : "#f8717110",
          }}>
          {kind === "INPUT" ? "IO" : "IO"}
        </span>
      )}
    </button>
  );
}

function CustomGateItem({
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Remover a porta customizada "${def.name}"?`)) {
      onDelete(def.id);
    }
  };

  return (
    <div
      className="w-full h-8 flex items-center gap-1 rounded-xs transition-colors duration-100"
      style={{
        background: hovered ? "#363636" : "transparent",
        border: `1px solid ${hovered ? "#555" : "transparent"}`,
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
        className="flex-1 h-full flex items-center gap-2 px-2 cursor-grab active:cursor-grabbing text-left bg-transparent"
      >
        <span
          className="font-mono text-[10px] font-semibold tracking-[0.06em] flex-1 truncate"
          style={{ color: hovered ? "#fff" : "#22d3ee" }}
        >
          {def.name}
        </span>
        <span
          className="text-[8px] font-mono tracking-wide px-1 py-0.5 rounded-xs border"
          style={{
            color: "#22d3ee",
            borderColor: "#22d3ee44",
            background: "#22d3ee10",
          }}
        >
          {def.inputs}/{def.outputs}
        </span>
      </button>
      <button
        type="button"
        onClick={handleDelete}
        title="Remover"
        className="h-full w-6 flex items-center justify-center text-[#6a6a6a] hover:text-[#f87171] transition-colors"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function Sidebar({ onAdd, customs, onDeleteCustom }: Props) {
  const onDragStart = (e: React.DragEvent, kind: GateKind) => {
    e.dataTransfer.setData("application/logic-gate", kind);
    e.dataTransfer.effectAllowed = "move";
  };

  const io = GATE_CATALOG.filter((g) => g.kind === "INPUT" || g.kind === "OUTPUT");
  const gates = GATE_CATALOG.filter((g) => g.kind !== "INPUT" && g.kind !== "OUTPUT");

  return (
    <aside className="w-44 shrink-0 flex flex-col bg-[#2c2c2c] border-r border-[#3a3a3a] select-none">
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

      {/* Palette */}
      <div className="flex-1 overflow-y-auto">
        <GroupLabel label="Entradas / Saídas" />
        <div className="px-2 pb-1 flex flex-col gap-0.5">
          {io.map((g) => (
            <GateItem
              key={g.kind}
              kind={g.kind}
              label={g.label}
              description={g.description}
              onAdd={onAdd}
              onDragStart={onDragStart}
            />
          ))}
        </div>

        <div className="h-px bg-[#3a3a3a] mx-0 my-1" />

        <GroupLabel label="Portas Lógicas" />
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {gates.map((g) => (
            <GateItem
              key={g.kind}
              kind={g.kind}
              label={g.label}
              description={g.description}
              onAdd={onAdd}
              onDragStart={onDragStart}
            />
          ))}
        </div>

        <div className="h-px bg-[#3a3a3a] mx-0 my-1" />

        <GroupLabel label="Customizadas" />
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {customs.length === 0 ? (
            <div className="px-2 py-1 text-[9px] font-mono text-[#6a6a6a] italic leading-4">
              Nenhuma ainda. Use o botão{" "}
              <span className="text-[#aaa]">SAVE GATE</span> no topo do canvas.
            </div>
          ) : (
            customs.map((def) => (
              <CustomGateItem
                key={def.id}
                def={def}
                onAdd={onAdd}
                onDelete={onDeleteCustom}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>

        <div className="h-px bg-[#3a3a3a] mx-0 my-1" />

        {/* Help */}
        <div className="px-3 py-3">
          <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[#888] font-mono mb-2">
            Como usar
          </div>
          <ul className="text-[9px] font-mono text-[#6a6a6a] leading-5 space-y-1">
            <li>Arraste ou clique para inserir.</li>
            <li>Conecte pelo <span className="text-[#aaa]">ponto direito</span> de uma porta até o <span className="text-[#aaa]">ponto esquerdo</span> de outra.</li>
            <li>Clique em <span className="text-[#aaa]">INPUT</span> para alternar 0/1.</li>
            <li><span className="text-[#aaa]">Delete</span> remove o nó selecionado.</li>
            <li><span className="text-[#aaa]">SAVE GATE</span> empacota o canvas como porta reutilizável.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
