"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export type ContextMenuEntry = ContextMenuItem | "separator";

interface Props {
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Mantém o menu dentro da viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (x + rect.width + 8 > vw) nx = vw - rect.width - 8;
    if (y + rect.height + 8 > vh) ny = vh - rect.height - 8;
    if (nx !== pos.x || ny !== pos.y) setPos({ x: nx, y: ny });
  }, [x, y, pos.x, pos.y]);

  // Fecha em click fora, Esc, wheel ou resize.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onWheel = () => onClose();
    const onResize = () => onClose();
    // setTimeout pra ignorar o próprio mousedown que abriu o menu.
    const id = window.setTimeout(() => {
      window.addEventListener("mousedown", onDown);
      window.addEventListener("contextmenu", onDown);
    }, 0);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("contextmenu", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        top: pos.y,
        left: pos.x,
        zIndex: 1000,
        minWidth: 180,
        background: "#1e1e1e",
        border: "1px solid #3a3a3a",
        boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        padding: 4,
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: "none",
      }}
    >
      {items.map((item, i) => {
        if (item === "separator") {
          return (
            <div
              key={`sep-${i}`}
              style={{ height: 1, background: "#3a3a3a", margin: "4px 2px" }}
            />
          );
        }
        return (
          <MenuItem
            key={`it-${i}`}
            item={item}
            onClose={onClose}
          />
        );
      })}
    </div>
  );
}

function MenuItem({ item, onClose }: { item: ContextMenuItem; onClose: () => void }) {
  const [hovered, setHovered] = useState(false);
  const color = item.disabled
    ? "#5a5a5a"
    : item.danger && hovered
    ? "#f87171"
    : hovered
    ? "#ffffff"
    : "#b0b0b0";
  const bg = item.disabled
    ? "transparent"
    : hovered
    ? "#363636"
    : "transparent";

  return (
    <button
      type="button"
      disabled={item.disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (item.disabled) return;
        item.onClick();
        onClose();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: 26,
        padding: "0 10px",
        background: bg,
        border: "none",
        color,
        cursor: item.disabled ? "default" : "pointer",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textAlign: "left",
        transition: "color 0.08s, background 0.08s",
      }}
    >
      <span>{item.label}</span>
      {item.shortcut && (
        <span style={{ color: "#6a6a6a", marginLeft: 16 }}>{item.shortcut}</span>
      )}
    </button>
  );
}
