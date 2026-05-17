"use client";

import React, { useRef } from "react";
import { Settings } from "lucide-react";
import { COLORS } from "./lib/constants";
import type { EditorSettings } from "./lib/types";

interface SettingsMenuProps {
  settings: EditorSettings;
  onChange: (patch: Partial<EditorSettings>) => void;
}

export default function SettingsMenu({ settings, onChange }: SettingsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);


  const toggles: { key: keyof EditorSettings; label: string; description: string }[] = [
    { key: "snapEnabled",    label: "Snap to grid",        description: "Segure Shift para ignorar grid" },
    { key: "showGrid",       label: "Mostrar grid",        description: "Linhas do grid"      },
    { key: "showAxes",       label: "Mostrar axis",        description: "Eixos X e Y" },
    { key: "showVertexDots", label: "Mostrar vértices",  description: "Pontos nos vértices do polígono" },
    { key: "showDebug",      label: "Mostrar painel de debug",  description: "Debug" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        title="Configurações"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: open ? COLORS.panelAlt : COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          color: open ? COLORS.textBright : COLORS.textMid,
          cursor: "pointer",
          fontSize: 10,
          padding: "0 10px",
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontFamily: "'JetBrains Mono', monospace",
          transition: "color 0.1s, background 0.1s",
          whiteSpace: "nowrap",
        }}
      >
        <Settings size={13} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            width: 224,
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              borderBottom: `1px solid ${COLORS.border}`,
              fontSize: 9,
              color: COLORS.textDim,
              letterSpacing: "0.12em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            CONFIGURAÇÕES
          </div>

          <div style={{ padding: "6px 0" }}>
            {toggles.map((t) => (
              <ToggleRow
                key={t.key}
                label={t.label}
                description={t.description}
                value={settings[t.key]}
                onChange={(v) => onChange({ [t.key]: v })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={() => onChange(!value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        cursor: "pointer",
        background: hovered ? COLORS.panelAlt : "none",
        gap: 8,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            color: value ? COLORS.textBright : COLORS.textMid,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 8,
            color: COLORS.textSubtle,
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 1,
          }}
        >
          {description}
        </div>
      </div>

      {/* Toggle pill */}
      <div
        style={{
          width: 28,
          height: 14,
          background: value ? COLORS.accent : COLORS.border,
          position: "relative",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: value ? 14 : 2,
            width: 10,
            height: 10,
            background: value ? COLORS.bg : COLORS.textSubtle,
            transition: "left 0.15s",
          }}
        />
      </div>
    </div>
  );
}
