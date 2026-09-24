"use client";

import React from "react";
import { COLORS, FONT_FAMILY } from "./lib/constants";

interface AnimationPanelProps {
  hasSelection: boolean;
  currentFrame: number;
  maxFrames: number;
  frameRate: number;
  isPlaying: boolean;
  loop: boolean;
  keyframeFrames: number[]; // sorted frames that have a keyframe for the selected shape

  onJumpToFrame: (frame: number) => void;
  onTogglePlaying: () => void;
  onNextKeyframe: () => void;
  onPrevKeyframe: () => void;
  onAddKeyframe: () => void;
  onDeleteKeyframe: () => void;
  onMaxFramesChange: (v: number) => void;
  onFrameRateChange: (v: number) => void;
  onLoopChange: (v: boolean) => void;
}

export default function AnimationPanel({
  hasSelection,
  currentFrame,
  maxFrames,
  frameRate,
  isPlaying,
  loop,
  keyframeFrames,
  onJumpToFrame,
  onTogglePlaying,
  onNextKeyframe,
  onPrevKeyframe,
  onAddKeyframe,
  onDeleteKeyframe,
  onMaxFramesChange,
  onFrameRateChange,
  onLoopChange,
}: AnimationPanelProps) {
  const hasKeyframeHere = keyframeFrames.includes(currentFrame);

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
          Animação
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!hasSelection && (
          <div
            style={{
              padding: "16px 12px",
              fontSize: 12,
              color: COLORS.textSubtle,
              letterSpacing: "0.06em",
              lineHeight: 1.6,
            }}
          >
            Selecione um objeto para adicionar keyframes.
          </div>
        )}

        <Section label="Timeline">
          <Timeline
            currentFrame={currentFrame}
            maxFrames={maxFrames}
            keyframeFrames={keyframeFrames}
            onScrub={onJumpToFrame}
          />
          <SliderRow
            value={currentFrame}
            min={0}
            max={maxFrames}
            step={1}
            display={String(currentFrame)}
            onChange={onJumpToFrame}
          />
        </Section>

        <PanelDivider />

        <Section label="Reprodução">
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn label="⏮" title="Keyframe anterior" onClick={onPrevKeyframe} disabled={!hasSelection} />
            <ActionBtn label={isPlaying ? "⏸ Pausar" : "▶ Play"} onClick={onTogglePlaying} />
            <IconBtn label="⏭" title="Próximo keyframe" onClick={onNextKeyframe} disabled={!hasSelection} />
          </div>
          <Checkbox label="Repetir animação" checked={loop} onChange={onLoopChange} />
        </Section>

        <PanelDivider />

        <Section label="Keyframes">
          <div style={{ display: "flex", gap: 6 }}>
            <ActionBtn label="+ Add" onClick={onAddKeyframe} disabled={!hasSelection} />
            <ActionBtn
              label="- Del"
              onClick={onDeleteKeyframe}
              disabled={!hasSelection || !hasKeyframeHere}
            />
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSubtle, letterSpacing: "0.06em" }}>
            {keyframeFrames.length === 0
              ? "Nenhum keyframe"
              : `${keyframeFrames.length} keyframe(s): ${keyframeFrames.join(", ")}`}
          </div>
        </Section>

        <PanelDivider />

        <Section label="Configurações">
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", marginBottom: 4 }}>
              FRAME RATE
            </div>
            <SliderRow
              value={frameRate}
              min={1}
              max={60}
              step={1}
              display={String(frameRate)}
              onChange={onFrameRateChange}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.textMid, letterSpacing: "0.1em", marginBottom: 4 }}>
              MAX FRAMES
            </div>
            <SliderRow
              value={maxFrames}
              min={10}
              max={300}
              step={10}
              display={String(maxFrames)}
              onChange={onMaxFramesChange}
            />
          </div>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function PanelDivider() {
  return <div style={{ height: 1, background: COLORS.border, flexShrink: 0 }} />;
}

function Timeline({
  currentFrame,
  maxFrames,
  keyframeFrames,
  onScrub,
}: {
  currentFrame: number;
  maxFrames: number;
  keyframeFrames: number[];
  onScrub: (frame: number) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrubFromEvent = (e: React.MouseEvent) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onScrub(Math.round(pct * maxFrames));
  };

  const playheadPct = maxFrames > 0 ? (currentFrame / maxFrames) * 100 : 0;

  return (
    <div
      ref={trackRef}
      onMouseDown={scrubFromEvent}
      style={{
        position: "relative",
        height: 28,
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 2,
        cursor: "pointer",
      }}
    >
      {keyframeFrames.map((f) => (
        <div
          key={f}
          title={`Frame ${f}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            onScrub(f);
          }}
          style={{
            position: "absolute",
            left: `${(f / maxFrames) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: f === currentFrame ? 10 : 8,
            height: f === currentFrame ? 10 : 8,
            borderRadius: "50%",
            background: COLORS.yellow ?? "#fbbf24",
            border: f === currentFrame ? `1.5px solid ${COLORS.textBright}` : "none",
            zIndex: 2,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: `${playheadPct}%`,
          top: 0,
          bottom: 0,
          width: 2,
          background: COLORS.red,
          transform: "translateX(-1px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function SliderRow({
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: COLORS.accent }}
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

function IconBtn({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30,
        background: hovered && !disabled ? COLORS.panelAlt : COLORS.bg,
        border: `1px solid ${hovered && !disabled ? COLORS.accent + "88" : COLORS.border}`,
        borderRadius: 2,
        color: disabled ? COLORS.textSubtle : hovered ? COLORS.textBright : COLORS.textMid,
        fontSize: 14,
        padding: "6px 0",
        cursor: disabled ? "default" : "pointer",
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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
      {label}
    </label>
  );
}
