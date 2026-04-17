"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import DebugPane from "./DebugPane";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import SettingsPane from "./SettingsPane";
import { injectImportMap, loadCanvasRuntimeModule, waitForBridge } from "./runtime";
import { buildTransformMatrixLatex, clamp, getMatrixTitle } from "./workspaceMath";
import {
  EMPTY_COLOR_INPUTS,
  EMPTY_STATE,
  UI_THEME,
  type Canvas3DMode,
  type Canvas3DState,
  type Canvas3DStatus,
  type CanvasObjectKind,
  type ColorInputState,
  type ColorMode,
} from "./types";
import "katex/dist/katex.min.css";
import { KEY_BINDINGS } from "../../../public/canvas-3d/utils/constants";

export default function Canvas3DWorkspace() {
  const themeVars: CSSProperties = {
    "--ui-text": UI_THEME.text,
    "--ui-text-muted": UI_THEME.textMuted,
    "--ui-accent": UI_THEME.accent,
    "--ui-accent-soft": UI_THEME.accentSoft,
    "--ui-accent-active-bg": UI_THEME.accentActiveBg,
    "--ui-main-bg": UI_THEME.mainBg,
    "--ui-field-bg": UI_THEME.fieldBg,
    "--ui-collapse-bg": UI_THEME.collapseHeaderBg,
    "--ui-button-pressed": UI_THEME.buttonPressed,
  } as CSSProperties;

  const [status, setStatus] = useState<Canvas3DStatus>("loading");
  const [engineState, setEngineState] = useState<Canvas3DState>(EMPTY_STATE);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(true);
  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isMaterialOpen, setIsMaterialOpen] = useState(true);

  const [colorMode, setColorMode] = useState<ColorMode>("rgb");
  const [colorInputs, setColorInputs] = useState<ColorInputState>(EMPTY_COLOR_INPUTS);

  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const scaleMatrixRef = useRef<HTMLDivElement | null>(null);
  const selected = engineState.selected;
  const shouldShowTransformMatrix = ["translate", "rotate", "scale", "skew"].includes(engineState.mode);
  const matrixTitle = getMatrixTitle(engineState.mode);

  useEffect(() => {
    let cancelled = false;
    const handleStateChange = (event: CustomEvent<Canvas3DState>) => {
      setEngineState(event.detail);
    };

    window.addEventListener("canvas3d:state", handleStateChange as EventListener);

    const init = async () => {
      injectImportMap();
      await loadCanvasRuntimeModule();

      const isBridgeReady = await waitForBridge();
      if (!isBridgeReady || cancelled) {
        if (!cancelled) setStatus("error");
        return;
      }

      window.Canvas3DBridge?.mount();
      const initialState = window.Canvas3DBridge?.getState();
      if (initialState) setEngineState(initialState);
      setStatus("ready");
    };

    init().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      window.removeEventListener("canvas3d:state", handleStateChange as EventListener);
      window.Canvas3DBridge?.unmount();
    };
  }, []);

  useEffect(() => {
    const selected = engineState.selected;
    if (!selected) {
      setColorInputs(EMPTY_COLOR_INPUTS);
      return;
    }

    setColorInputs({
      hex: selected.material.hex,
      alpha: selected.material.alpha,
      r: selected.material.rgb.r,
      g: selected.material.rgb.g,
      b: selected.material.rgb.b,
      h: selected.material.hsv.h,
      s: selected.material.hsv.s,
      v: selected.material.hsv.v,
    });
  }, [engineState.selected?.uuid, engineState.selected?.material.hex, engineState.selected?.material.alpha]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        settingsRef.current &&
        !settingsRef.current.contains(target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(target)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        infoRef.current &&
        !infoRef.current.contains(target) &&
        infoButtonRef.current &&
        !infoButtonRef.current.contains(target)
      ) {
        setIsInfoOpen(false);
      }
    };

    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);


  useEffect(() => {
    if (!shouldShowTransformMatrix) {
      if (scaleMatrixRef.current) scaleMatrixRef.current.innerHTML = "";
      return;
    }

    const el = scaleMatrixRef.current;
    if (!el) return;
    const latex = buildTransformMatrixLatex(engineState.mode, selected);

    try {
      el.innerHTML = katex.renderToString(latex, { throwOnError: false });
    } catch (e) {
      // fail silently :)
    }
  }, [
    engineState.mode,
    shouldShowTransformMatrix,
    selected,
  ]);

  const addObject = (kind: CanvasObjectKind) => {
    window.Canvas3DBridge?.addObject(kind);
  };

  const setMode = (mode: Canvas3DMode) => {
    window.Canvas3DBridge?.setMode(mode);
  };

  const updateTransform = (field: string, value: number) => {
    if (!Number.isFinite(value)) return;
    window.Canvas3DBridge?.updateSelectedTransform(field, value);
  };

  const resetTransformGroup = (targets: string[]) => {
    targets.forEach((target) => window.Canvas3DBridge?.resetTransformField(target));
  };

  const updateHexColor = (rawHex: string) => {
    let hex = rawHex.trim();
    if (!hex.startsWith("#")) hex = `#${hex}`;

    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setColorInputs((prev) => ({ ...prev, hex }));
      window.Canvas3DBridge?.setSelectedColorHex(hex);
    }
  };

  const updateRgbColor = (channel: "r" | "g" | "b", rawValue: number) => {
    const parsed = clamp(rawValue, 0, 255);
    if (!Number.isFinite(parsed)) return;

    const next = {
      ...colorInputs,
      [channel]: Math.round(parsed),
    } as ColorInputState;

    setColorInputs(next);

    const hex = `#${[next.r, next.g, next.b]
      .map((value) => clamp(value, 0, 255).toString(16).padStart(2, "0"))
      .join("")}`;

    window.Canvas3DBridge?.setSelectedColorHex(hex);
  };

  const updateHsvColor = (channel: "h" | "s" | "v", rawValue: number) => {
    const parsed = rawValue;
    if (!Number.isFinite(parsed)) return;

    const next = {
      ...colorInputs,
      h: channel === "h" ? clamp(Math.round(parsed), 0, 360) : colorInputs.h,
      s: channel === "s" ? clamp(Math.round(parsed), 0, 100) : colorInputs.s,
      v: channel === "v" ? clamp(Math.round(parsed), 0, 100) : colorInputs.v,
    };

    setColorInputs(next);
    window.Canvas3DBridge?.setSelectedColorHSV(next.h, next.s, next.v);
  };

  const setColorFromPicker = (hex: string) => {
    setColorInputs((prev) => ({ ...prev, hex }));
    window.Canvas3DBridge?.setSelectedColorHex(hex);
  };

  const setHexDraft = (hex: string) => {
    setColorInputs((prev) => ({ ...prev, hex }));
  };

  const setAlpha = (alpha: number) => {
    const normalized = clamp(alpha, 0, 100);
    setColorInputs((prev) => ({ ...prev, alpha: normalized }));
    window.Canvas3DBridge?.setSelectedAlpha(normalized);
  };

  const topbarButtonClass = "inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-[0.1rem] bg-black/12 text-[#f3f3f3] transition-all duration-100 hover:cursor-pointer hover:border-[rgb(200,200,200)] hover:bg-[rgba(229,231,235,0.24)] hover:text-[#ffffff] select-none";
  const topbarButtonActiveClass = "!bg-[rgba(35,50,70,0.8)] !text-white";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-(--ui-main-bg) font-mono text-(--ui-text)" style={themeVars}>
      <div className="app-noise pointer-events-none absolute inset-0 z-0" />

      {status === "loading" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#2a2d3e] border-t-(--ui-accent)" />
            <p className="mt-3 text-sm text-(--ui-text)">Carregando Canvas...</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/90 p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold text-[#f7768e]">Falha ao iniciar o Canvas</h2>
            <p className="mt-2 text-sm text-(--ui-text)">Recarregue a página para tentar novamente</p>
          </div>
        </div>
      )}

      <div id="app-layout" className="fixed inset-0 z-10 flex">
        <LeftSidebar
          engineState={engineState}
          matrixTitle={matrixTitle}
          onAddObject={addObject}
          onDeleteObject={(uuid) => window.Canvas3DBridge?.deleteObject(uuid)}
          onFocusObject={(uuid) => window.Canvas3DBridge?.focusObject(uuid)}
          onSelectObject={(uuid) => window.Canvas3DBridge?.selectObject(uuid)}
          onSetMode={setMode}
          scaleMatrixRef={scaleMatrixRef}
          shouldShowTransformMatrix={shouldShowTransformMatrix}
        />

        <main id="center-area" className="relative flex-1 bg-(--ui-main-bg)">
          <div id="canvas-container" className="absolute inset-0" />
          <div id="canvas-actions" className="absolute right-2 top-2 z-50 flex items-center gap-2 backdrop-blur-[2px]">
            <button className={topbarButtonClass} onContextMenu={(e) => e.preventDefault()} onClick={() => window.Canvas3DBridge?.resetCamera()} title="Reset Camera" type="button">
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
              className={`${topbarButtonClass} w-auto min-w-16 px-2 text-[0.7rem] ${
                engineState.isOrthographic ? topbarButtonActiveClass : ""
              }`}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => window.Canvas3DBridge?.toggleCameraType()}
              title="Ortografica"
              type="button">
              Ortografica
            </button>

            <button
              className={`${topbarButtonClass} w-auto min-w-16 px-2 text-[0.7rem] ${
                engineState.isCullingViewEnabled ? topbarButtonActiveClass : ""
              }`}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => window.Canvas3DBridge?.toggleCullingView()}
              title="Culling View"
              type="button">
              Culling View
            </button>

            <button
              className={`${topbarButtonClass} ${isInfoOpen ? topbarButtonActiveClass : ""}`}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                setIsInfoOpen((prev) => !prev);
                setIsSettingsOpen(false);
              }}
              ref={infoButtonRef}
              title="Controles"
              type="button">
              i
            </button>

            <button
              className={`${topbarButtonClass} ${isSettingsOpen ? topbarButtonActiveClass : ""}`}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                setIsSettingsOpen((prev) => !prev);
                setIsInfoOpen(false);
              }}
              ref={settingsButtonRef}
              title="Configuracoes"
              type="button">
              ⚙
            </button>
          </div>

          <SettingsPane
            isOpen={isSettingsOpen}
            onAxesVisibleChange={(visible) => window.Canvas3DBridge?.setAxesVisible(visible)}
            onBackgroundColorChange={(hex) => window.Canvas3DBridge?.setBackgroundColor(hex)}
            onFovChange={(value) => window.Canvas3DBridge?.setFov(value)}
            onFarClipChange={(value) => window.Canvas3DBridge?.setFarClip(value)}
            onGridColorChange={(hex) => window.Canvas3DBridge?.setGridColor(hex)}
            onGridVisibleChange={(visible) => window.Canvas3DBridge?.setGridVisible(visible)}
            onNearClipChange={(value) => window.Canvas3DBridge?.setNearClip(value)}
            onRenderMethodChange={(method) => window.Canvas3DBridge?.setRenderMethod(method)}
            onSnapEnabledChange={(enabled) => window.Canvas3DBridge?.setSnapEnabled(enabled)}
            onSnapSizeChange={(size) => window.Canvas3DBridge?.setSnapSize(size)}
            onWireframeVisibleChange={(visible) => window.Canvas3DBridge?.setWireframeVisible(visible)}
            panelRef={settingsRef}
            settings={engineState.settings}
          />
          <DebugPane isOpen={isDebugOpen} engineState={engineState} className="absolute left-2 top-2 z-60 w-72 rounded-[0.1rem]" />
          <div
            className={`absolute right-3 top-[2.65rem] z-60 w-76 rounded-[0.1rem] bg-[rgba(26,27,38,0.85)] p-3 text-xs leading-[1.45] backdrop-blur-[5px] text-(--ui-text) ${
              isInfoOpen ? "" : "hidden"
            }`}
            ref={infoRef}>
            <strong>Controles:</strong>
            <div>- Rodar camera: botao do meio ou botao direito</div>
            <div>- Pan: Shift + botao do meio</div>
            <div>- Zoom: scroll do mouse</div>
            <div>- Focar objeto: {KEY_BINDINGS.FOCUS_SELECTED.toUpperCase()}</div>
            <strong className="mt-2">Keybinds</strong>
            <div>{`${KEY_BINDINGS.TRANSLATE_MODE.toUpperCase()}: Translate | ${KEY_BINDINGS.ROTATE_MODE.toUpperCase()}: Rotate | ${KEY_BINDINGS.SCALE_MODE.toUpperCase()}: Scale | ${KEY_BINDINGS.SKEW_MODE.toUpperCase()}: Skew | ${KEY_BINDINGS.TOGGLE_CAMERA.toUpperCase()}: Toggle Camera | ${KEY_BINDINGS.DELETE_SELECTED.toUpperCase()}: Delete`}</div>
          </div>
        </main>

        <RightSidebar
          colorInputs={colorInputs}
          colorMode={colorMode}
          isMaterialOpen={isMaterialOpen}
          isTransformOpen={isTransformOpen}
          onAlphaChange={setAlpha}
          onApplyHex={updateHexColor}
          onResetTransformGroup={resetTransformGroup}
          onSetColorFromPicker={setColorFromPicker}
          onSetColorMode={setColorMode}
          onSetHexDraft={setHexDraft}
          onToggleMaterial={() => setIsMaterialOpen((prev) => !prev)}
          onToggleTransform={() => setIsTransformOpen((prev) => !prev)}
          onUpdateHsvColor={updateHsvColor}
          onUpdateRgbColor={updateRgbColor}
          onUpdateTransform={updateTransform}
          selected={selected}
        />
      </div>
    </div>
  );
}



