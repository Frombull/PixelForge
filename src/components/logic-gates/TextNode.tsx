"use client";

import { type NodeProps, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type TextSize = "S" | "M" | "L";

export interface TextNodeData {
  kind: "TEXT";
  text: string;
  size: TextSize;
  color: string;
  state: false;
  [key: string]: unknown;
}

export const TEXT_SIZE_PX: Record<TextSize, number> = { S: 12, M: 18, L: 28 };

export const TEXT_DEFAULT_COLOR = "#ffffff";
export const TEXT_DEFAULT_SIZE: TextSize = "M";
export const TEXT_DEFAULT_TEXT = "Texto";

export default function TextNode({ id, data, selected }: NodeProps) {
  const d = data as TextNodeData;
  const { setNodes } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const commit = useCallback(
    (value: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, text: value } } : n,
        ),
      );
    },
    [id, setNodes],
  );

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.select();
    }
  }, [editing]);

  const fontSize = TEXT_SIZE_PX[d.size] ?? TEXT_SIZE_PX.M;
  const color = d.color || TEXT_DEFAULT_COLOR;

  if (editing) {
    return (
      <textarea
        ref={taRef}
        defaultValue={d.text}
        onBlur={(e) => {
          commit(e.target.value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (e.currentTarget as HTMLTextAreaElement).blur();
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
          e.stopPropagation();
        }}
        rows={Math.max(1, d.text.split("\n").length)}
        className="nodrag nopan font-mono bg-[#1e1e1e] outline-none resize-none"
        style={{
          color,
          fontSize,
          minWidth: 80,
          border: "1px dashed #888",
          padding: "2px 4px",
          lineHeight: 1.2,
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="font-mono select-none"
      style={{
        color,
        fontSize,
        padding: "2px 4px",
        border: `1px ${selected ? "dashed" : "solid"} ${
          selected ? "#888" : "transparent"
        }`,
        whiteSpace: "pre-wrap",
        minWidth: 24,
        minHeight: fontSize + 4,
        lineHeight: 1.2,
        cursor: "text",
      }}
    >
      {d.text || (selected ? "(texto)" : " ")}
    </div>
  );
}
