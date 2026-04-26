"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import katex from "katex";
import DebugPane from "./DebugPane";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import SettingsPane from "./SettingsPane";
import TopBar from "./TopBar";
import { injectImportMap, loadCanvasRuntimeModule, waitForBridge } from "./runtime";
import { buildTransformMatrixLatex, clamp, getMatrixTitle } from "./workspaceMath";
import {
  EMPTY_COLOR_INPUTS,
  EMPTY_STATE,
  UI_THEME,
  type CameraProjection,
  type Canvas3DMode,
  type Canvas3DState,
  type Canvas3DStatus,
  type CanvasObjectKind,
  type ColorInputState,
  type ColorMode,
  type ProjectionCameraSettings,
} from "./types";
import "katex/dist/katex.min.css";
import { CAMERA_PROJECTION_DEFAULTS, KEY_BINDINGS } from "../../../public/canvas-3d/utils/constants";

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
  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isMaterialOpen, setIsMaterialOpen] = useState(true);
  const [cameraProjection, setCameraProjection] = useState<CameraProjection>("perspective");
  const [projectionSettings, setProjectionSettings] = useState<ProjectionCameraSettings>({
    perspective: {
      fov: CAMERA_PROJECTION_DEFAULTS.perspective.fov,
      nearClip: CAMERA_PROJECTION_DEFAULTS.perspective.near,
      farClip: CAMERA_PROJECTION_DEFAULTS.perspective.far,
    },
    ortographic: {
      nearClip: CAMERA_PROJECTION_DEFAULTS.orthographic.near,
      farClip: CAMERA_PROJECTION_DEFAULTS.orthographic.far,
      zoom: CAMERA_PROJECTION_DEFAULTS.orthographic.zoom,
    },
    panini: {
      fov: CAMERA_PROJECTION_DEFAULTS.panini.fov,
      nearClip: CAMERA_PROJECTION_DEFAULTS.panini.near,
      farClip: CAMERA_PROJECTION_DEFAULTS.panini.far,
    },
  });

  const [colorMode, setColorMode] = useState<ColorMode>("rgb");
  const [colorInputs, setColorInputs] = useState<ColorInputState>(EMPTY_COLOR_INPUTS);

  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const scaleMatrixRef = useRef<HTMLDivElement | null>(null);
  const projectionSettingsRef = useRef<ProjectionCameraSettings>(projectionSettings);
  const selected = engineState.selected;
  const shouldShowTransformMatrix = ["translate", "rotate", "scale", "skew"].includes(engineState.mode);
  const matrixTitle = getMatrixTitle(engineState.mode);

  useEffect(() => {
    projectionSettingsRef.current = projectionSettings;
  }, [projectionSettings]);

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

      // if (
      //   settingsRef.current &&
      //   !settingsRef.current.contains(target) &&
      //   settingsButtonRef.current &&
      //   !settingsButtonRef.current.contains(target)
      // ) {
      //   setIsSettingsOpen(false);
      // }

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
    if (engineState.isOrthographic) {
      setCameraProjection("ortographic");
      return;
    }

    setCameraProjection((prev) => (prev === "ortographic" ? "perspective" : prev));
  }, [engineState.isOrthographic]);

  useEffect(() => {
    const settings = engineState.settings;

    setProjectionSettings((prev) => {
      const next: ProjectionCameraSettings = {
        perspective: {
          fov: Number.isFinite(settings.perspectiveFov) ? settings.perspectiveFov : prev.perspective.fov,
          nearClip: Number.isFinite(settings.perspectiveNearClip) ? settings.perspectiveNearClip : prev.perspective.nearClip,
          farClip: Number.isFinite(settings.perspectiveFarClip) ? settings.perspectiveFarClip : prev.perspective.farClip,
        },
        ortographic: {
          nearClip: Number.isFinite(settings.ortographicNearClip) ? settings.ortographicNearClip : prev.ortographic.nearClip,
          farClip: Number.isFinite(settings.ortographicFarClip) ? settings.ortographicFarClip : prev.ortographic.farClip,
          zoom: Number.isFinite(settings.orthoZoom) ? settings.orthoZoom : prev.ortographic.zoom,
        },
        panini: {
          fov: Number.isFinite(settings.paniniFov) ? settings.paniniFov : prev.panini.fov,
          nearClip: Number.isFinite(settings.paniniNearClip) ? settings.paniniNearClip : prev.panini.nearClip,
          farClip: Number.isFinite(settings.paniniFarClip) ? settings.paniniFarClip : prev.panini.farClip,
        },
      };

      const unchanged =
        prev.perspective.fov === next.perspective.fov &&
        prev.perspective.nearClip === next.perspective.nearClip &&
        prev.perspective.farClip === next.perspective.farClip &&
        prev.ortographic.nearClip === next.ortographic.nearClip &&
        prev.ortographic.farClip === next.ortographic.farClip &&
        prev.ortographic.zoom === next.ortographic.zoom &&
        prev.panini.fov === next.panini.fov &&
        prev.panini.nearClip === next.panini.nearClip &&
        prev.panini.farClip === next.panini.farClip;

      if (unchanged) return prev;

      projectionSettingsRef.current = next;
      return next;
    });
  }, [
    engineState.settings.orthoZoom,
    engineState.settings.ortographicFarClip,
    engineState.settings.ortographicNearClip,
    engineState.settings.paniniFarClip,
    engineState.settings.paniniFov,
    engineState.settings.paniniNearClip,
    engineState.settings.perspectiveFarClip,
    engineState.settings.perspectiveFov,
    engineState.settings.perspectiveNearClip,
  ]);


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

  const handleNearClipChange = (projection: CameraProjection, value: number) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;

    setProjectionSettings((prev) => {
      const updated: ProjectionCameraSettings = {
        ...prev,
        [projection]: {
          ...prev[projection],
          nearClip: next,
        },
      };
      projectionSettingsRef.current = updated;
      return updated;
    });

    window.Canvas3DBridge?.setNearClip(next, projection);
  };

  const handleFarClipChange = (projection: CameraProjection, value: number) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;

    setProjectionSettings((prev) => {
      const updated: ProjectionCameraSettings = {
        ...prev,
        [projection]: {
          ...prev[projection],
          farClip: next,
        },
      };
      projectionSettingsRef.current = updated;
      return updated;
    });

    window.Canvas3DBridge?.setFarClip(next, projection);
  };

  const handleFovChange = (projection: CameraProjection, value: number) => {
    if (projection === "ortographic") return;

    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0 || next >= 180) return;

    setProjectionSettings((prev) => {
      const key: "perspective" | "panini" = projection;
      const updated: ProjectionCameraSettings = {
        ...prev,
        [key]: {
          ...prev[key],
          fov: next,
        },
      };
      projectionSettingsRef.current = updated;
      return updated;
    });

    window.Canvas3DBridge?.setFov(next, projection);
  };

  const handleOrthoZoomChange = (value: number) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;

    setProjectionSettings((prev) => {
      const updated: ProjectionCameraSettings = {
        ...prev,
        ortographic: {
          ...prev.ortographic,
          zoom: next,
        },
      };
      projectionSettingsRef.current = updated;
      return updated;
    });

    window.Canvas3DBridge?.setOrthoZoom(next);
  };

  const handleCameraProjectionChange = (projection: CameraProjection) => {
    setCameraProjection(projection);
    window.Canvas3DBridge?.setCameraProjection(projection);
  };

  const handleToggleInfo = () => {
    setIsInfoOpen((prev) => !prev);
    setIsSettingsOpen(false);
  };

  const handleToggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
    setIsInfoOpen(false);
  };

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
          <TopBar
            infoButtonRef={infoButtonRef}
            isCullingViewEnabled={engineState.isCullingViewEnabled}
            isInfoOpen={isInfoOpen}
            isSettingsOpen={isSettingsOpen}
            onResetCamera={() => window.Canvas3DBridge?.resetCamera()}
            onToggleCullingView={() => window.Canvas3DBridge?.toggleCullingView()}
            onToggleInfo={handleToggleInfo}
            onToggleSettings={handleToggleSettings}
            settingsButtonRef={settingsButtonRef}
          />

          <SettingsPane
            cameraSettings={projectionSettings}
            cameraProjection={cameraProjection}
            isOpen={isSettingsOpen}
            onAxesVisibleChange={(visible) => window.Canvas3DBridge?.setAxesVisible(visible)}
            onBackgroundColorChange={(hex) => window.Canvas3DBridge?.setBackgroundColor(hex)}
            onCameraProjectionChange={handleCameraProjectionChange}
            onFovChange={handleFovChange}
            onFarClipChange={handleFarClipChange}
            onGridColorChange={(hex) => window.Canvas3DBridge?.setGridColor(hex)}
            onGridVisibleChange={(visible) => window.Canvas3DBridge?.setGridVisible(visible)}
            onNearClipChange={handleNearClipChange}
            onOrthoZoomChange={handleOrthoZoomChange}
            onRenderMethodChange={(method) => window.Canvas3DBridge?.setRenderMethod(method)}
            onSnapEnabledChange={(enabled) => window.Canvas3DBridge?.setSnapEnabled(enabled)}
            onSnapSizeChange={(size) => window.Canvas3DBridge?.setSnapSize(size)}
            onWireframeVisibleChange={(visible) => window.Canvas3DBridge?.setWireframeVisible(visible)}
            panelRef={settingsRef}
            settings={engineState.settings}
          />
          <DebugPane engineState={engineState} className="absolute left-2 top-2 z-60 w-72 rounded-[0.1rem]" />
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



