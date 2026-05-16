"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { COLORS, TOOLS, PLACEHOLDER_TOOLS } from "./lib/constants";
import type { Tool } from "./lib/types";

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

export default function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div
      style={{
        width: 192,
        background: COLORS.panel,
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flexShrink: 0,
      }}
    >
      {/* Header: back arrow + section label side by side */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${COLORS.border}`,
          height: 38,
        }}
      >
        <a
          href="/"
          title="Home"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: "100%",
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
            textDecoration: "none",
            transition: "color 0.1s, background 0.1s",
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
          <ArrowLeft size={13} />
        </a>

        <span
          style={{
            flex: 1,
            padding: "0 12px",
            fontSize: 10,
            fontWeight: 700,
            color: COLORS.textDim,
            letterSpacing: "0.16em",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          FERRAMENTAS
        </span>
      </div>

      {/* Primary tools */}
      <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
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

      {/* Placeholder tools */}
      <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        {PLACEHOLDER_TOOLS.map((t) => (
          <ToolButton
            key={t.label}
            icon="⬚"
            shortcut=""
            label={t.label}
            active={false}
            disabled
            onClick={() => {}}
          />
        ))}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    ? COLORS.panelAlt
    : "transparent";

  const borderColor = active ? COLORS.accent : hovered && !disabled ? COLORS.border : COLORS.border;

  const textColor = disabled
    ? COLORS.textDim
    : active
    ? COLORS.accent
    : hovered
    ? COLORS.textBright
    : COLORS.text;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: 36,
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 1,
        color: textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 10px",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.1s, color 0.12s, border-color 0.12s",
        textAlign: "left",
        boxShadow: active
          ? `inset 0 0 0 1px ${COLORS.accent}22`
          : hovered && !disabled
          ? "inset 0 1px 0 rgba(255,255,255,0.04)"
          : "none",
      }}
    >
      <span
        style={{
          fontSize: 16,
          width: 18,
          textAlign: "center",
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.1em",
          flex: 1,
        }}
      >
        {label}
      </span>
      {shortcut && (
        <span
          style={{
            fontSize: 9,
            color: active ? COLORS.accent : COLORS.textDim,
            fontFamily: "'JetBrains Mono', monospace",
            background: active ? `${COLORS.accent}18` : COLORS.panelAlt,
            border: `1px solid ${active ? COLORS.accent + "44" : COLORS.border}`,
            borderRadius: 3,
            padding: "1px 4px",
            letterSpacing: 0,
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: "calc(100% - 16px)",
        marginLeft: 8,
        height: 1,
        background: COLORS.border,
        margin: "4px 8px",
        flexShrink: 0,
      }}
    />
  );
}
