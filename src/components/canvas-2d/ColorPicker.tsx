"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { COLORS } from "./lib/constants";

// ── Color conversions ──────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, v];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Layout constants ───────────────────────────────────────────────────────────

const SIZE = 200;
const CX   = SIZE / 2;
const CY   = SIZE / 2;
const RING_OUTER = 90;
const RING_INNER = 68;
const SQ = Math.floor((RING_INNER - 6) / Math.SQRT2); // half-side of SV square

// ── Component ──────────────────────────────────────────────────────────────────

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  style?: React.CSSProperties;
}

export default function ColorPicker({ color, onChange, style }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef   = useRef<"hue" | "sv" | null>(null);
  const prevColor = useRef(color);

  const initHsv = (): [number, number, number] => {
    const rgb = hexToRgb(color) ?? [61, 143, 255];
    return rgbToHsv(rgb[0], rgb[1], rgb[2]);
  };

  const [hsv,     setHsv]     = useState<[number, number, number]>(initHsv);
  const [hexText, setHexText] = useState(color.replace("#", "").toUpperCase());

  // Sync when external prop changes (e.g. palette click in Inspector)
  useEffect(() => {
    if (color === prevColor.current) return;
    prevColor.current = color;
    const rgb = hexToRgb(color);
    if (rgb) {
      setHsv(rgbToHsv(rgb[0], rgb[1], rgb[2]));
      setHexText(color.replace("#", "").toUpperCase());
    }
  }, [color]);

  const [h, s, v] = hsv;
  const [r, g, b] = hsvToRgb(h, s, v);
  const hex = rgbToHex(r, g, b);

  // ── Canvas render ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Hue ring: 360 pie slices, punch inner circle
    for (let deg = 0; deg < 360; deg++) {
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.arc(CX, CY, RING_OUTER, ((deg - 1) * Math.PI) / 180, ((deg + 1) * Math.PI) / 180);
      ctx.closePath();
      ctx.fillStyle = `hsl(${deg},100%,50%)`;
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CX, CY, RING_INNER, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // SV square: hue base + white saturation gradient + black value gradient
    const sx = CX - SQ, sy = CY - SQ, sw = SQ * 2, sh = SQ * 2;
    ctx.fillStyle = `hsl(${h},100%,50%)`;
    ctx.fillRect(sx, sy, sw, sh);

    const wg = ctx.createLinearGradient(sx, sy, sx + sw, sy);
    wg.addColorStop(0, "rgba(255,255,255,1)");
    wg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(sx, sy, sw, sh);

    const bg = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = bg;
    ctx.fillRect(sx, sy, sw, sh);

    // Hue ring handle
    const ha  = (h * Math.PI) / 180;
    const hr  = (RING_INNER + RING_OUTER) / 2;
    const hx2 = CX + Math.cos(ha) * hr;
    const hy2 = CY + Math.sin(ha) * hr;
    ctx.beginPath();
    ctx.arc(hx2, hy2, 8, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${h},100%,50%)`;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // SV square handle
    const svx = sx + s * sw;
    const svy = sy + (1 - v) * sh;
    ctx.beginPath();
    ctx.arc(svx, svy, 7, 0, Math.PI * 2);
    ctx.fillStyle = hex;
    ctx.fill();
    ctx.strokeStyle = v > 0.4 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(svx, svy, 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [h, s, v, hex]);

  // ── Interaction ───────────────────────────────────────────────────────────────
  const handlePos = useCallback(
    (cx: number, cy: number) => {
      const dx = cx - CX, dy = cy - CY;
      const dist = Math.hypot(dx, dy);
      const drag = dragRef.current;

      if (drag === "hue" || (drag === null && dist >= RING_INNER - 6 && dist <= RING_OUTER + 6)) {
        dragRef.current = "hue";
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        setHsv([angle, s, v]);
        const [nr, ng, nb] = hsvToRgb(angle, s, v);
        const newHex = rgbToHex(nr, ng, nb);
        setHexText(newHex.replace("#", "").toUpperCase());
        onChange(newHex);
        return;
      }

      const sx = CX - SQ, sy = CY - SQ, sw = SQ * 2, sh = SQ * 2;
      if (drag === "sv" || (drag === null && cx >= sx - 6 && cx <= sx + sw + 6 && cy >= sy - 6 && cy <= sy + sh + 6)) {
        dragRef.current = "sv";
        const ns = Math.max(0, Math.min(1, (cx - sx) / sw));
        const nv = Math.max(0, Math.min(1, 1 - (cy - sy) / sh));
        setHsv([h, ns, nv]);
        const [nr, ng, nb] = hsvToRgb(h, ns, nv);
        const newHex = rgbToHex(nr, ng, nb);
        setHexText(newHex.replace("#", "").toUpperCase());
        onChange(newHex);
      }
    },
    [h, s, v, onChange]
  );

  const toCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return [
      (e.clientX - rect.left) * (SIZE / rect.width),
      (e.clientY - rect.top)  * (SIZE / rect.height),
    ];
  };

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { handlePos(...toCanvasPos(e)); },
    [handlePos]
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { if (dragRef.current) handlePos(...toCanvasPos(e)); },
    [handlePos]
  );
  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  // ── Apply helpers ─────────────────────────────────────────────────────────────
  const applyHex = (val: string) => {
    const rgb = hexToRgb(val);
    if (!rgb) return;
    setHsv(rgbToHsv(rgb[0], rgb[1], rgb[2]));
    onChange(`#${val.toLowerCase()}`);
  };

  const applyRgb = (ch: 0 | 1 | 2, val: number) => {
    const arr: [number, number, number] = [r, g, b];
    arr[ch] = Math.max(0, Math.min(255, Math.round(val)));
    const newHex = rgbToHex(arr[0], arr[1], arr[2]);
    setHsv(rgbToHsv(arr[0], arr[1], arr[2]));
    setHexText(newHex.replace("#", "").toUpperCase());
    onChange(newHex);
  };

  const applyHsvInput = (ch: 0 | 1 | 2, val: number) => {
    const n: [number, number, number] = [h, s, v];
    if (ch === 0) n[0] = Math.max(0, Math.min(360, val));
    if (ch === 1) n[1] = Math.max(0, Math.min(100, val)) / 100;
    if (ch === 2) n[2] = Math.max(0, Math.min(100, val)) / 100;
    setHsv(n);
    const [nr, ng, nb] = hsvToRgb(n[0], n[1], n[2]);
    const newHex = rgbToHex(nr, ng, nb);
    setHexText(newHex.replace("#", "").toUpperCase());
    onChange(newHex);
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textBright,
    fontSize: 10,
    padding: "2px 4px",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
    width: "100%",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 8,
    color: COLORS.textSubtle,
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: 2,
  };

  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        userSelect: "none",
        fontFamily: "'JetBrains Mono', monospace",
        ...style,
      }}
    >
      {/* Wheel + SV square */}
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ width: SIZE, height: SIZE, display: "block", cursor: "crosshair" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Color preview + hex input */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div
          style={{
            width: 22,
            height: 22,
            background: hex,
            border: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: COLORS.textSubtle, fontSize: 9, flexShrink: 0 }}>#</span>
        <input
          type="text"
          maxLength={6}
          value={hexText}
          onChange={(e) => {
            const raw = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "");
            setHexText(raw);
            if (raw.length === 6) applyHex(raw);
          }}
          style={{ ...inputStyle, flex: 1, letterSpacing: "0.12em" }}
        />
      </div>

      {/* RGB inputs */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["R", "G", "B"] as const).map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <span style={labelStyle}>{label}</span>
            <input
              type="number"
              min={0}
              max={255}
              value={[r, g, b][i]}
              onChange={(e) => applyRgb(i as 0 | 1 | 2, parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* HSV inputs */}
      <div style={{ display: "flex", gap: 4 }}>
        {(["H", "S", "V"] as const).map((label, i) => {
          const vals = [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
          return (
            <div key={label} style={{ flex: 1 }}>
              <span style={labelStyle}>{label}{i === 0 ? "°" : "%"}</span>
              <input
                type="number"
                min={0}
                max={i === 0 ? 360 : 100}
                value={vals[i]}
                onChange={(e) => applyHsvInput(i as 0 | 1 | 2, parseInt(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
