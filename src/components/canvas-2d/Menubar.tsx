"use client";

import React from "react";
import { COLORS } from "./lib/constants";

interface MenuAction {
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}

interface MenubarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  hasClipboard: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
}

export default function Menubar({
  canUndo,
  canRedo,
  hasSelection,
  hasClipboard,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
}: MenubarProps) {
  const actions: MenuAction[] = [
    { label: "UNDO", shortcut: "^Z",  onClick: onUndo,   disabled: !canUndo       },
    { label: "REDO",  shortcut: "^Y",  onClick: onRedo,   disabled: !canRedo       },
    { label: "COPIAR",   shortcut: "^C",  onClick: onCopy,   disabled: !hasSelection  },
    { label: "COLAR",    shortcut: "^V",  onClick: onPaste,  disabled: !hasClipboard  },
    { label: "APAGAR",   shortcut: "Del", onClick: onDelete, disabled: !hasSelection  },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 36,
        background: COLORS.panel,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "0 12px",
        flexShrink: 0,
        gap: 0,
      }}
    >
      {/* Logo / title */}
      <span
        style={{
          color: COLORS.accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          marginRight: 20,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        POLYFORGE
      </span>

      {/* Actions */}
      {actions.map((a) => (
        <MenuButton key={a.label} {...a} />
      ))}

      <div style={{ flex: 1 }} />

    </div>
  );
}

function MenuButton({ label, shortcut, onClick, disabled }: MenuAction) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "none",
        border: "none",
        color: disabled
          ? COLORS.textSubtle
          : hovered
          ? COLORS.textBright
          : COLORS.textMid,
        cursor: disabled ? "default" : "pointer",
        fontSize: 10,
        padding: "0 10px",
        height: "100%",
        letterSpacing: "0.08em",
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'JetBrains Mono', monospace",
        opacity: disabled ? 0.4 : 1,
        transition: "color 0.1s",
      }}
    >
      {label}
      {shortcut && (
        <span style={{ fontSize: 9, color: COLORS.textSubtle }}>{shortcut}</span>
      )}
    </button>
  );
}
