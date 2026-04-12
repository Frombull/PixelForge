"use client";

import { useEffect, useRef, useState } from "react";

type Canvas3DMode = "translate" | "scale" | "rotate" | "skew";

type Canvas3DObjectState = {
  uuid: string;
  name: string;
  type: string;
};

type NumericVec3 = {
  x: number;
  y: number;
  z: number;
};

type SkewState = {
  xy: number;
  xz: number;
  yx: number;
  yz: number;
  zx: number;
  zy: number;
};

type MaterialState = {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  alpha: number;
};

type SelectedObjectState = {
  uuid: string;
  name: string;
  position: NumericVec3;
  scale: NumericVec3;
  rotation: NumericVec3;
  skew: SkewState;
  material: MaterialState;
};

type SettingsState = {
  gridVisible: boolean;
  snapToGrid: boolean;
  snapSize: number;
  backgroundColor: string;
  gridColor: string;
  nearClip: number;
  farClip: number;
};

type Canvas3DState = {
  mode: Canvas3DMode;
  isOrthographic: boolean;
  isCullingViewEnabled: boolean;
  selectedUuid: string | null;
  objects: Canvas3DObjectState[];
  selected: SelectedObjectState | null;
  settings: SettingsState;
};

const EMPTY_STATE: Canvas3DState = {
  mode: "translate",
  isOrthographic: false,
  isCullingViewEnabled: false,
  selectedUuid: null,
  objects: [],
  selected: null,
  settings: {
    gridVisible: true,
    snapToGrid: false,
    snapSize: 0.5,
    backgroundColor: "#ffffff",
    gridColor: "#bbbbbb",
    nearClip: 0.01,
    farClip: 100,
  },
};

type ColorMode = "rgb" | "hsv";

type ColorInputState = {
  hex: string;
  alpha: number;
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  v: number;
};

const EMPTY_COLOR_INPUTS: ColorInputState = {
  hex: "#ffffff",
  alpha: 100,
  r: 255,
  g: 255,
  b: 255,
  h: 0,
  s: 0,
  v: 100,
};

declare global {
  interface WindowEventMap {
    "canvas3d:state": CustomEvent<Canvas3DState>;
  }

  interface Window {
    Canvas3DBridge?: {
      mount: () => unknown;
      unmount: () => void;
      getState: () => Canvas3DState | null;

      addObject: (kind: "cube" | "cylinder" | "subtractCube" | "zFighting") => void;
      setMode: (mode: Canvas3DMode) => void;

      selectObject: (uuid: string) => void;
      focusObject: (uuid: string) => void;
      deleteSelected: () => void;
      deleteObject: (uuid: string) => void;

      resetCamera: () => void;
      toggleCameraType: () => boolean | undefined;
      toggleCullingView: () => boolean | undefined;

      setGridVisible: (visible: boolean) => void;
      setSnapEnabled: (enabled: boolean) => void;
      setSnapSize: (size: number) => void;
      setBackgroundColor: (hex: string) => void;
      setGridColor: (hex: string) => void;
      setNearClip: (value: number) => void;
      setFarClip: (value: number) => void;
      resetSetting: (target: "snap-size" | "near-clip" | "far-clip") => void;

      updateSelectedTransform: (field: string, value: number) => void;
      resetTransformField: (target: string) => void;
      setSelectedColorHex: (hex: string) => void;
      setSelectedColorHSV: (h: number, s: number, v: number) => void;
      setSelectedAlpha: (alphaPercent: number) => void;
    };
  }
}

const IMPORT_MAP = {
  imports: {
    three: "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.0/build/index.module.js",
    "three-bvh-csg": "https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.16/build/index.module.js",
    "three-viewport-gizmo": "https://cdn.jsdelivr.net/npm/three-viewport-gizmo@2.2.0/dist/three-viewport-gizmo.js",
  },
};

function ensureImportMap() {
  if (document.getElementById("canvas3d-importmap")) return;

  const script = document.createElement("script");
  script.id = "canvas3d-importmap";
  script.type = "importmap";
  script.textContent = JSON.stringify(IMPORT_MAP);
  document.head.appendChild(script);
}

