"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import type { CustomGateDef } from "./customGates";
import { customIdFromKind, isCustomKind } from "./customGates";
import { useCustomGates } from "./customGatesContext";
import { getDescriptor, type GateNodeData } from "./types";

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const HANDLE =
  "w-2.5! h-2.5! bg-[#2c2c2c]! border! border-[#555]! hover:border-[#aaa]! transition-colors!";

const CUSTOM_COLOR = "#22d3ee";

// Label exibida abaixo de INPUT/OUTPUT.
function NameLabel({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="absolute left-0 right-0 -bottom-4 text-center font-mono text-[9px] font-semibold tracking-[0.12em] uppercase select-none pointer-events-none"
      style={{ color }}
    >
      {name}
    </span>
  );
}

export default function GateNode({ id, data, selected }: NodeProps) {
  const d = data as GateNodeData;
  const customs = useCustomGates();
  const desc = getDescriptor(d.kind, customs);
  const on = !!d.value;
  const { setNodes } = useReactFlow();

  const toggle = useCallback(() => {
    if (d.kind !== "INPUT") return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, state: !(n.data as GateNodeData).state } }
          : n
      )
    );
  }, [id, d.kind, setNodes]);

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (d.kind === "INPUT") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={toggle}
          className={cls(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center",
            "font-mono text-base font-bold cursor-pointer transition-all duration-150 focus:outline-none",
            d.state
              ? "bg-[#1e1e1e] border-[#4ade80] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]"
              : "bg-[#1e1e1e] border-[#3a3a3a] text-[#6a6a6a] hover:border-[#666] hover:text-[#aaa]",
            selected ? "ring-1 ring-[#888] ring-offset-0" : ""
          )}
        >
          {d.state ? "1" : "0"}
        </button>
        <Handle type="source" position={Position.Right} id="out-0" className={HANDLE} />
        {d.name && <NameLabel name={d.name} color="#4ade80" />}
      </div>
    );
  }

  // ── OUTPUT ─────────────────────────────────────────────────────────────────
  if (d.kind === "OUTPUT") {
    return (
      <div className="relative">
        <Handle type="target" position={Position.Left} id="in-0" className={HANDLE} />
        <div
          className={cls(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center",
            "font-mono text-base font-bold transition-all duration-150",
            on
              ? "bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80] shadow-[0_0_14px_rgba(74,222,128,0.35)]"
              : "bg-[#1e1e1e] border-[#3a3a3a] text-[#6a6a6a]",
            selected ? "ring-1 ring-[#888] ring-offset-0" : ""
          )}
        >
          {on ? "1" : "0"}
        </div>
        {d.name && <NameLabel name={d.name} color="#f87171" />}
      </div>
    );
  }

  // ── Logic gates (built-in e custom) ───────────────────────────────────────
  const isCustom = !!desc.custom;
  let inputNames: string[] = [];
  let outputNames: string[] = [];
  if (isCustom) {
    const def: CustomGateDef | undefined = customs.find(
      (c) => c.id === customIdFromKind(d.kind),
    );
    inputNames = def?.inputNames ?? [];
    outputNames = def?.outputNames ?? [];
  }

  const inputHandles = Array.from({ length: desc.inputs }, (_, i) => {
    const top = desc.inputs === 1 ? 50 : (i + 1) * (100 / (desc.inputs + 1));
    return (
      <Handle
        key={`in-${i}`}
        type="target"
        position={Position.Left}
        id={`in-${i}`}
        style={{ top: `${top}%` }}
        className={HANDLE}
      />
    );
  });

  const outputHandles = Array.from({ length: desc.outputs }, (_, i) => {
    const top = desc.outputs === 1 ? 50 : (i + 1) * (100 / (desc.outputs + 1));
    return (
      <Handle
        key={`out-${i}`}
        type="source"
        position={Position.Right}
        id={`out-${i}`}
        style={{ top: `${top}%` }}
        className={HANDLE}
      />
    );
  });

  // Labels dos pinos só pra custom (built-ins não precisam).
  const pinLabels = isCustom ? (
    <>
      {inputNames.map((name, i) => {
        const top = inputNames.length === 1 ? 50 : (i + 1) * (100 / (inputNames.length + 1));
        return (
          <span
            key={`il-${i}`}
            className="absolute font-mono text-[8px] font-semibold tracking-wider uppercase select-none pointer-events-none"
            style={{ top: `${top}%`, left: 6, transform: "translateY(-50%)", color: "#8a8a8a" }}
          >
            {name}
          </span>
        );
      })}
      {outputNames.map((name, i) => {
        const top = outputNames.length === 1 ? 50 : (i + 1) * (100 / (outputNames.length + 1));
        return (
          <span
            key={`ol-${i}`}
            className="absolute font-mono text-[8px] font-semibold tracking-wider uppercase select-none pointer-events-none"
            style={{ top: `${top}%`, right: 6, transform: "translateY(-50%)", color: "#8a8a8a" }}
          >
            {name}
          </span>
        );
      })}
    </>
  ) : null;

  const pinCount = Math.max(desc.inputs, desc.outputs, 1);
  const minHeight = Math.max(48, pinCount * 20);
  const minWidth = isCustom ? 96 : 72;

  const borderColor = on
    ? "#4ade80"
    : selected
    ? "#888"
    : isCustom
    ? CUSTOM_COLOR
    : "#3a3a3a";
  const labelColor = on ? "#4ade80" : isCustom ? CUSTOM_COLOR : "#b0b0b0";

  return (
    <div
      className="relative flex items-center justify-center px-5 py-3 bg-[#1e1e1e] rounded-xs border transition-colors duration-150"
      style={{ borderColor, minHeight, minWidth }}
    >
      {inputHandles}
      {pinLabels}
      <span
        className="font-mono text-[11px] font-semibold tracking-widest uppercase select-none"
        style={{ color: labelColor }}
      >
        {desc.label}
      </span>
      {outputHandles}
      {d.name && (
        <span
          className="absolute left-0 right-0 -bottom-4 text-center font-mono text-[9px] font-semibold tracking-[0.12em] uppercase select-none pointer-events-none"
          style={{ color: isCustom ? CUSTOM_COLOR : "#b0b0b0" }}
        >
          {d.name}
        </span>
      )}
    </div>
  );
}
