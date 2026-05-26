"use client";

import {
  BaseEdge,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import React, { useCallback, useContext } from "react";
import { WireCommitContext } from "./wireEditContext";

interface WireData {
  midX?: number;
}

export default function WireEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
    selected,
    data,
  } = props;

  const { setEdges, screenToFlowPosition } = useReactFlow();
  const commit = useContext(WireCommitContext);

  const wd = (data ?? {}) as WireData;
  const defaultMid = (sourceX + targetX) / 2;
  const midX = wd.midX ?? defaultMid;

  const s = style as React.CSSProperties & { stroke?: string; strokeWidth?: number };
  const stroke = selected ? "#ccc" : s?.stroke ?? "#888";
  const strokeWidth = s?.strokeWidth ?? 1.5;

  const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGLineElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const start = screenToFlowPosition({ x: e.clientX, y: 0 });
      const baseMid = midX;
      let moved = false;

      const move = (ev: PointerEvent) => {
        const now = screenToFlowPosition({ x: ev.clientX, y: 0 });
        const dx = now.x - start.x;
        if (Math.abs(dx) > 0.5) moved = true;
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? { ...edge, data: { ...(edge.data ?? {}), midX: baseMid + dx } }
              : edge,
          ),
        );
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        if (moved) commit?.("fio movido");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [id, midX, screenToFlowPosition, setEdges, commit],
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth, fill: "none" }}
      />
      <line
        x1={midX}
        y1={sourceY}
        x2={midX}
        y2={targetY}
        stroke="transparent"
        strokeWidth={14}
        strokeLinecap="butt"
        style={{ cursor: "ew-resize", pointerEvents: "stroke" }}
        onPointerDown={onPointerDown}
      />
    </>
  );
}
