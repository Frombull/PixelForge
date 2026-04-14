"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KEY_BINDINGS } from "../../../public/canvas-3d/utils/constants";
import { type Canvas3DMode, type Canvas3DState, type CanvasObjectKind } from "./types";

type LeftSidebarProps = {
  engineState: Canvas3DState;
  shouldShowTransformMatrix: boolean;
  matrixTitle: string;
  scaleMatrixRef: React.RefObject<HTMLDivElement | null>;
  onAddObject: (kind: CanvasObjectKind) => void;
  onSetMode: (mode: Canvas3DMode) => void;
  onSelectObject: (uuid: string) => void;
  onFocusObject: (uuid: string) => void;
  onDeleteObject: (uuid: string) => void;
};

export default function LeftSidebar({
  engineState,
  shouldShowTransformMatrix,
  matrixTitle,
  scaleMatrixRef,
  onAddObject,
  onSetMode,
  onSelectObject,
  onFocusObject,
  onDeleteObject,
}: LeftSidebarProps) {
  const panelSectionClass = "border-b border-[#2a2d3e]";
  const panelHeaderClass = "mb-[0.55rem] p-0 text-xs uppercase tracking-[0.08em] text-(--ui-accent)";
  const panelActionButtonClass = "bg-[var(--ui-field-bg)] w-full rounded-[0.1rem] border border-[#2a2d3e] px-[0.6rem] py-[0.45rem] text-xs text-[var(--ui-text)] transition-all duration-100 hover:bg-[var(--ui-accent-active-bg)] hover:text-[var(--ui-accent)] active:bg-[var(--ui-button-pressed)] cursor-pointer";
  const panelToolButtonClass = "bg-[var(--ui-field-bg)] flex items-center justify-between rounded-[0.1rem] border border-[#2a2d3e] px-[0.5rem] py-[0.45rem] text-[0.73rem] text-[var(--ui-text)] transition-all duration-100 hover:border-[var(--ui-accent)] hover:bg-[var(--ui-accent-active-bg)] active:bg-[var(--ui-button-pressed)] cursor-pointer";
  const panelButtonActiveClass = "!bg-(--ui-accent-active-bg)";

  return (
    <aside id="sidebar-left" className="w-75 shrink-0 border-r border-[#2a2d3e] p-2 max-md:hidden flex flex-col">
      <div className={panelSectionClass} id="hierarchy-section">
        <div className={`${panelHeaderClass} relative flex items-center justify-center`}>
          <Link
            aria-label="Voltar para home"
            className="absolute left-0 inline-flex h-6 w-6 items-center justify-center text-(--ui-accent) hover:scale-120"
            href="/">
            <ArrowLeft size={14} strokeWidth={2} />
          </Link>
          <span className="text-center">Hierarquia</span>
        </div>

        <div className="h-68 overflow-y-auto p-0 pr-1" id="hierarchy-list" style={{ scrollbarGutter: "stable" }}>
          {engineState.objects.length === 0 && (
            <div className="p-1 text-xs text-(--ui-text-muted) text-center">Nenhum objeto na cena</div>
          )}

          {engineState.objects.map((obj) => (
            <div
              className={`mb-[0.1rem] flex cursor-pointer items-center gap-[0.4rem] px-[0.2rem] py-[0.3rem] text-[0.73rem] text-(--ui-text) transition-colors hover:bg-(--ui-accent-soft) ${
                engineState.selectedUuid === obj.uuid || engineState.selected?.uuid === obj.uuid ? "bg-(--ui-accent-soft)!" : ""
              }`}
              key={obj.uuid}
              onClick={() => onSelectObject(obj.uuid)}
              onDoubleClick={() => onFocusObject(obj.uuid)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectObject(obj.uuid);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <svg className="h-[0.9rem] w-[0.9rem] text-(--ui-accent)" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <span className="flex-1">{obj.name}</span>
              <button
                className="h-4 w-4 border-none bg-transparent text-[0.8rem] leading-[0.8rem] text-(--ui-text) transition-colors hover:text-[#f7768e]"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteObject(obj.uuid);
                }}
                title="Delete"
                type="button"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`${panelSectionClass} mt-3`} id="add-section">
        <div className={panelHeaderClass}>
          <span>Adicionar Objeto</span>
        </div>
        <div className="p-0">
          <div className="grid grid-cols-2 gap-2">
            <button className={panelActionButtonClass} onClick={() => onAddObject("cube")} type="button">Cubo</button>
            <button className={panelActionButtonClass} onClick={() => onAddObject("cylinder")} type="button">Cilindro</button>
            <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Esfera</button>
            <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Cone</button>
            <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Torus</button>
            <button
              className={`${panelActionButtonClass} border-[#f7768e] text-[#f7768e]`}
              onClick={() => onAddObject("subtractCube")}
              type="button"
            >
              Sub. Cube
            </button>
          </div>
          <div className="mt-[0.65rem]">
            <div className="mb-1 text-[0.68rem] uppercase text-(--ui-text-muted)">Demos</div>
            <button className={panelActionButtonClass} onClick={() => onAddObject("zFighting")} type="button">Z-Fighting</button>
            <button className={`${panelActionButtonClass} mt-2 opacity-45`} disabled type="button">Skew Demo</button>
          </div>
        </div>
      </div>

      <div className={`${panelSectionClass} mt-3`} id="tools-section">
        <div className={panelHeaderClass}>
          <span>Ferramentas</span>
        </div>

        <div className="p-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`${panelToolButtonClass} ${engineState.mode === "translate" ? panelButtonActiveClass : ""}`}
              onClick={() => onSetMode("translate")}
              type="button"
            >
              <span>Translate</span>
              <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-(--ui-accent)">{KEY_BINDINGS.TRANSLATE_MODE.toUpperCase()}</kbd>
            </button>
            <button
              className={`${panelToolButtonClass} ${engineState.mode === "rotate" ? panelButtonActiveClass : ""}`}
              onClick={() => onSetMode("rotate")}
              type="button"
            >
              <span>Rotate</span>
              <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-(--ui-accent)">{KEY_BINDINGS.ROTATE_MODE.toUpperCase()}</kbd>
            </button>
            <button
              className={`${panelToolButtonClass} ${engineState.mode === "scale" ? panelButtonActiveClass : ""}`}
              onClick={() => onSetMode("scale")}
              type="button"
            >
              <span>Scale</span>
              <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-(--ui-accent)">{KEY_BINDINGS.SCALE_MODE.toUpperCase()}</kbd>
            </button>
            <button
              className={`${panelToolButtonClass} ${engineState.mode === "skew" ? panelButtonActiveClass : ""}`}
              onClick={() => onSetMode("skew")}
              type="button"
            >
              <span>Skew</span>
              <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-(--ui-accent)">{KEY_BINDINGS.SKEW_MODE.toUpperCase()}</kbd>
            </button>
          </div>
        </div>
      </div>

      {shouldShowTransformMatrix && (
        <div className={`${panelSectionClass} mt-auto`} id="scale-matrix-section">
          <div className={panelHeaderClass}>
            <span>{matrixTitle}</span>
          </div>

          <div className="p-1 mb-3">
            <div className="text-xs">
              <div ref={scaleMatrixRef} className="katex-matrix text-[1rem] text-center" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
