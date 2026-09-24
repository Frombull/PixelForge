"use client";

import React, { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { COLORS, TOOLS, PLACEHOLDER_TOOLS, FONT_FAMILY } from "./lib/constants";
import type { Tool, Shape } from "./lib/types";
import { buildTransformMatrixLatex, getMatrixTitle } from "./lib/matrixMath";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  selectedShape: Shape | null;
}

const MATRIX_TOOLS: Tool[] = ["TRANSLATE", "ROTATE", "SCALE", "SHEAR"];

export default function Toolbar({ activeTool, onToolChange, selectedShape }: ToolbarProps) {
  const matrixRef = useRef<HTMLDivElement>(null);
  const showMatrix = MATRIX_TOOLS.includes(activeTool);

  useEffect(() => {
    const el = matrixRef.current;
    if (!el) return;
    if (!showMatrix) {
      el.innerHTML = "";
      return;
    }
    const latex = buildTransformMatrixLatex(activeTool, selectedShape);
    if (!latex) { el.innerHTML = ""; return; }
    try {
      el.innerHTML = katex.renderToString(latex, { throwOnError: false });
    } catch {
      // fail silently
    }
  }, [activeTool, selectedShape, showMatrix]);

  return (
    <div
      style={{
        width: 240,
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.border}`,
          height: 40,
          flexShrink: 0,
        }}
      >
        <a
          href="/"
          title="Home"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: "100%",
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
            textDecoration: "none",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.textBright;
            e.currentTarget.style.background = COLORS.panelAlt;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.textDim;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft size={13} strokeWidth={1.8} />
        </a>

        <span
          style={{
            flex: 1,
            padding: "0 12px",
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.textLabel,
            letterSpacing: "0.18em",
            fontFamily: FONT_FAMILY,
            textTransform: "uppercase",
          }}
        >
          Ferramentas
        </span>
      </div>

      {/* Primary tools group */}
      <GroupLabel label="Principais" />
      <div style={{ padding: "4px 8px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            icon={t.icon}
            shortcut={t.shortcut}
            label={t.label}
            active={activeTool === t.id}
            onClick={() => onToolChange(t.id)}
          />
        ))}
      </div>

      <SidebarDivider />

      <div style={{ flex: 1 }} />

      {/* ── Transformation matrix (bottom of sidebar) */}
      {showMatrix && (
        <div
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            padding: "10px 10px 12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.textLabel,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 10,
              fontFamily: FONT_FAMILY,
            }}
          >
            {getMatrixTitle(activeTool)}
          </div>
          <div
            ref={matrixRef}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              // KaTeX font-size override so the matrix fits the narrow sidebar
              fontSize: "1.1rem",
              color: COLORS.textBright,
              minHeight: 60,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.textLabel,
        letterSpacing: "0.14em",
        fontFamily: FONT_FAMILY,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

function SidebarDivider() {
  return (
    <div
      style={{
        height: 1,
        background: COLORS.border,
        margin: "4px 0",
        flexShrink: 0,
      }}
    />
  );
}

interface ToolButtonProps {
  icon: string;
  shortcut: string;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, shortcut, label, active, disabled = false, onClick }: ToolButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const bg = active
    ? COLORS.accentDim
    : hovered && !disabled
    ? `${COLORS.panelAlt}`
    : "transparent";

  const textColor = disabled
    ? COLORS.textSubtle
    : active
    ? COLORS.accent
    : hovered
    ? COLORS.textBright
    : COLORS.textMid;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={disabled ? `${label} (em breve)` : label}
      style={{
        width: "100%",
        height: 32,
        background: bg,
        border: `1px solid ${active ? COLORS.accent + "55" : hovered && !disabled ? COLORS.border : "transparent"}`,
        borderRadius: 3,
        color: textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 8px",
        opacity: disabled ? 0.3 : 1,
        transition: "background 0.1s, color 0.1s, border-color 0.1s",
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontSize: 17,
          width: 16,
          textAlign: "center",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: active ? 700 : 500,
          fontFamily: FONT_FAMILY,
          letterSpacing: "0.04em",
          flex: 1,
          color: textColor,
        }}
      >
        {label}
      </span>
      {shortcut && (
        <span
          style={{
            fontSize: 12,
            color: active ? COLORS.accent : COLORS.textSubtle,
            fontFamily: FONT_FAMILY,
            background: active ? `${COLORS.accent}14` : `${COLORS.bg}cc`,
            border: `1px solid ${active ? COLORS.accent + "33" : COLORS.border}`,
            borderRadius: 2,
            padding: "1px 5px",
            letterSpacing: 0,
            lineHeight: "16px",
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}
