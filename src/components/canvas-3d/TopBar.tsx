"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import type { TopBarProps } from "./types";

const topbarButtonClass =
  "inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-[0.1rem] bg-black/12 text-[#f3f3f3] transition-all duration-100 hover:cursor-pointer hover:border-[rgb(200,200,200)] hover:bg-[rgba(229,231,235,0.24)] hover:text-[#ffffff] select-none";
const topbarButtonActiveClass = "!bg-[rgba(35,50,70,0.8)] !text-white";

export default function TopBar({
  isCullingViewEnabled,
  isAliasingStressEnabled,
  isInfoOpen,
  isSettingsOpen,
  infoButtonRef,
  settingsButtonRef,
  onResetCamera,
  onSaveScene,
  onLoadScene,
  onToggleCullingView,
  onToggleAliasingStress,
  onToggleInfo,
  onToggleSettings,
}: TopBarProps) {
  const preventContextMenu = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <div id="top-bar" className="absolute right-2 top-2 z-50 flex items-center gap-2 backdrop-blur-[2px]">
      <button className={topbarButtonClass} onContextMenu={preventContextMenu} onClick={onResetCamera} title="Reset Camera" type="button">
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M6.5 10v9.5h11V10" />
        </svg>
      </button>

      <button
        aria-label="Salvar cena"
        className={`${topbarButtonClass} w-auto gap-1 px-2 text-[0.68rem]`}
        onContextMenu={preventContextMenu}
        onClick={onSaveScene}
        title="Salvar cena em arquivo JSON"
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v6h8V4M8 20v-6h8v6" />
        </svg>
        <span>Salvar</span>
      </button>

      <button
        aria-label="Carregar cena"
        className={`${topbarButtonClass} w-auto gap-1 px-2 text-[0.68rem]`}
        onContextMenu={preventContextMenu}
        onClick={onLoadScene}
        title="Carregar cena de arquivo JSON"
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M4 5h6l2 2h8v12H4z" />
          <path d="M12 10v6M9.5 12.5 12 10l2.5 2.5" />
        </svg>
        <span>Abrir</span>
      </button>

      <button
        className={`${topbarButtonClass} w-auto min-w-16 px-2 text-[0.7rem] ${isCullingViewEnabled ? topbarButtonActiveClass : ""}`}
        onContextMenu={preventContextMenu}
        onClick={onToggleCullingView}
        title="Culling View"
        type="button"
      >
        Culling View
      </button>

      <button
        aria-pressed={isAliasingStressEnabled}
        className={`${topbarButtonClass} w-auto min-w-20 px-2 text-[0.7rem] ${isAliasingStressEnabled ? topbarButtonActiveClass : ""}`}
        onContextMenu={preventContextMenu}
        onClick={onToggleAliasingStress}
        title="Ativar cenário extremo de aliasing"
        type="button"
      >
        Aliasing
      </button>

      <button
        className={`${topbarButtonClass} ${isInfoOpen ? topbarButtonActiveClass : ""}`}
        onContextMenu={preventContextMenu}
        onClick={onToggleInfo}
        ref={infoButtonRef}
        title="Controles"
        type="button"
      >
        i
      </button>

      <button
        className={`${topbarButtonClass} ${isSettingsOpen ? topbarButtonActiveClass : ""}`}
        onContextMenu={preventContextMenu}
        onClick={onToggleSettings}
        ref={settingsButtonRef}
        title="Configurações"
        type="button"
      >
        ⚙
      </button>
    </div>
  );
}
