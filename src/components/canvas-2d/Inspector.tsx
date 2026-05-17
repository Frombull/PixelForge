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
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const fillSwatchRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setPickerOpen(false); }, [selectedShape?.id]);

  const openFillPicker = () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    if (fillSwatchRef.current) {
      const rect = fillSwatchRef.current.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 380, Math.max(8, rect.top));
      setPickerPos({ top, left: rect.left - 234 });
    }
    setPickerOpen(true);
  };

  return (
    <div
      style={{
        width: 200,
        background: COLORS.panel,
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: COLORS.textLabel,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Inspetor
        </span>
        {selectedShape && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              color: COLORS.textSubtle,
              background: COLORS.panelAlt,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 2,
              padding: "2px 6px",
              letterSpacing: "0.04em",
            }}
          >
            {selectedShape.type}
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {selectedShape ? (
          <>
            {/* Identity */}
            <Section label="Objeto">
              <InfoPair>
                <InfoCell label="ID" value={selectedShape.id} mono dim />
              </InfoPair>
            </Section>

            <PanelDivider />

            {/* Transform */}
            <Section label="Transformação">
              <FieldRow>
                <NumField label="X" value={selectedShape.x} onChange={(v) => onUpdateShape("x", v)} />
                <NumField label="Y" value={selectedShape.y} onChange={(v) => onUpdateShape("y", v)} />
              </FieldRow>
              <FieldRow>
                {selectedShape.type === "circle" && (
                  <NumField label="R" value={selectedShape.radius ?? 0} onChange={(v) => onUpdateShape("radius", v)} />
                )}
                <NumField
                  label="Rot"
                  value={Number(((selectedShape.rotation ?? 0) * 180) / Math.PI).toFixed(1)}
                  onChange={(v) => onUpdateShape("rotation", (v * Math.PI) / 180)}
                />
              </FieldRow>
              <FieldRow>
                <NumField
                  label="Sc X"
                  value={Number(selectedShape.scaleX ?? 1).toFixed(3)}
                  onChange={(v) => onUpdateShape("scaleX", v)}
                />
                <NumField
                  label="Sc Y"
                  value={Number(selectedShape.scaleY ?? 1).toFixed(3)}
                  onChange={(v) => onUpdateShape("scaleY", v)}
                />
              </FieldRow>
            </Section>

            <PanelDivider />

            {/* Fill */}
            <Section label="Aparência">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: COLORS.textMid, letterSpacing: "0.08em" }}>COR</span>
                <div
                  ref={fillSwatchRef}
                  title="Abrir color picker"
                  onClick={openFillPicker}
                  style={{
                    width: 20,
                    height: 20,
                    background: selectedShape.fill,
                    border: `1px solid ${pickerOpen ? COLORS.accent : COLORS.border}`,
                    borderRadius: 2,
                    cursor: "pointer",
                    flexShrink: 0,
                    boxShadow: pickerOpen ? `0 0 0 2px ${COLORS.accent}22` : "none",
                    transition: "border-color 0.1s, box-shadow 0.1s",
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: COLORS.textMid,
                    letterSpacing: "0.06em",
                    fontFamily: "inherit",
                  }}
                >
                  {selectedShape.fill.toUpperCase()}
                </span>
              </div>
            </Section>

            <PanelDivider />

            {/* Mirror */}
            <Section label="Espelhar">
              <div style={{ display: "flex", gap: 6 }}>
                <AxisButton label="Eixo X" onClick={onMirrorX} color={COLORS.axisX} />
                <AxisButton label="Eixo Y" onClick={onMirrorY} color={COLORS.axisY} />
              </div>
            </Section>

            {/* Reset */}
            {selectedShape.originalPoints && (
              <>
                <PanelDivider />
                <Section label="Reset">
                  <ResetButton onClick={onResetShape} />
                </Section>
              </>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px 12px" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: COLORS.textLabel,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function PanelDivider() {
  return <div style={{ height: 1, background: COLORS.border, flexShrink: 0 }} />;
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 6 }}>{children}</div>;
}

function InfoPair({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{children}</div>;
}

function InfoCell({
  label,
  value,
  mono,
  dim,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dim?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
      <span style={{ fontSize: 8, color: COLORS.textMid, letterSpacing: "0.1em" }}>{label}</span>
      <span
        style={{
          fontSize: dim ? 9 : 10,
          color: dim ? COLORS.textMid : COLORS.textBright,
          fontFamily: mono ? "inherit" : undefined,
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
  const [draft, setDraft] = React.useState<string | null>(null);

  const displayValue = draft !== null
    ? draft
    : typeof value === "string"
    ? value
    : Number(value).toFixed(1);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(parsed);
    setDraft(null);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 8,
          color: COLORS.textMid,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          setDraft(e.target.value);
          e.target.select();
        }}
        onBlur={(e) => {
          setFocused(false);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          width: "100%",
          background: COLORS.bg,
          border: `1px solid ${focused ? COLORS.accent : COLORS.border}`,
          borderRadius: 2,
          color: focused ? COLORS.textBright : COLORS.text,
          fontSize: 10,
          padding: "4px 6px",
          fontFamily: "inherit",
          outline: "none",
          transition: "border-color 0.1s, color 0.1s",
        }}
      />
    </div>
  );
}

function AxisButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered ? COLORS.panelAlt : COLORS.bg,
        border: `1px solid ${hovered ? COLORS.accent + "88" : COLORS.border}`,
        borderRadius: 2,
        color: hovered ? COLORS.textBright : COLORS.textMid,
        fontSize: 9,
        padding: "5px 0",
        cursor: "pointer",
        letterSpacing: "0.08em",
        fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.12s",
        outline: "none",
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
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        background: hovered ? COLORS.panelAlt : COLORS.bg,
        border: `1px solid ${hovered ? COLORS.red + "88" : COLORS.border}`,
        borderRadius: 2,
        color: hovered ? COLORS.red : COLORS.textMid,
        fontSize: 9,
        fontWeight: 500,
        padding: "6px 0",
        cursor: "pointer",
        letterSpacing: "0.08em",
        fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.12s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        outline: "none",
      }}
    >
      ↺ Resetar Polígono
    </button>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "24px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 18, opacity: 0.15 }}>◻</span>
      <span
        style={{
          fontSize: 9,
          color: COLORS.textSubtle,
          letterSpacing: "0.1em",
          lineHeight: 1.6,
        }}
      >
        Nenhum objeto
        <br />
        selecionado
      </span>
    </div>
  );
}
