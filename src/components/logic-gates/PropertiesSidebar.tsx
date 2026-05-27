"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomGateDef } from "./customGates";
import { customIdFromKind, isCustomKind } from "./customGates";
import type { TextNodeData, TextSize } from "./TextNode";
import { TEXT_DEFAULT_COLOR } from "./TextNode";
import { getDescriptor, type GateNodeData } from "./types";
import type { GateNode } from "./simulator";

interface Props {
  node: GateNode | null;
  selectionCount: number;
  customs: CustomGateDef[];
  onRename: (id: string, name: string) => void;
  onUpdateText?: (id: string, patch: Partial<TextNodeData>) => void;
  // Quando muda, foca + seleciona o input de nome.
  focusRenameSignal?: number;
}

const TEXT_PALETTE: string[] = [
  "#ffffff",
  "#aaaaaa",
  "#f87171",
  "#facc15",
  "#4ade80",
  "#22d3ee",
  "#60a5fa",
  "#f472b6",
];

const TEXT_SIZES: TextSize[] = ["S", "M", "L"];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9px] font-mono tracking-[0.14em] uppercase text-[#6a6a6a] w-14 shrink-0">
        {label}
      </span>
      <span className="text-[10px] font-mono text-[#b0b0b0] truncate">{value}</span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[9px] font-semibold tracking-[0.14em] uppercase text-[#888] font-mono">
      {label}
    </div>
  );
}

