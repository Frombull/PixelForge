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
        width: 176,
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
            fontSize: 9,
            fontWeight: 600,
            color: COLORS.textLabel,
            letterSpacing: "0.18em",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
          }}
        >
          Ferramentas
        </span>
      </div>

      {/* Primary tools group */}
      <GroupLabel label="Principais" />
      <div style={{ padding: "4px 8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
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

      {/* Placeholder tools group */}
      <GroupLabel label="Em breve" />
      <div style={{ padding: "4px 8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
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

function GroupLabel({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        fontSize: 9,
        fontWeight: 600,
        color: COLORS.textLabel,
        letterSpacing: "0.14em",
        fontFamily: "'JetBrains Mono', monospace",
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
          fontSize: 14,
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
          fontSize: 10,
          fontWeight: active ? 600 : 400,
          fontFamily: "'JetBrains Mono', monospace",
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
            fontSize: 9,
            color: active ? COLORS.accent : COLORS.textSubtle,
            fontFamily: "'JetBrains Mono', monospace",
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
