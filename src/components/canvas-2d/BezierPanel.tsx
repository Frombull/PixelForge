"use client";

import React from "react";
import { COLORS, FONT_FAMILY, BEZIER_CONSTRUCTION_GREEN, BEZIER_CONSTRUCTION_BLUE, BEZIER_STROKE } from "./lib/constants";
import type { BezierKind, BezierVisibility } from "./lib/types";

interface BezierPanelProps {
  bezierKind: BezierKind;
  onBezierKindChange: (kind: BezierKind) => void;
  pointCount: number;
  isComplete: boolean;

  progress: number;
  onProgressChange: (t: number) => void;
  isAnimating: boolean;
  onToggleAnimating: () => void;
  onReset: () => void;

  speed: number;
  onSpeedChange: (v: number) => void;
  loop: boolean;
  onLoopChange: (v: boolean) => void;

  visibility: BezierVisibility;
  onVisibilityChange: (v: BezierVisibility) => void;

  onClear: () => void;
}

export default function BezierPanel({
  bezierKind,
  onBezierKindChange,
  pointCount,
  isComplete,
  progress,
  onProgressChange,
  isAnimating,
  onToggleAnimating,
  onReset,
  speed,
  onSpeedChange,
  loop,
  onLoopChange,
  visibility,
  onVisibilityChange,
  onClear,
}: BezierPanelProps) {
  const maxPoints = bezierKind === "cubic" ? 4 : 3;

  const levelColors = [BEZIER_CONSTRUCTION_GREEN, BEZIER_CONSTRUCTION_BLUE];

  // Checkboxes in fixed z-order: level dots/lines → final point → curve (top).
  // Control points are always shown and have no toggle.
  const items: { label: string; checked: boolean; color: string; onToggle: () => void }[] = [];

  visibility.levelDots.forEach((_, li) => {
    const color = levelColors[Math.min(li, levelColors.length - 1)];
    items.push({
      label: `Bolinhas — nível ${li + 1}`,
      checked: visibility.levelDots[li],
      color,
      onToggle: () => {
        const levelDots = [...visibility.levelDots];
        levelDots[li] = !levelDots[li];
        onVisibilityChange({ ...visibility, levelDots });
      },
    });
    items.push({
      label: `Linhas — nível ${li + 1}`,
      checked: visibility.levelLines[li],
      color,
      onToggle: () => {
        const levelLines = [...visibility.levelLines];
        levelLines[li] = !levelLines[li];
        onVisibilityChange({ ...visibility, levelLines });
      },
    });
  });

  items.push(
    {
      label: "Ponto final",
      checked: visibility.finalPoint,
      color: BEZIER_STROKE,
      onToggle: () => onVisibilityChange({ ...visibility, finalPoint: !visibility.finalPoint }),
    },
    {
      label: "Curva",
      checked: visibility.curve,
      color: BEZIER_STROKE,
      onToggle: () => onVisibilityChange({ ...visibility, curve: !visibility.curve }),
    }
  );

  return (
    <div
      style={{
        width: 270,
        background: COLORS.panel,
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
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
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.textLabel,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Curvas Bézier
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Section label="Tipo">
          <div style={{ display: "flex", gap: 6 }}>
            <ToggleButton
              label="Quadrática [3]"
              active={bezierKind === "quadratic"}
              onClick={() => onBezierKindChange("quadratic")}
            />
            <ToggleButton
              label="Cúbica [4]"
              active={bezierKind === "cubic"}
              onClick={() => onBezierKindChange("cubic")}
            />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSubtle, letterSpacing: "0.06em" }}>
            {pointCount}/{maxPoints} pontos de controle
          </div>
        </Section>

        <PanelDivider />

        <Section label="Tempo [t]">
          <SliderRow
            value={progress}
            min={0}
            max={1}
            step={0.01}
            display={progress.toFixed(2)}
            onChange={onProgressChange}
            disabled={!isComplete}
          />
        </Section>

        <PanelDivider />

        <Section label="Reprodução">
          <div style={{ display: "flex", gap: 6 }}>
            <ActionBtn
              label={isAnimating ? "⏸ Pausar" : "▶ Reproduzir"}
              onClick={onToggleAnimating}
              disabled={!isComplete}
            />
            <ActionBtn label="⏮ Reset" onClick={onReset} disabled={!isComplete} />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", marginBottom: 4 }}>
              VELOCIDADE
            </div>
            <SliderRow
              value={speed}
              min={0.1}
              max={3}
              step={0.1}
              display={speed.toFixed(1)}
              onChange={onSpeedChange}
            />
          </div>

          <Checkbox label="Repetir animação" checked={loop} onChange={onLoopChange} />
        </Section>

        <PanelDivider />

        <Section label="Exibição">
          {items.map((item, i) => (
            <Checkbox
              key={i}
              label={item.label}
              checked={item.checked}
              color={item.color}
              onChange={item.onToggle}
            />
          ))}
        </Section>

        <PanelDivider />

        <Section label="Ações">
          <ResetButton onClick={onClear} />
        </Section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px 12px" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: COLORS.textLabel,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function PanelDivider() {
  return <div style={{ height: 1, background: COLORS.border, flexShrink: 0 }} />;
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: active ? COLORS.accentDim : hovered ? COLORS.panelAlt : COLORS.bg,
        border: `1px solid ${active ? COLORS.accent : hovered ? COLORS.border : COLORS.border}`,
        borderRadius: 2,
        color: active ? COLORS.accent : hovered ? COLORS.textBright : COLORS.textMid,
        fontSize: 12,
        padding: "6px 4px",
        cursor: "pointer",
        letterSpacing: "0.04em",
        fontFamily: FONT_FAMILY,
        transition: "all 0.12s",
        outline: "none",
      }}
    >
      {label}
    </button>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered && !disabled ? COLORS.panelAlt : COLORS.bg,
        border: `1px solid ${hovered && !disabled ? COLORS.accent + "88" : COLORS.border}`,
        borderRadius: 2,
        color: disabled ? COLORS.textSubtle : hovered ? COLORS.textBright : COLORS.textMid,
        fontSize: 12,
        padding: "6px 0",
        cursor: disabled ? "default" : "pointer",
        letterSpacing: "0.06em",
        fontFamily: FONT_FAMILY,
        transition: "all 0.12s",
        outline: "none",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}

function SliderRow({
  value,
  min,
  max,
  step,
  display,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: COLORS.accent, opacity: disabled ? 0.4 : 1 }}
      />
      <span
        style={{
          fontSize: 12,
          color: COLORS.textMid,
          minWidth: 28,
          textAlign: "right",
          letterSpacing: "0.04em",
        }}
      >
        {display}
      </span>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: COLORS.textMid,
        letterSpacing: "0.04em",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: COLORS.accent }}
      />
      {color && (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: color,
            border: "1.5px solid #ffffff",
            outline: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </label>
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
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 0",
        cursor: "pointer",
        letterSpacing: "0.08em",
        fontFamily: FONT_FAMILY,
        transition: "all 0.12s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        outline: "none",
      }}
    >
      ↺ Limpar Curva
    </button>
  );
}