function ensureScript(id: string, src: string, type = "text/javascript") {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.type = type;
    script.async = true;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );

    script.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)), {
      once: true,
    });

    document.body.appendChild(script);
  });
}

async function waitForBridge(retries = 50, delayMs = 50) {
  for (let i = 0; i < retries; i += 1) {
    if (window.Canvas3DBridge) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberValue(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(digits);
}

export default function Canvas3DWorkspace() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [engineState, setEngineState] = useState<Canvas3DState>(EMPTY_STATE);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isTransformOpen, setIsTransformOpen] = useState(true);
  const [isMaterialOpen, setIsMaterialOpen] = useState(true);

  const [colorMode, setColorMode] = useState<ColorMode>("rgb");
  const [colorInputs, setColorInputs] = useState<ColorInputState>(EMPTY_COLOR_INPUTS);

  const settingsRef = useRef<HTMLDivElement | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handleStateChange = (event: CustomEvent<Canvas3DState>) => {
      setEngineState(event.detail);
    };

    window.addEventListener("canvas3d:state", handleStateChange as EventListener);

    const init = async () => {
      ensureImportMap();
      await ensureScript("canvas3d-main", "/canvas-3d/main.js", "module");

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

  const selected = engineState.selected;

  const addObject = (kind: "cube" | "cylinder" | "subtractCube" | "zFighting") => {
    window.Canvas3DBridge?.addObject(kind);
  };

  const setMode = (mode: Canvas3DMode) => {
    window.Canvas3DBridge?.setMode(mode);
  };

  const updateTransform = (field: string, value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    window.Canvas3DBridge?.updateSelectedTransform(field, parsed);
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

  const updateRgbColor = (channel: "r" | "g" | "b", rawValue: string) => {
    const parsed = clamp(Number(rawValue), 0, 255);
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

  const updateHsvColor = (channel: "h" | "s" | "v", rawValue: string) => {
    const parsed = Number(rawValue);
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#13141c] font-mono text-[#c0caf5]">
      <div className="app-noise pointer-events-none absolute inset-0 z-0" />

      {status === "loading" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#2a2d3e] border-t-[#7dcfff]" />
            <p className="mt-3 text-sm text-[#a9b1d6]">Carregando Canvas 3D...</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/90 p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold text-[#f7768e]">Falha ao iniciar o Canvas 3D</h2>
            <p className="mt-2 text-sm text-[#a9b1d6]">Recarregue a página para tentar novamente.</p>
          </div>
        </div>
      )}

      <div id="app-layout" className="fixed inset-0 z-10 flex">
        <aside id="sidebar-left" className="w-75 shrink-0 border-r border-[#2a2d3e] bg-[#151623]/95 p-3 max-md:hidden">
          <div className="sidebar-section" id="hierarchy-section">
            <div className="sidebar-header">
              <span>Hierarquia</span>
            </div>

            <div className="sidebar-content" id="hierarchy-list">
              {engineState.objects.length === 0 && (
                <div className="hierarchy-empty">Nenhum objeto na cena</div>
              )}

              {engineState.objects.map((obj) => (
                <div
                  className={`hierarchy-item${engineState.selectedUuid === obj.uuid ? " selected" : ""}`}
                  key={obj.uuid}
                  onClick={() => window.Canvas3DBridge?.selectObject(obj.uuid)}
                  onDoubleClick={() => window.Canvas3DBridge?.focusObject(obj.uuid)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.Canvas3DBridge?.selectObject(obj.uuid);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <svg className="hierarchy-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  <span className="hierarchy-name">{obj.name}</span>
                  <button
                    className="hierarchy-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      window.Canvas3DBridge?.deleteObject(obj.uuid);
                    }}
                    title="Delete"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section mt-3" id="add-section">
            <div className="sidebar-header">
              <span>Adicionar Objeto</span>
            </div>
            <div className="sidebar-content">
              <div className="prim-grid">
                <button className="prim-btn" onClick={() => addObject("cube")} type="button">Cubo</button>
                <button className="prim-btn" onClick={() => addObject("cylinder")} type="button">Cilindro</button>
                <button className="prim-btn opacity-45" disabled type="button">Esfera</button>
                <button className="prim-btn opacity-45" disabled type="button">Cone</button>
                <button className="prim-btn opacity-45" disabled type="button">Torus</button>
                <button className="prim-btn prim-btn-subtract" onClick={() => addObject("subtractCube")} type="button">
                  Sub. Cube
                </button>
              </div>
              <div className="demo-section">
                <div className="demo-label">Demos</div>
                <button className="demo-btn" onClick={() => addObject("zFighting")} type="button">Z-Fighting</button>
                <button className="demo-btn opacity-45" disabled type="button">Skew Demo</button>
              </div>
            </div>
          </div>

          <div className="sidebar-section mt-3" id="tools-section">
            <div className="sidebar-header">
              <span>Ferramentas</span>
            </div>

            <div className="sidebar-content">
              <div className="tool-grid">
                <button className={`tool-btn${engineState.mode === "translate" ? " active" : ""}`} onClick={() => setMode("translate")} type="button">
                  <span>Translate</span>
                  <kbd>W</kbd>
                </button>
                <button className={`tool-btn${engineState.mode === "rotate" ? " active" : ""}`} onClick={() => setMode("rotate")} type="button">
                  <span>Rotate</span>
                  <kbd>R</kbd>
                </button>
                <button className={`tool-btn${engineState.mode === "scale" ? " active" : ""}`} onClick={() => setMode("scale")} type="button">
                  <span>Scale</span>
                  <kbd>S</kbd>
                </button>
                <button className={`tool-btn${engineState.mode === "skew" ? " active" : ""}`} onClick={() => setMode("skew")} type="button">
                  <span>Skew</span>
                  <kbd>K</kbd>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main id="center-area" className="relative flex-1 bg-[#0f1017]">
          <div id="canvas-container" className="absolute inset-0" />
          <div id="canvas-actions" className="absolute right-3 top-2 z-50 flex items-center gap-2">
            <button className="topbar-btn hover:cursor-pointer" onClick={() => window.Canvas3DBridge?.resetCamera()} title="Reset Camera" type="button">
              <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M6.5 10v9.5h11V10" />
              </svg>
            </button>

            <button
              className={`topbar-btn topbar-text-btn hover:cursor-pointer ${engineState.isOrthographic ? " active" : ""}`}
              onClick={() => window.Canvas3DBridge?.toggleCameraType()}
              title="Ortografica"
              type="button"
            >
              Ortografica
            </button>

            <button
              className={`topbar-btn topbar-text-btn hover:cursor-pointer ${engineState.isCullingViewEnabled ? " active" : ""}`}
              onClick={() => window.Canvas3DBridge?.toggleCullingView()}
              title="Culling View"
              type="button"
            >
              Culling View
            </button>

            <button
              className="topbar-btn hover:cursor-pointer"
              onClick={() => {
                setIsInfoOpen((prev) => !prev);
                setIsSettingsOpen(false);
              }}
              ref={infoButtonRef}
              title="Controles"
              type="button"
            >
              i
            </button>

            <button
              className="topbar-btn hover:cursor-pointer"
              onClick={() => {
                setIsSettingsOpen((prev) => !prev);
                setIsInfoOpen(false);
              }}
              ref={settingsButtonRef}
              title="Configuracoes"
              type="button"
            >
              ⚙
            </button>
          </div>

          <div className={`settings-menu ${isSettingsOpen ? "" : "hidden"}`} ref={settingsRef}>
            <div className="settings-item">
              <label className="settings-label" htmlFor="toggle-grid">
                <input
                  checked={engineState.settings.gridVisible}
                  id="toggle-grid"
                  onChange={(event) => window.Canvas3DBridge?.setGridVisible(event.target.checked)}
                  type="checkbox"
                />
                <span>Mostrar Grid</span>
              </label>
            </div>

            <div className="settings-item">
              <label className="settings-label" htmlFor="toggle-snap">
                <input
                  checked={engineState.settings.snapToGrid}
                  id="toggle-snap"
                  onChange={(event) => window.Canvas3DBridge?.setSnapEnabled(event.target.checked)}
                  type="checkbox"
                />
                <span>Snap to Grid</span>
              </label>
            </div>

            <div className="settings-item">
              <label className="settings-label" htmlFor="snap-size">
                <span>Snap Size</span>
              </label>
              <div className="settings-input-group">
                <input
                  className={`snap-size-item ${engineState.settings.snapToGrid ? "enabled" : ""}`}
                  id="snap-size"
                  min="0.1"
                  onChange={(event) => window.Canvas3DBridge?.setSnapSize(Number(event.target.value))}
                  step="0.1"
                  type="number"
                  value={numberValue(engineState.settings.snapSize, 2)}
                />
                <button
                  className={`reset-btn settings-reset-btn snap-size-item ${engineState.settings.snapToGrid ? "enabled" : ""}`}
                  onClick={() => window.Canvas3DBridge?.resetSetting("snap-size")}
                  title="Reset Snap Size"
                  type="button"
                >
                  ↺
                </button>
              </div>
            </div>

            <div className="settings-item">
              <label className="settings-label" htmlFor="bg-color">
                <span>Cor do Background</span>
              </label>
              <input
                id="bg-color"
                onChange={(event) => window.Canvas3DBridge?.setBackgroundColor(event.target.value)}
                type="color"
                value={engineState.settings.backgroundColor}
              />
            </div>

            <div className="settings-item">
              <label className="settings-label" htmlFor="grid-color">
                <span>Cor do Grid</span>
              </label>
              <input
                id="grid-color"
                onChange={(event) => window.Canvas3DBridge?.setGridColor(event.target.value)}
                type="color"
                value={engineState.settings.gridColor}
              />
            </div>

            <div className="settings-item">
              <label className="settings-label">
                <span>Far Clip: {numberValue(engineState.settings.farClip, 0)}</span>
                <span>Near Clip: {numberValue(engineState.settings.nearClip, 2)}</span>
              </label>

              <div className="settings-slider-group">
                <input
                  id="far-clip"
                  max="100"
                  min="5"
                  onChange={(event) => window.Canvas3DBridge?.setFarClip(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={numberValue(engineState.settings.farClip, 0)}
                />
                <button
                  className="reset-btn settings-reset-btn"
                  onClick={() => window.Canvas3DBridge?.resetSetting("far-clip")}
                  title="Reset Far Clip"
                  type="button"
                >
                  ↺
                </button>
              </div>

              <div className="settings-slider-group">
                <input
                  id="near-clip"
                  max="5"
                  min="0.01"
                  onChange={(event) => window.Canvas3DBridge?.setNearClip(Number(event.target.value))}
                  step="0.01"
                  type="range"
                  value={numberValue(engineState.settings.nearClip, 2)}
                />
                <button
                  className="reset-btn settings-reset-btn"
                  onClick={() => window.Canvas3DBridge?.resetSetting("near-clip")}
                  title="Reset Near Clip"
                  type="button"
                >
                  ↺
                </button>
              </div>
            </div>
          </div>

          <div className={`info-tooltip ${isInfoOpen ? "" : "hidden"}`} ref={infoRef}>
            <button className="close-info-btn" onClick={() => setIsInfoOpen(false)} type="button">
              ×
            </button>
            <strong>Controles</strong>
            <div>Rodar camera: botao do meio ou botao direito</div>
            <div>Pan: Shift + botao do meio</div>
            <div>Zoom: scroll do mouse</div>
            <div>Focar objeto: F</div>
            <strong className="mt-2">Keybinds</strong>
            <div>W: Translate | R: Rotate | S: Scale | K: Skew | DEL: Delete</div>
          </div>

          <div id="viewport-header" className="pointer-events-none absolute left-2 top-3 text-[10px] text-[#f3f3f3]">
            Viewport
          </div>
        </main>

        <aside id="sidebar-right" className="w-80 shrink-0 border-l border-[#2a2d3e] bg-[#151623]/95 p-3 max-lg:hidden">
          <div className="sidebar-header">
            <span>Inspetor</span>
          </div>

          {selected ? (
            <div id="inspector-panel">
              <div className="inspector-group">
                <div
                  className={`group-header collapsible ${isTransformOpen ? "open" : ""}`}
                  onClick={() => setIsTransformOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <svg className="chevron-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span className="group-title">Transform</span>
                </div>

                <div className={isTransformOpen ? "" : "collapsed"} id="transform-content">
                  <div className="prop-row"><span className="prop-label">Position</span></div>
                  <div className="transform-row">
                    <div className="axis-inputs">
                      <div className="axis-input-wrap"><input id="pos-x" onChange={(event) => updateTransform("pos-x", event.target.value)} step="0.1" type="number" value={numberValue(selected.position.x)} /><span className="axis-suffix">X</span></div>
                      <div className="axis-input-wrap"><input id="pos-y" onChange={(event) => updateTransform("pos-y", event.target.value)} step="0.1" type="number" value={numberValue(selected.position.y)} /><span className="axis-suffix">Y</span></div>
                      <div className="axis-input-wrap"><input id="pos-z" onChange={(event) => updateTransform("pos-z", event.target.value)} step="0.1" type="number" value={numberValue(selected.position.z)} /><span className="axis-suffix">Z</span></div>
                    </div>
                    <button className="reset-btn group-reset-btn" onClick={() => resetTransformGroup(["pos-x", "pos-y", "pos-z"])} title="Reset Position" type="button">R</button>
                  </div>

                  <div className="prop-row"><span className="prop-label">Rotation</span></div>
                  <div className="transform-row">
                    <div className="axis-inputs">
                      <div className="axis-input-wrap"><input id="rot-x" onChange={(event) => updateTransform("rot-x", event.target.value)} step="1" type="number" value={numberValue(selected.rotation.x)} /><span className="axis-suffix">X</span></div>
                      <div className="axis-input-wrap"><input id="rot-y" onChange={(event) => updateTransform("rot-y", event.target.value)} step="1" type="number" value={numberValue(selected.rotation.y)} /><span className="axis-suffix">Y</span></div>
                      <div className="axis-input-wrap"><input id="rot-z" onChange={(event) => updateTransform("rot-z", event.target.value)} step="1" type="number" value={numberValue(selected.rotation.z)} /><span className="axis-suffix">Z</span></div>
                    </div>
                    <button className="reset-btn group-reset-btn" onClick={() => resetTransformGroup(["rot-x", "rot-y", "rot-z"])} title="Reset Rotation" type="button">R</button>
                  </div>

                  <div className="prop-row"><span className="prop-label">Scale</span></div>
                  <div className="transform-row">
                    <div className="axis-inputs">
                      <div className="axis-input-wrap"><input id="scale-x" min="0.1" onChange={(event) => updateTransform("scale-x", event.target.value)} step="0.1" type="number" value={numberValue(selected.scale.x)} /><span className="axis-suffix">X</span></div>
                      <div className="axis-input-wrap"><input id="scale-y" min="0.1" onChange={(event) => updateTransform("scale-y", event.target.value)} step="0.1" type="number" value={numberValue(selected.scale.y)} /><span className="axis-suffix">Y</span></div>
                      <div className="axis-input-wrap"><input id="scale-z" min="0.1" onChange={(event) => updateTransform("scale-z", event.target.value)} step="0.1" type="number" value={numberValue(selected.scale.z)} /><span className="axis-suffix">Z</span></div>
                    </div>
                    <button className="reset-btn group-reset-btn" onClick={() => resetTransformGroup(["scale-x", "scale-y", "scale-z"])} title="Reset Scale" type="button">R</button>
                  </div>

                  <div className="prop-row"><span className="prop-label">Skew</span></div>
                  <div className="transform-row">
                    <div className="axis-inputs skew-inputs">
                      <div className="axis-input-wrap"><input id="skew-xy" onChange={(event) => updateTransform("skew-xy", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.xy)} /><span className="axis-suffix">XY</span></div>
                      <div className="axis-input-wrap"><input id="skew-xz" onChange={(event) => updateTransform("skew-xz", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.xz)} /><span className="axis-suffix">XZ</span></div>
                      <div className="axis-input-wrap"><input id="skew-yx" onChange={(event) => updateTransform("skew-yx", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.yx)} /><span className="axis-suffix">YX</span></div>
                      <div className="axis-input-wrap"><input id="skew-yz" onChange={(event) => updateTransform("skew-yz", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.yz)} /><span className="axis-suffix">YZ</span></div>
                      <div className="axis-input-wrap"><input id="skew-zx" onChange={(event) => updateTransform("skew-zx", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.zx)} /><span className="axis-suffix">ZX</span></div>
                      <div className="axis-input-wrap"><input id="skew-zy" onChange={(event) => updateTransform("skew-zy", event.target.value)} step="0.1" type="number" value={numberValue(selected.skew.zy)} /><span className="axis-suffix">ZY</span></div>
                    </div>
                    <button
                      className="reset-btn group-reset-btn"
                      onClick={() => resetTransformGroup(["skew-xy", "skew-xz", "skew-yx", "skew-yz", "skew-zx", "skew-zy"])}
                      title="Reset Skew"
                      type="button"
                    >
                      R
                    </button>
                  </div>
                </div>
              </div>

              <div className="inspector-group mt-3">
                <div
                  className={`group-header collapsible ${isMaterialOpen ? "open" : ""}`}
                  onClick={() => setIsMaterialOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <svg className="chevron-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span className="group-title">Material</span>
                </div>

                <div className={isMaterialOpen ? "" : "collapsed"} id="material-content">
                  <div className="color-mode-tabs">
                    <button className={`color-tab ${colorMode === "rgb" ? "active" : ""}`} onClick={() => setColorMode("rgb")} type="button">RGB</button>
                    <button className={`color-tab ${colorMode === "hsv" ? "active" : ""}`} onClick={() => setColorMode("hsv")} type="button">HSV</button>
                  </div>

                  {colorMode === "rgb" ? (
                    <div className="color-inputs" id="rgb-inputs">
                      <div className="color-field"><label className="prop-letter" htmlFor="color-r">R</label><input id="color-r" max="255" min="0" onChange={(event) => updateRgbColor("r", event.target.value)} step="1" type="number" value={String(colorInputs.r)} /></div>
                      <div className="color-field"><label className="prop-letter" htmlFor="color-g">G</label><input id="color-g" max="255" min="0" onChange={(event) => updateRgbColor("g", event.target.value)} step="1" type="number" value={String(colorInputs.g)} /></div>
                      <div className="color-field"><label className="prop-letter" htmlFor="color-b">B</label><input id="color-b" max="255" min="0" onChange={(event) => updateRgbColor("b", event.target.value)} step="1" type="number" value={String(colorInputs.b)} /></div>
                    </div>
                  ) : (
                    <div className="color-inputs" id="hsv-inputs">
                      <div className="color-field"><label className="prop-letter" htmlFor="color-h">H</label><input id="color-h" max="360" min="0" onChange={(event) => updateHsvColor("h", event.target.value)} step="1" type="number" value={String(colorInputs.h)} /></div>
                      <div className="color-field"><label className="prop-letter" htmlFor="color-s">S</label><input id="color-s" max="100" min="0" onChange={(event) => updateHsvColor("s", event.target.value)} step="1" type="number" value={String(colorInputs.s)} /></div>
                      <div className="color-field"><label className="prop-letter" htmlFor="color-v">V</label><input id="color-v" max="100" min="0" onChange={(event) => updateHsvColor("v", event.target.value)} step="1" type="number" value={String(colorInputs.v)} /></div>
                    </div>
                  )}

                  <div className="alpha-row">
                    <span className="alpha-label">Alpha</span>
                    <input
                      id="color-alpha"
                      max="100"
                      min="0"
                      onChange={(event) => {
                        const alpha = clamp(Number(event.target.value), 0, 100);
                        setColorInputs((prev) => ({ ...prev, alpha }));
                        window.Canvas3DBridge?.setSelectedAlpha(alpha);
                      }}
                      step="1"
                      type="range"
                      value={String(colorInputs.alpha)}
                    />
                    <span id="alpha-value">{`${colorInputs.alpha}%`}</span>
                  </div>

                  <div className="hex-row">
                    <span className="hex-label">Hex</span>
                    <input
                      id="color-hex"
                      maxLength={7}
                      onBlur={(event) => updateHexColor(event.target.value)}
                      onChange={(event) => setColorInputs((prev) => ({ ...prev, hex: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          updateHexColor((event.target as HTMLInputElement).value);
                        }
                      }}
                      placeholder="#ffffff"
                      type="text"
                      value={colorInputs.hex}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-empty" id="inspector-empty">
              <div className="text-2xl">◻</div>
              <div>Selecione um objeto para editar suas propriedades</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
