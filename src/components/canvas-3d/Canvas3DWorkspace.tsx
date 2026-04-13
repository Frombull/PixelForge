"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import katex from "katex";
import { Pane } from "tweakpane";
import DebugPane from "./DebugPane";
import "katex/dist/katex.min.css";

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
  axesVisible: boolean;
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
    axesVisible: true,
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
      setAxesVisible: (visible: boolean) => void;
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

function injectImportMap() {
  if (document.getElementById("canvas3d-importmap")) return;

  const script = document.createElement("script");
  script.id = "canvas3d-importmap";
  script.type = "importmap";
  script.textContent = JSON.stringify(IMPORT_MAP);
  document.head.appendChild(script);
}

function loadCanvasRuntimeModule() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("canvas3d-main") as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar /canvas-3d/main.js")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "canvas3d-main";
    script.type = "module";
    script.src = "/canvas-3d/main.js";
    script.async = true;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );

    script.addEventListener("error", () => reject(new Error("Falha ao carregar /canvas-3d/main.js")), {
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

function matrixNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "0";
  const normalized = Math.abs(value) < 1e-6 ? 0 : value;
  const rounded = Number(normalized.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function matrixToLatex(rows: string[][]) {
  return `\\begin{bmatrix}${rows.map((row) => row.join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

type DraggableNumberInputProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  scrubSensitivity?: number;
  handlePosition?: "left" | "right";
};

function DraggableNumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  scrubSensitivity = 0.3,
  handlePosition,
  id,
  className,
  disabled,
}: DraggableNumberInputProps) {
  const [internalValue, setInternalValue] = useState<number>(value);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValueRef = useRef(value);
  const numericStep = Math.abs(Number(step) || 1);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function decimalPlaces(n: number) {
    const decimals = String(n).split(".")[1];
    return decimals ? decimals.length : 0;
  }

  const clampAndQuantize = (next: number) => {
    const precision = decimalPlaces(numericStep);
    let quantized = Math.round(next / numericStep) * numericStep;
    if (typeof min === "number") quantized = Math.max(min, quantized);
    if (typeof max === "number") quantized = Math.min(max, quantized);
    return Number(quantized.toFixed(precision));
  };

  const commit = (next: number) => {
    if (!Number.isFinite(next)) return;
    const normalized = clampAndQuantize(next);
    setInternalValue(normalized);
    onValueChange(normalized);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!draggingRef.current || disabled) return;
    const delta = event.clientX - startXRef.current;
    commit(startValueRef.current + delta * numericStep * scrubSensitivity);
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (disabled || event.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startValueRef.current = internalValue;
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className="w-full min-w-0">
      <input
        id={id}
        className={`${className ?? ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-ew-resize hover:text-[#7dcfff] active:cursor-ew-resize"
        }`}
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) return;
          commit(parsed);
        }}
        onPointerDown={handlePointerDown}
        step={numericStep}
        type="number"
        value={internalValue}
      />
    </div>
  );
}

export default function Canvas3DWorkspace() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
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
  const tweakpaneRef = useRef<any>(null);
  const tweakpaneContainerRef = useRef<HTMLDivElement | null>(null);
  const selected = engineState.selected;
  const shouldShowTransformMatrix = ["translate", "rotate", "scale", "skew"].includes(engineState.mode);
  const matrixTitle =
    engineState.mode === "translate"
      ? "Matriz de Translação"
      : engineState.mode === "rotate"
      ? "Matriz de Rotação"
      : engineState.mode === "skew"
      ? "Matriz de Skew"
      : "Matriz de Escala";

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
    let cancelled = false;

    function initPane() {
      if (!isSettingsOpen) return;
      if (!tweakpaneContainerRef.current) return;

      try {
        const pane: any = new Pane({ container: tweakpaneContainerRef.current, title: "Configurações" });

        const settingsObj = {
          gridVisible: engineState.settings.gridVisible,
          axesVisible: engineState.settings.axesVisible,
          snapToGrid: engineState.settings.snapToGrid,
          snapSize: engineState.settings.snapSize,
          backgroundColor: engineState.settings.backgroundColor,
          gridColor: engineState.settings.gridColor,
          nearClip: engineState.settings.nearClip,
          farClip: engineState.settings.farClip,
        };

        const controllers: Record<string, any> = {};

        controllers.grid = pane.addInput(settingsObj, "gridVisible", { label: "Mostrar Grid" });
        controllers.grid.on("change", (ev: any) => window.Canvas3DBridge?.setGridVisible(ev.value));

        controllers.axes = pane.addInput(settingsObj, "axesVisible", { label: "Mostrar Eixos" });
        controllers.axes.on("change", (ev: any) => window.Canvas3DBridge?.setAxesVisible(ev.value));

        controllers.snap = pane.addInput(settingsObj, "snapToGrid", { label: "Snap to Grid" });
        controllers.snap.on("change", () => window.Canvas3DBridge?.setSnapEnabled(settingsObj.snapToGrid));

        controllers.snapSize = pane.addInput(settingsObj, "snapSize", { min: 0.1, max: 10, step: 0.1, label: "Snap Size" });
        controllers.snapSize.on("change", (ev: any) => window.Canvas3DBridge?.setSnapSize(ev.value));

        controllers.bg = pane.addInput(settingsObj, "backgroundColor", { view: "color", label: "Background" });
        controllers.bg.on("change", (ev: any) => window.Canvas3DBridge?.setBackgroundColor(ev.value));

        controllers.gridColor = pane.addInput(settingsObj, "gridColor", { view: "color", label: "Grid Color" });
        controllers.gridColor.on("change", (ev: any) => window.Canvas3DBridge?.setGridColor(ev.value));

        controllers.far = pane.addInput(settingsObj, "farClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
        controllers.far.on("change", (ev: any) => window.Canvas3DBridge?.setFarClip(ev.value));

        controllers.near = pane.addInput(settingsObj, "nearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
        controllers.near.on("change", (ev: any) => window.Canvas3DBridge?.setNearClip(ev.value));

        tweakpaneRef.current = { pane, settingsObj, controllers };
      } catch (err) {
        // don't crash the UI if tweakpane fails to load
        // eslint-disable-next-line no-console
        console.error("Failed to initialize Tweakpane", err);
      }
    }

    initPane();

    return () => {
      cancelled = true;
      if (tweakpaneRef.current?.pane) {
        try {
          tweakpaneRef.current.pane.dispose?.();
        } catch (e) {
          /* ignore */
        }
        tweakpaneRef.current = null;
      }
    };
  }, [isSettingsOpen]);
  
  useEffect(() => {
    if (!tweakpaneRef.current) return;
    const info = tweakpaneRef.current;
    const s = engineState.settings;

    // update the bound settings object and controllers
    try {
      info.settingsObj.gridVisible = s.gridVisible;
      info.settingsObj.axesVisible = s.axesVisible;
      info.settingsObj.snapToGrid = s.snapToGrid;
      info.settingsObj.snapSize = s.snapSize;
      info.settingsObj.backgroundColor = s.backgroundColor;
      info.settingsObj.gridColor = s.gridColor;
      info.settingsObj.nearClip = s.nearClip;
      info.settingsObj.farClip = s.farClip;

      info.controllers.grid.value = s.gridVisible;
      info.controllers.axes.value = s.axesVisible;
      info.controllers.snap.value = s.snapToGrid;
      info.controllers.snapSize.value = s.snapSize;
      info.controllers.bg.value = s.backgroundColor;
      info.controllers.gridColor.value = s.gridColor;
      info.controllers.near.value = s.nearClip;
      info.controllers.far.value = s.farClip;
    } catch (e) {
      // ignore if controllers don't expose value
    }
  }, [
    engineState.settings.gridVisible,
    engineState.settings.axesVisible,
    engineState.settings.snapToGrid,
    engineState.settings.snapSize,
    engineState.settings.backgroundColor,
    engineState.settings.gridColor,
    engineState.settings.nearClip,
    engineState.settings.farClip,
  ]);

  

  useEffect(() => {
    if (!shouldShowTransformMatrix) {
      if (scaleMatrixRef.current) scaleMatrixRef.current.innerHTML = "";
      return;
    }

    const el = scaleMatrixRef.current;
    if (!el) return;

    const tx = selected?.position.x ?? 0;
    const ty = selected?.position.y ?? 0;
    const tz = selected?.position.z ?? 0;

    const sx = selected?.scale.x ?? 1;
    const sy = selected?.scale.y ?? 1;
    const sz = selected?.scale.z ?? 1;

    const rx = ((selected?.rotation.x ?? 0) * Math.PI) / 180;
    const ry = ((selected?.rotation.y ?? 0) * Math.PI) / 180;
    const rz = ((selected?.rotation.z ?? 0) * Math.PI) / 180;

    const sinX = Math.sin(rx);
    const cosX = Math.cos(rx);
    const sinY = Math.sin(ry);
    const cosY = Math.cos(ry);
    const sinZ = Math.sin(rz);
    const cosZ = Math.cos(rz);

    const r11 = cosZ * cosY;
    const r12 = cosZ * sinY * sinX - sinZ * cosX;
    const r13 = cosZ * sinY * cosX + sinZ * sinX;
    const r21 = sinZ * cosY;
    const r22 = sinZ * sinY * sinX + cosZ * cosX;
    const r23 = sinZ * sinY * cosX - cosZ * sinX;
    const r31 = -sinY;
    const r32 = cosY * sinX;
    const r33 = cosY * cosX;

    const kxy = selected?.skew.xy ?? 0;
    const kxz = selected?.skew.xz ?? 0;
    const kyx = selected?.skew.yx ?? 0;
    const kyz = selected?.skew.yz ?? 0;
    const kzx = selected?.skew.zx ?? 0;
    const kzy = selected?.skew.zy ?? 0;

    const latex =
      engineState.mode === "translate"
        ? matrixToLatex([
            ["1", "0", "0", matrixNumber(tx)],
            ["0", "1", "0", matrixNumber(ty)],
            ["0", "0", "1", matrixNumber(tz)],
            ["0", "0", "0", "1"],
          ])
        : engineState.mode === "rotate"
        ? matrixToLatex([
            [matrixNumber(r11), matrixNumber(r12), matrixNumber(r13), "0"],
            [matrixNumber(r21), matrixNumber(r22), matrixNumber(r23), "0"],
            [matrixNumber(r31), matrixNumber(r32), matrixNumber(r33), "0"],
            ["0", "0", "0", "1"],
          ])
        : engineState.mode === "skew"
        ? matrixToLatex([
            ["1", matrixNumber(kxy), matrixNumber(kxz), "0"],
            [matrixNumber(kyx), "1", matrixNumber(kyz), "0"],
            [matrixNumber(kzx), matrixNumber(kzy), "1", "0"],
            ["0", "0", "0", "1"],
          ])
        : matrixToLatex([
            [matrixNumber(sx), "0", "0", "0"],
            ["0", matrixNumber(sy), "0", "0"],
            ["0", "0", matrixNumber(sz), "0"],
            ["0", "0", "0", "1"],
          ]);

    try {
      el.innerHTML = katex.renderToString(latex, { throwOnError: false });
    } catch (e) {
      // fail silently :)
    }
  }, [
    engineState.mode,
    shouldShowTransformMatrix,
    selected?.position.x,
    selected?.position.y,
    selected?.position.z,
    selected?.rotation.x,
    selected?.rotation.y,
    selected?.rotation.z,
    selected?.scale.x,
    selected?.scale.y,
    selected?.scale.z,
    selected?.skew.xy,
    selected?.skew.xz,
    selected?.skew.yx,
    selected?.skew.yz,
    selected?.skew.zx,
    selected?.skew.zy,
  ]);

  const addObject = (kind: "cube" | "cylinder" | "subtractCube" | "zFighting") => {
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

  const panelSectionClass = "border-b border-[#2a2d3e]";
  const panelHeaderClass = "mb-[0.55rem] p-0 text-xs uppercase tracking-[0.08em] text-[#7dcfff]";
  const panelActionButtonClass =
    "w-full rounded-[0.1rem] border border-[#2a2d3e] bg-[#13141c] px-[0.6rem] py-[0.45rem] text-xs text-[#c0caf5] transition-all duration-100 hover:border-[#7dcfff] hover:bg-[#232538]";
  const panelToolButtonClass =
    "flex items-center justify-between rounded-[0.1rem] border border-[#2a2d3e] bg-[#13141c] px-[0.5rem] py-[0.45rem] text-[0.73rem] text-[#c0caf5] transition-all duration-100 hover:border-[#7dcfff] hover:bg-[#232538]";
  const panelButtonActiveClass = "border-[#7dcfff] bg-[#1f2a3d] text-[#7dcfff]";
  const topbarButtonClass =
    "inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-[0.1rem] border border-transparent bg-black/12 text-[#f3f3f3] transition-all duration-100 hover:cursor-pointer hover:border-[rgb(200,200,200)] hover:bg-[rgba(229,231,235,0.24)] hover:text-[#f3f4f6]";
  const topbarButtonActiveClass = "!border-[rgb(80,80,80)] !bg-[rgba(32,43,63,0.8)] !text-white";
  const resetButtonClass =
    "h-[1.4rem] w-[1.4rem] rounded-[0.35rem] border border-[#2a2d3e] bg-[#13141c] text-[#a9b1d6] transition-colors hover:border-[#7dcfff] hover:text-[#7dcfff]";
  const inspectorHeaderClass = "mb-[0.55rem] flex cursor-pointer items-center gap-[0.45rem] p-0 text-xs text-[#7dcfff]";
  const scalarInputClass =
    "w-full min-w-0 rounded-[0.35rem] border border-[#2a2d3e] bg-[#13141c] px-[0.35rem] py-[0.2rem] text-[0.72rem] text-[#c0caf5]";
  const axisInputClass = `${scalarInputClass} pr-[1.6rem]`;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#13141c] font-mono text-[#c0caf5]">
      <div className="app-noise pointer-events-none absolute inset-0 z-0" />

      {status === "loading" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#2a2d3e] border-t-[#7dcfff]" />
            <p className="mt-3 text-sm text-[#a9b1d6]">Carregando Canvas...</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-1200 flex items-center justify-center bg-[#0f1017]/90 p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold text-[#f7768e]">Falha ao iniciar o Canvas</h2>
            <p className="mt-2 text-sm text-[#a9b1d6]">Recarregue a página para tentar novamente</p>
          </div>
        </div>
      )}

      <div id="app-layout" className="fixed inset-0 z-10 flex">
        <aside id="sidebar-left" className="w-75 shrink-0 border-r border-[#2a2d3e] bg-[#1a1b26d9] p-3 max-md:hidden flex flex-col">
          <div className={panelSectionClass} id="hierarchy-section">
            <div className={panelHeaderClass}>
              <span>Hierarquia</span>
            </div>

            <div className="max-h-68 overflow-y-auto p-0 pr-1" id="hierarchy-list" style={{ scrollbarGutter: "stable" }}>
              {engineState.objects.length === 0 && (
                <div className="p-1 text-xs text-[#565f89] text-center">Nenhum objeto na cena</div>
              )}

              {engineState.objects.map((obj) => (
                <div
                  className={`mb-[0.1rem] flex cursor-pointer items-center gap-[0.4rem] px-[0.2rem] py-[0.3rem] text-[0.73rem] text-[#c0caf5] transition-colors hover:bg-[rgba(125,207,255,0.1)] ${
                    engineState.selectedUuid === obj.uuid || engineState.selected?.uuid === obj.uuid
                      ? "bg-[rgba(125,207,255,0.1)]!"
                      : ""
                  }`}
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
                  <svg className="h-[0.9rem] w-[0.9rem] text-[#7dcfff]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  <span className="flex-1">{obj.name}</span>
                  <button
                    className="h-4 w-4 border-none bg-transparent text-[0.8rem] leading-[0.8rem] text-[#a9b1d6] transition-colors hover:text-[#f7768e]"
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

          <div className={`${panelSectionClass} mt-3`} id="add-section">
            <div className={panelHeaderClass}>
              <span>Adicionar Objeto</span>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-2 gap-2">
                <button className={panelActionButtonClass} onClick={() => addObject("cube")} type="button">Cubo</button>
                <button className={panelActionButtonClass} onClick={() => addObject("cylinder")} type="button">Cilindro</button>
                <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Esfera</button>
                <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Cone</button>
                <button className={`${panelActionButtonClass} opacity-45`} disabled type="button">Torus</button>
                <button
                  className={`${panelActionButtonClass} border-[#f7768e] text-[#f7768e]`}
                  onClick={() => addObject("subtractCube")}
                  type="button"
                >
                  Sub. Cube
                </button>
              </div>
              <div className="mt-[0.65rem]">
                <div className="mb-1 text-[0.68rem] uppercase text-[#565f89]">Demos</div>
                <button className={panelActionButtonClass} onClick={() => addObject("zFighting")} type="button">Z-Fighting</button>
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
                  onClick={() => setMode("translate")}
                  type="button"
                >
                  <span>Translate</span>
                  <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-[#7dcfff]">W</kbd>
                </button>
                <button
                  className={`${panelToolButtonClass} ${engineState.mode === "rotate" ? panelButtonActiveClass : ""}`}
                  onClick={() => setMode("rotate")}
                  type="button"
                >
                  <span>Rotate</span>
                  <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-[#7dcfff]">R</kbd>
                </button>
                <button
                  className={`${panelToolButtonClass} ${engineState.mode === "scale" ? panelButtonActiveClass : ""}`}
                  onClick={() => setMode("scale")}
                  type="button"
                >
                  <span>Scale</span>
                  <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-[#7dcfff]">S</kbd>
                </button>
                <button
                  className={`${panelToolButtonClass} ${engineState.mode === "skew" ? panelButtonActiveClass : ""}`}
                  onClick={() => setMode("skew")}
                  type="button"
                >
                  <span>Skew</span>
                  <kbd className="rounded border border-[#2a2d3e] px-[0.3rem] text-[0.65rem] text-[#7dcfff]">K</kbd>
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

        <main id="center-area" className="relative flex-1 bg-[#0f1017]">
          <div id="canvas-container" className="absolute inset-0" />
          <div id="canvas-actions" className="absolute right-3 top-2 z-50 flex items-center gap-2 backdrop-blur-[2px]">
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

          <div
            className={`absolute right-3 top-[2.65rem] z-60 w-72 rounded-[0.2rem] ${isSettingsOpen ? "" : "hidden"}`}
            ref={settingsRef}
          >
            <div className="px-2 py-2">
              <div ref={tweakpaneContainerRef} className="w-full" />
            </div>
          </div>
          <DebugPane isOpen={isDebugOpen} engineState={engineState} className="absolute left-2 top-3 z-60 w-72 rounded-[0.1rem]" />
          <div
            className={`absolute right-3 top-[2.65rem] z-60 w-76 rounded-[0.1rem] bg-[rgba(26,27,38,0.85)] p-3 text-xs leading-[1.45] backdrop-blur-[5px] text-[#c0caf5] ${
              isInfoOpen ? "" : "hidden"
            }`}
            ref={infoRef}>
            <strong>Controles:</strong>
            <div>- Rodar camera: botao do meio ou botao direito</div>
            <div>- Pan: Shift + botao do meio</div>
            <div>- Zoom: scroll do mouse</div>
            <div>- Focar objeto: F</div>
            <strong className="mt-2">Keybinds</strong>
            <div>W: Translate | R: Rotate | S: Scale | K: Skew | DEL: Delete</div>
          </div>
        </main>

        <aside id="sidebar-right" className="w-80 shrink-0 border-l border-[#2a2d3e] bg-[#1a1b26d9] p-3 max-lg:hidden">
          <div className={panelHeaderClass}>
            <span>Inspetor</span>
          </div>

          {selected ? (
            <div id="inspector-panel">
              <div className="border-b border-[#2a2d3e] py-[0.7rem]">
                <div
                  className={inspectorHeaderClass}
                  onClick={() => setIsTransformOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <svg
                    className={`h-[0.9rem] w-[0.9rem] transition-transform duration-150 ${isTransformOpen ? "" : "-rotate-90"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span className="group-title">Transform</span>
                </div>

                <div className={isTransformOpen ? "p-0" : "hidden p-0"} id="transform-content">
                  <div className="mb-[0.3rem] mt-[0.55rem]"><span className="text-[0.68rem] uppercase text-[#565f89]">Position</span></div>
                  <div className="flex items-stretch gap-[0.35rem]">
                    <div className="grid flex-1 grid-cols-3 gap-[0.35rem]">
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="pos-x" onValueChange={(value) => updateTransform("pos-x", value)} step={0.1} value={selected.position.x} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">X</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="pos-y" onValueChange={(value) => updateTransform("pos-y", value)} step={0.1} value={selected.position.y} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Y</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="pos-z" onValueChange={(value) => updateTransform("pos-z", value)} step={0.1} value={selected.position.z} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Z</span></div>
                    </div>
                    <button className={`${resetButtonClass} min-w-4 w-auto px-[0.45rem] text-[0.68rem]`} onClick={() => resetTransformGroup(["pos-x", "pos-y", "pos-z"])} title="Reset Position" type="button">R</button>
                  </div>

                  <div className="mb-[0.3rem] mt-[0.55rem]"><span className="text-[0.68rem] uppercase text-[#565f89]">Rotation</span></div>
                  <div className="flex items-stretch gap-[0.35rem]">
                    <div className="grid flex-1 grid-cols-3 gap-[0.35rem]">
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="rot-x" onValueChange={(value) => updateTransform("rot-x", value)} step={1} value={selected.rotation.x} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">X</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="rot-y" onValueChange={(value) => updateTransform("rot-y", value)} step={1} value={selected.rotation.y} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Y</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="rot-z" onValueChange={(value) => updateTransform("rot-z", value)} step={1} value={selected.rotation.z} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Z</span></div>
                    </div>
                    <button className={`${resetButtonClass} min-w-4 w-auto px-[0.45rem] text-[0.68rem]`} onClick={() => resetTransformGroup(["rot-x", "rot-y", "rot-z"])} title="Reset Rotation" type="button">R</button>
                  </div>

                  <div className="mb-[0.3rem] mt-[0.55rem]"><span className="text-[0.68rem] uppercase text-[#565f89]">Scale</span></div>
                  <div className="flex items-stretch gap-[0.35rem]">
                    <div className="grid flex-1 grid-cols-3 gap-[0.35rem]">
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="scale-x" min={0.1} onValueChange={(value) => updateTransform("scale-x", value)} step={0.1} value={selected.scale.x} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">X</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="scale-y" min={0.1} onValueChange={(value) => updateTransform("scale-y", value)} step={0.1} value={selected.scale.y} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Y</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="scale-z" min={0.1} onValueChange={(value) => updateTransform("scale-z", value)} step={0.1} value={selected.scale.z} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">Z</span></div>
                    </div>
                    <button className={`${resetButtonClass} min-w-4 w-auto px-[0.45rem] text-[0.68rem]`} onClick={() => resetTransformGroup(["scale-x", "scale-y", "scale-z"])} title="Reset Scale" type="button">R</button>
                  </div>

                  <div className="mb-[0.3rem] mt-[0.55rem]"><span className="text-[0.68rem] uppercase text-[#565f89]">Skew</span></div>
                  <div className="flex items-stretch gap-[0.35rem]">
                    <div className="grid flex-1 grid-cols-3 gap-[0.35rem]">
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-xy" onValueChange={(value) => updateTransform("skew-xy", value)} step={0.1} value={selected.skew.xy} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">XY</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-xz" onValueChange={(value) => updateTransform("skew-xz", value)} step={0.1} value={selected.skew.xz} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">XZ</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-yx" onValueChange={(value) => updateTransform("skew-yx", value)} step={0.1} value={selected.skew.yx} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">YX</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-yz" onValueChange={(value) => updateTransform("skew-yz", value)} step={0.1} value={selected.skew.yz} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">YZ</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-zx" onValueChange={(value) => updateTransform("skew-zx", value)} step={0.1} value={selected.skew.zx} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">ZX</span></div>
                      <div className="relative flex items-center"><DraggableNumberInput className={axisInputClass} handlePosition="left" id="skew-zy" onValueChange={(value) => updateTransform("skew-zy", value)} step={0.1} value={selected.skew.zy} /><span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-[#7dcfff]">ZY</span></div>
                    </div>
                    <button
                      className={`${resetButtonClass} min-w-4 w-auto px-[0.45rem] text-[0.68rem]`}
                      onClick={() => resetTransformGroup(["skew-xy", "skew-xz", "skew-yx", "skew-yz", "skew-zx", "skew-zy"])}
                      title="Reset Skew"
                      type="button"
                    >
                      R
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 border-b border-[#2a2d3e] py-[0.7rem]">
                <div
                  className={inspectorHeaderClass}
                  onClick={() => setIsMaterialOpen((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                >
                  <svg
                    className={`h-[0.9rem] w-[0.9rem] transition-transform duration-150 ${isMaterialOpen ? "" : "-rotate-90"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span className="group-title">Material</span>
                </div>

                <div className={isMaterialOpen ? "p-0" : "hidden p-0"} id="material-content">
                  <div className="mb-[0.45rem] flex gap-[0.3rem]">
                    <button
                      className={`flex-1 rounded-[0.35rem] border border-[#2a2d3e] bg-[#13141c] py-1 text-[0.72rem] text-[#a9b1d6] ${
                        colorMode === "rgb" ? panelButtonActiveClass : ""
                      }`}
                      onClick={() => setColorMode("rgb")}
                      type="button"
                    >
                      RGB
                    </button>
                    <button
                      className={`flex-1 rounded-[0.35rem] border border-[#2a2d3e] bg-[#13141c] py-1 text-[0.72rem] text-[#a9b1d6] ${
                        colorMode === "hsv" ? panelButtonActiveClass : ""
                      }`}
                      onClick={() => setColorMode("hsv")}
                      type="button"
                    >
                      HSV
                    </button>
                  </div>

                  {colorMode === "rgb" ? (
                    <div className="grid grid-cols-3 gap-[0.35rem]" id="rgb-inputs">
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-r">R</label><DraggableNumberInput className={scalarInputClass} id="color-r" max={255} min={0} onValueChange={(value) => updateRgbColor("r", value)} step={1} value={colorInputs.r} /></div>
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-g">G</label><DraggableNumberInput className={scalarInputClass} id="color-g" max={255} min={0} onValueChange={(value) => updateRgbColor("g", value)} step={1} value={colorInputs.g} /></div>
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-b">B</label><DraggableNumberInput className={scalarInputClass} id="color-b" max={255} min={0} onValueChange={(value) => updateRgbColor("b", value)} step={1} value={colorInputs.b} /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-[0.35rem]" id="hsv-inputs">
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-h">H</label><DraggableNumberInput className={scalarInputClass} id="color-h" max={360} min={0} onValueChange={(value) => updateHsvColor("h", value)} step={1} value={colorInputs.h} /></div>
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-s">S</label><DraggableNumberInput className={scalarInputClass} id="color-s" max={100} min={0} onValueChange={(value) => updateHsvColor("s", value)} step={1} value={colorInputs.s} /></div>
                      <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-[#7dcfff]" htmlFor="color-v">V</label><DraggableNumberInput className={scalarInputClass} id="color-v" max={100} min={0} onValueChange={(value) => updateHsvColor("v", value)} step={1} value={colorInputs.v} /></div>
                    </div>
                  )}

                  <div className="mt-[0.55rem] flex items-center gap-[0.45rem] text-[0.72rem]">
                    <span className="text-[#565f89]">Alpha</span>
                    <input
                      className="flex-1 accent-[#7dcfff]"
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

                  <div className="mt-[0.55rem] flex items-center gap-[0.45rem] text-[0.72rem]">
                    <span className="text-[#565f89]">Hex</span>
                    <input
                      className={scalarInputClass}
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
            <div className="mt-[0.65rem] flex min-h-40 flex-col items-center justify-center gap-[0.35rem] p-0 text-center text-[0.78rem] text-[#565f89]" id="inspector-empty">
              <div className="text-2xl">◻</div>
              <div>Selecione um objeto para editar suas propriedades</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
