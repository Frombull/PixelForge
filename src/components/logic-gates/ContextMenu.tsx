"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  submenu?: ContextMenuEntry[];
  // Cor opcional pro label (ex.: cyan pra custom gates).
  accent?: string;
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
      <MenuItems items={items} onClose={onClose} />
    </div>
  );
}

function MenuItems({
  items,
  onClose,
}: {
  items: ContextMenuEntry[];
  onClose: () => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      {items.map((item, i) => {
        if (item === "separator") {
          return (
            <div
              key={`sep-${i}`}
              style={{ height: 1, background: "#3a3a3a", margin: "4px 2px" }}
            />
          );
        }
        const hasSubmenu = !!item.submenu && item.submenu.length > 0;
        return (
          <div
            key={`it-${i}`}
            style={{ position: "relative" }}
            onMouseEnter={() => setOpenIdx(hasSubmenu && !item.disabled ? i : null)}
          >
            <MenuItem item={item} onClose={onClose} hasSubmenu={hasSubmenu} />
            {hasSubmenu && openIdx === i && (
              <Submenu items={item.submenu!} onClose={onClose} />
            )}
          </div>
        );
      })}
    </>
  );
}

function Submenu({
  items,
  onClose,
}: {
  items: ContextMenuEntry[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [flipLeft, setFlipLeft] = useState(false);
  const [offsetY, setOffsetY] = useState(0);

  // Ajusta posição se o submenu sair da viewport (lado e/ou base).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right + 4 > vw) setFlipLeft(true);
    if (rect.bottom + 8 > vh) {
      setOffsetY(Math.min(0, vh - rect.bottom - 8));
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: offsetY - 4,
        ...(flipLeft ? { right: "100%", marginRight: 2 } : { left: "100%", marginLeft: 2 }),
        minWidth: 160,
        maxHeight: "70vh",
        overflowY: "auto",
        background: "#1e1e1e",
        border: "1px solid #3a3a3a",
        boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        padding: 4,
        zIndex: 1001,
      }}
    >
      <MenuItems items={items} onClose={onClose} />
    </div>
  );
}

function MenuItem({
  item,
  onClose,
  hasSubmenu,
}: {
  item: ContextMenuItem;
  onClose: () => void;
  hasSubmenu: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const color = item.disabled
    ? "#5a5a5a"
    : item.danger && hovered
    ? "#f87171"
    : hovered
    ? "#ffffff"
    : item.accent ?? "#b0b0b0";
  const bg = item.disabled
    ? "transparent"
    : hovered
    ? "#363636"
    : "transparent";

  const handleClick = () => {
    if (item.disabled) return;
    if (hasSubmenu) return; // submenus abrem via hover
    item.onClick?.();
    onClose();
  };

  return (
    <button
      type="button"
      disabled={item.disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
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
      {hasSubmenu ? (
        <span style={{ color: "#6a6a6a", marginLeft: 16 }}>▸</span>
      ) : item.shortcut ? (
        <span style={{ color: "#6a6a6a", marginLeft: 16 }}>{item.shortcut}</span>
      ) : null}
    </button>
  );
}
