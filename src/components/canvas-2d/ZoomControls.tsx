"use client";

import React from "react";
import { COLORS } from "./lib/constants";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        zIndex: 10,
      }}
    >
      <ZoomBtn title="Zoom in (+)" onClick={onZoomIn}>
        {/* Plus icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </ZoomBtn>

      <ZoomBtn title="Zoom out (−)" onClick={onZoomOut}>
        {/* Minus icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </ZoomBtn>

      <ZoomBtn title="Reset view" onClick={onReset}>
        {/* Home / reset icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polyline points="1,6 6,1 11,6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" fill="none" />
          <rect x="3" y="6" width="6" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </ZoomBtn>

      {/* Zoom level label */}
      <div
        style={{
          marginTop: 4,
          textAlign: "center",
          fontSize: 9,
          color: COLORS.textSubtle,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.04em",
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          padding: "2px 0",
          width: 28,
          boxSizing: "border-box",
        }}
      >
        {(zoom * 50).toFixed(0)}%
      </div>
    </div>
  );
}

function ZoomBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        background: hovered ? COLORS.accentDim : COLORS.panel,
        border: `1px solid ${hovered ? COLORS.borderAct : COLORS.border}`,
        color: hovered ? COLORS.accent : COLORS.textMid,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.1s",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
