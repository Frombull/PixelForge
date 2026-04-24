export type Canvas3DMode = "translate" | "scale" | "rotate" | "skew";

export type RenderMethod = "zbuffer" | "painter" | "reversePainter";

export type CameraProjection = "perspective" | "ortographic" | "panini";

export type ProjectionCameraSettings = {
  perspective: {
    fov: number;
    nearClip: number;
    farClip: number;
  };
  ortographic: {
    nearClip: number;
    farClip: number;
    zoom: number;
  };
  panini: {
    fov: number;
    nearClip: number;
    farClip: number;
  };
};

export type CanvasObjectKind = "cube" | "cylinder" | "subtractCube" | "zFighting";

export type Canvas3DObjectState = {
  uuid: string;
  name: string;
  type: string;
};

export type NumericVec3 = {
  x: number;
  y: number;
  z: number;
};

export type SkewState = {
  xy: number;
  xz: number;
  yx: number;
  yz: number;
  zx: number;
  zy: number;
};

export type MaterialState = {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  alpha: number;
};

export type SelectedObjectState = {
  uuid: string;
  name: string;
  position: NumericVec3;
  scale: NumericVec3;
  rotation: NumericVec3;
  skew: SkewState;
  material: MaterialState;
};

export type SettingsState = {
  gridVisible: boolean;
  axesVisible: boolean;
  wireframeVisible: boolean;
  snapToGrid: boolean;
  snapSize: number;
  backgroundColor: string;
  gridColor: string;
  fov: number;
  nearClip: number;
  farClip: number;
  orthoZoom: number;
  renderMethod: RenderMethod;
};

export type Canvas3DState = {
  mode: Canvas3DMode;
  isOrthographic: boolean;
  isCullingViewEnabled: boolean;
  selectedUuid: string | null;
  objects: Canvas3DObjectState[];
  selected: SelectedObjectState | null;
  settings: SettingsState;
};

export type Canvas3DStatus = "loading" | "ready" | "error";

export const EMPTY_STATE: Canvas3DState = {
  mode: "translate",
  isOrthographic: false,
  isCullingViewEnabled: false,
  selectedUuid: null,
  objects: [],
  selected: null,
  settings: {
    gridVisible: true,
    axesVisible: true,
    wireframeVisible: false,
    snapToGrid: false,
    snapSize: 0.5,
    backgroundColor: "#ffffff",
    gridColor: "#bbbbbb",
    fov: 60,
    nearClip: 0.01,
    farClip: 100,
    orthoZoom: 1,
    renderMethod: "zbuffer",
  },
};

export type ColorMode = "rgb" | "hsv";

export type ColorInputState = {
  hex: string;
  alpha: number;
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  v: number;
};

export const EMPTY_COLOR_INPUTS: ColorInputState = {
  hex: "#ffffff",
  alpha: 100,
  r: 255,
  g: 255,
  b: 255,
  h: 0,
  s: 0,
  v: 100,
};

export const UI_THEME = {
  text: "rgb(187,188,196)",
  textMuted: "rgb(121,122,129)",
  accent: "rgb(187,188,196)",
  accentSoft: "rgba(173,175,184,0.12)",
  accentActiveBg: "rgb(62,63,68)",
  mainBg: "rgb(40,41,46)",
  fieldBg: "rgb(55,56,61)",
  collapseHeaderBg: "rgb(55,56,61)",
  buttonPressed: "rgb(77,78,83)",
} as const;

export type Canvas3DBridge = {
  mount: () => unknown;
  unmount: () => void;
  getState: () => Canvas3DState | null;

  addObject: (kind: CanvasObjectKind) => void;
  setMode: (mode: Canvas3DMode) => void;

  selectObject: (uuid: string) => void;
  focusObject: (uuid: string) => void;
  deleteSelected: () => void;
  deleteObject: (uuid: string) => void;

  resetCamera: () => void;
  toggleCameraType: () => boolean | undefined;
  setCameraProjection: (projection: CameraProjection) => CameraProjection | undefined;
  toggleCullingView: () => boolean | undefined;

  setGridVisible: (visible: boolean) => void;
  setAxesVisible: (visible: boolean) => void;
  setWireframeVisible: (visible: boolean) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setSnapSize: (size: number) => void;
  setBackgroundColor: (hex: string) => void;
  setGridColor: (hex: string) => void;
  setFov: (value: number, projection?: CameraProjection) => void;
  setNearClip: (value: number, projection?: CameraProjection) => void;
  setFarClip: (value: number, projection?: CameraProjection) => void;
  setOrthoZoom: (value: number) => void;
  setRenderMethod: (method: RenderMethod) => void;
  resetSetting: (target: "snap-size" | "near-clip" | "far-clip" | "fov") => void;

  updateSelectedTransform: (field: string, value: number) => void;
  resetTransformField: (target: string) => void;
  setSelectedColorHex: (hex: string) => void;
  setSelectedColorHSV: (h: number, s: number, v: number) => void;
  setSelectedAlpha: (alphaPercent: number) => void;
};

declare global {
  interface WindowEventMap {
    "canvas3d:state": CustomEvent<Canvas3DState>;
  }

  interface Window {
    Canvas3DBridge?: Canvas3DBridge;
  }
}
