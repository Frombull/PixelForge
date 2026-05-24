"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { getDescriptor, type GateNodeData } from "./types";

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// Tailwind v4: important modifier is `class!` (not `!class`)
const HANDLE =
  "w-2.5! h-2.5! bg-[#2c2c2c]! border! border-[#555]! hover:border-[#aaa]! transition-colors!";

export default function GateNode({ id, data, selected }: NodeProps) {
  const d = data as GateNodeData;
  const desc = getDescriptor(d.kind);
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
      </div>
    );
  }

  // ── Logic gates ─────────────────
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

  return (
    <div
      className={cls(
        "relative flex items-center justify-center px-4 py-3 min-w-18 min-h-12",
        "bg-[#1e1e1e] rounded-xs border transition-colors duration-150",
        on ? "border-[#4ade80]" : selected ? "border-[#888]" : "border-[#3a3a3a]"
      )}
    >
      {inputHandles}
      <span
        className={cls(
          "font-mono text-[11px] font-semibold tracking-widest uppercase select-none",
          on ? "text-[#4ade80]" : "text-[#b0b0b0]"
        )}
      >
        {desc.label}
      </span>
      <Handle type="source" position={Position.Right} id="out-0" className={HANDLE} />
    </div>
  );
}