export default function PropertiesSidebar({
  node,
  selectionCount,
  customs,
  onRename,
  onUpdateText,
  focusRenameSignal,
}: Props) {
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o input com o nó selecionado.
  useEffect(() => {
    setDraftName(node?.data.name ?? "");
  }, [node?.id, node?.data.name]);

  // Foca o input quando o sinal externo chama "Renomear".
  useEffect(() => {
    if (focusRenameSignal === undefined) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [focusRenameSignal]);

  const commitName = () => {
    if (!node) return;
    const trimmed = draftName.trim();
    const current = node.data.name ?? "";
    if (trimmed === current) return;
    onRename(node.id, trimmed);
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center h-10 border-b border-[#3a3a3a] shrink-0 px-3">
      <span className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#aaa] font-mono">
        Propriedades
      </span>
    </div>
  );

  // ── Sem seleção ────────────────────────────────────────────────────────────
  if (!node && selectionCount === 0) {
    return (
      <aside
      onContextMenu={(e) => e.preventDefault()}
      className="w-52 shrink-0 flex flex-col bg-[#2c2c2c] border-l border-[#3a3a3a] select-none"
    >
        {header}
        <div className="flex-1 flex items-center justify-center px-4">
          <span className="text-[9px] font-mono text-[#6a6a6a] italic text-center leading-5">
            Clique em um objeto pra ver suas propriedades.
          </span>
        </div>
      </aside>
    );
  }

  // ── Multiseleção ────────────────────────────────────────────────────────────
  if (!node && selectionCount > 1) {
    return (
      <aside
      onContextMenu={(e) => e.preventDefault()}
      className="w-52 shrink-0 flex flex-col bg-[#2c2c2c] border-l border-[#3a3a3a] select-none"
    >
        {header}
        <div className="flex-1 flex items-center justify-center px-4">
          <span className="text-[9px] font-mono text-[#6a6a6a] italic text-center leading-5">
            {selectionCount} objetos selecionados.
            <br />
            Clique em um único pra editar.
          </span>
        </div>
      </aside>
    );
  }

  if (!node) return null;

  // Texto — painel com texto, tamanho e cor.
  if (node.type === "text") {
    const td = node.data as unknown as TextNodeData;
    const currentSize = td.size ?? "M";
    const currentColor = td.color ?? TEXT_DEFAULT_COLOR;
    return (
      <aside
        onContextMenu={(e) => e.preventDefault()}
        className="w-52 shrink-0 flex flex-col bg-[#2c2c2c] border-l border-[#3a3a3a] select-none"
      >
        {header}
        <div className="flex-1 overflow-y-auto">
          <SectionLabel label="Identidade" />
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            <Field label="Tipo" value="Texto" />
            <Field label="ID" value={node.id} />
          </div>

          <div className="h-px bg-[#3a3a3a] my-1" />

          <SectionLabel label="Conteúdo" />
          <div className="px-3 pb-2">
            <textarea
              value={td.text ?? ""}
              onChange={(e) => onUpdateText?.(node.id, { text: e.target.value })}
              placeholder="Digite o texto..."
              rows={3}
              className="w-full px-2 py-1 text-[10px] font-mono text-[#ddd] bg-[#1e1e1e] border border-[#3a3a3a] focus:border-[#888] focus:outline-none rounded-xs resize-none"
            />
          </div>

          <div className="h-px bg-[#3a3a3a] my-1" />

          <SectionLabel label="Tamanho" />
          <div className="px-3 pb-2 flex gap-1">
            {TEXT_SIZES.map((s) => {
              const active = s === currentSize;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateText?.(node.id, { size: s })}
                  className="flex-1 h-7 font-mono text-[10px] font-semibold tracking-[0.1em] rounded-xs transition-colors"
                  style={{
                    background: active ? "#363636" : "#1e1e1e",
                    border: `1px solid ${active ? "#888" : "#3a3a3a"}`,
                    color: active ? "#fff" : "#b0b0b0",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-[#3a3a3a] my-1" />

          <SectionLabel label="Cor" />
          <div className="px-3 pb-3 grid grid-cols-8 gap-1">
            {TEXT_PALETTE.map((c) => {
              const active = c.toLowerCase() === currentColor.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => onUpdateText?.(node.id, { color: c })}
                  className="w-full aspect-square rounded-xs transition-transform"
                  style={{
                    background: c,
                    border: `1px solid ${active ? "#fff" : "#3a3a3a"}`,
                    boxShadow: active ? "0 0 0 1px #000 inset" : "none",
                  }}
                />
              );
            })}
          </div>

          <div className="h-px bg-[#3a3a3a] my-1" />

          <SectionLabel label="Posição" />
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            <Field label="X" value={Math.round(node.position.x)} />
            <Field label="Y" value={Math.round(node.position.y)} />
          </div>
        </div>
      </aside>
    );
  }

  const d = node.data as GateNodeData;

  // Truth Table — painel mínimo (sem rename / pinos).
  if (node.type === "truthtable") {
    return (
      <aside
        onContextMenu={(e) => e.preventDefault()}
        className="w-52 shrink-0 flex flex-col bg-[#2c2c2c] border-l border-[#3a3a3a] select-none"
      >
        {header}
        <div className="flex-1 overflow-y-auto">
          <SectionLabel label="Identidade" />
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            <Field label="Tipo" value="Truth Table" />
            <Field label="ID" value={node.id} />
          </div>
          <div className="h-px bg-[#3a3a3a] my-1" />
          <SectionLabel label="Posição" />
          <div className="px-3 pb-2 flex flex-col gap-1.5">
            <Field label="X" value={Math.round(node.position.x)} />
            <Field label="Y" value={Math.round(node.position.y)} />
          </div>
        </div>
      </aside>
    );
  }

  const desc = getDescriptor(d.kind, customs);
  const isCustom = isCustomKind(d.kind);
  const def = isCustom
    ? customs.find((c) => c.id === customIdFromKind(d.kind))
    : undefined;

  return (
    <aside
      onContextMenu={(e) => e.preventDefault()}
      className="w-52 shrink-0 flex flex-col bg-[#2c2c2c] border-l border-[#3a3a3a] select-none"
    >
      {header}

      <div className="flex-1 overflow-y-auto">
        <SectionLabel label="Identidade" />
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono tracking-[0.14em] uppercase text-[#6a6a6a]">
              Nome
            </span>
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  setDraftName(d.name ?? "");
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder={
                d.kind === "INPUT" ? "ex. A" : d.kind === "OUTPUT" ? "ex. S" : "—"
              }
              maxLength={24}
              className="w-full h-7 px-2 text-[10px] font-mono text-[#ddd] bg-[#1e1e1e] border border-[#3a3a3a] focus:border-[#888] focus:outline-none rounded-xs"
            />
          </div>
          <Field label="Tipo" value={desc.label} />
          <Field label="ID" value={node.id} />
        </div>

        <div className="h-px bg-[#3a3a3a] my-1" />

        <SectionLabel label="Posição" />
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <Field label="X" value={Math.round(node.position.x)} />
          <Field label="Y" value={Math.round(node.position.y)} />
        </div>

        <div className="h-px bg-[#3a3a3a] my-1" />

        <SectionLabel label="Pinos" />
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <Field label="Entradas" value={desc.inputs} />
          <Field label="Saídas" value={desc.outputs} />
        </div>

        {d.kind === "INPUT" && (
          <>
            <div className="h-px bg-[#3a3a3a] my-1" />
            <SectionLabel label="Estado" />
            <div className="px-3 pb-2">
              <Field
                label="Valor"
                value={
                  <span style={{ color: d.state ? "#4ade80" : "#6a6a6a" }}>
                    {d.state ? "1 (ON)" : "0 (OFF)"}
                  </span>
                }
              />
            </div>
          </>
        )}

        {isCustom && def && (
          <>
            <div className="h-px bg-[#3a3a3a] my-1" />
            <SectionLabel label="Custom" />
            <div className="px-3 pb-2 flex flex-col gap-1.5">
              <Field label="Gate" value={def.name} />
              <Field
                label="Pinos in"
                value={def.inputNames.join(", ") || "—"}
              />
              <Field
                label="Pinos out"
                value={def.outputNames.join(", ") || "—"}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
