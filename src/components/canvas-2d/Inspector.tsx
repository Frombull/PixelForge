"use client";

import React, { useRef, useEffect, useState } from "react";
import { COLORS } from "./lib/constants";
import type { Shape } from "./lib/types";
import ColorPicker from "./ColorPicker";

interface InspectorProps {
  selectedShape: Shape | null;
  onUpdateShape: (key: keyof Shape, value: unknown) => void;
  onMirrorX: () => void;
  onMirrorY: () => void;
  onResetShape: () => void;
}

export default function Inspector({
  selectedShape,
  onUpdateShape,
  onMirrorX,
  onMirrorY,
  onResetShape,
}: InspectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos,  setPickerPos]  = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const fillSwatchRef = useRef<HTMLDivElement>(null);
  const pickerRef     = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (pickerRef.current?.contains(t) || fillSwatchRef.current?.contains(t)) return;
      setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Close picker when selection changes
  useEffect(() => { setPickerOpen(false); }, [selectedShape?.id]);

  const openFillPicker = () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    if (fillSwatchRef.current) {
      const rect = fillSwatchRef.current.getBoundingClientRect();
      const top  = Math.min(window.innerHeight - 380, Math.max(8, rect.top));
      setPickerPos({ top, left: rect.left - 230 });
    }
    setPickerOpen(true);
  };

  return (
    <div
      style={{
        width: 204,
        background: COLORS.panel,
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "auto",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <SectionHeader label="INSPETOR" />

      {selectedShape ? (
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Identity — tipo e id inline */}
          <div style={{ display: "flex", gap: 6 }}>
            <InfoRow label="TIPO" value={selectedShape.type.toUpperCase()} />
            <InfoRow label="ID"   value={selectedShape.id} dimId />
          </div>

          <Divider />

          {/* Transform */}
          <SectionLabel label="TRANSFORMAÇÃO" />
          <div style={{ display: "flex", gap: 6 }}>
            <NumField label="X" value={selectedShape.x} onChange={(v) => onUpdateShape("x", v)} />
            <NumField label="Y" value={selectedShape.y} onChange={(v) => onUpdateShape("y", v)} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {selectedShape.type === "circle" && (
              <NumField label="R" value={selectedShape.radius ?? 0} onChange={(v) => onUpdateShape("radius", v)} />
            )}
            <NumField
              label="ROT°"
              value={Number(((selectedShape.rotation ?? 0) * 180) / Math.PI).toFixed(1)}
              onChange={(v) => onUpdateShape("rotation", (v * Math.PI) / 180)}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <NumField
              label="SCX"
              value={Number(selectedShape.scaleX ?? 1).toFixed(3)}
              onChange={(v) => onUpdateShape("scaleX", v)}
            />
            <NumField
              label="SCY"
              value={Number(selectedShape.scaleY ?? 1).toFixed(3)}
              onChange={(v) => onUpdateShape("scaleY", v)}
            />
          </div>

          <Divider />

          {/* Mirror */}
          <SectionLabel label="ESPELHAR" />
          <div style={{ display: "flex", gap: 4 }}>
            <ActionButton label="Espelhar X" onClick={onMirrorX} color={COLORS.axisX} />
            <ActionButton label="Espelhar Y" onClick={onMirrorY} color={COLORS.axisY} />
          </div>

          {/* Reset — only for shapes that have an original snapshot */}
          {selectedShape.originalPoints && (
            <>
              <Divider />
              <SectionLabel label="RESETAR" />
              <ResetButton onClick={onResetShape} />
            </>
          )}

          <Divider />

          {/* Fill */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SectionLabel label="COR" />
            <div
              ref={fillSwatchRef}
              title="Abrir color picker"
              onClick={openFillPicker}
              style={{
                width: 16,
                height: 16,
                background: selectedShape.fill,
                border: `1px solid ${pickerOpen ? COLORS.accent : COLORS.border}`,
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      ) : (
        <EmptyState />
      )}

      <div style={{ flex: 1 }} />

      {/* Floating color picker */}
      {pickerOpen && selectedShape && (
        <div
          ref={pickerRef}
          style={{
            position: "fixed",
            top: pickerPos.top,
            left: pickerPos.left,
            zIndex: 1000,
          }}
        >
          <ColorPicker
            color={selectedShape.fill}
            onChange={(hex) => onUpdateShape("fill", hex)}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: `1px solid ${COLORS.border}`,
        fontSize: 10,
        color: COLORS.textDim,
        letterSpacing: "0.12em",
      }}
    >
      {label}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 9,
        color: COLORS.textDim,
        letterSpacing: "0.1em",
        marginBottom: -2,
      }}
    >
      {label}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: COLORS.border, margin: "2px 0" }} />;
}

function InfoRow({ label, value, dimId }: { label: string; value: string; dimId?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
      <span style={{ fontSize: 9, color: COLORS.textDim, letterSpacing: "0.08em" }}>{label}</span>
      <span
        style={{
          fontSize: dimId ? 9 : 10,
          color: dimId ? COLORS.textMid : COLORS.textBright,
          fontFamily: "inherit",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontSize: 9,
          color: COLORS.textDim,
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <input
        type="number"
        value={typeof value === "string" ? value : Number(value).toFixed(1)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          minWidth: 0,
          width: 0,
          background: COLORS.bg,
          border: `1px solid ${focused ? COLORS.accent : COLORS.border}`,
          color: COLORS.textBright,
          fontSize: 10,
          padding: "2px 4px",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.1s",
        }}
      />
    </div>
  );
}

function ActionButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered ? color + "22" : "none",
        border: `1px solid ${hovered ? color : COLORS.border}`,
        color: hovered ? color : COLORS.textMid,
        fontSize: 9,
        padding: "4px 0",
        cursor: "pointer",
        letterSpacing: "0.06em",
        fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.1s",
      }}
    >
      {label}
    </button>
  );
}


function ResetButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        background: hovered ? COLORS.red + "18" : "transparent",
        border: `1px solid ${hovered ? COLORS.red : COLORS.border}`,
        color: hovered ? COLORS.red : COLORS.textMid,
        fontSize: 10,
        fontWeight: 700,
        padding: "5px 0",
        cursor: "pointer",
        letterSpacing: "0.08em",
        fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.12s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      ↺ Resetar Polígono
    </button>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "12px", fontSize: 10, color: COLORS.textDim }}>
      nenhuma seleção
    </div>
  );
}
