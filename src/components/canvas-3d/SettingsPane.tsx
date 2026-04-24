"use client";

import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";
import { CAMERA_CONFIG, CAMERA_PROJECTION_DEFAULTS } from "../../../public/canvas-3d/utils/constants";
import { type CameraProjection, type ProjectionCameraSettings, type RenderMethod, type SettingsState } from "./types";

type SettingsPaneProps = {
  isOpen: boolean;
  settings: SettingsState;
  cameraSettings: ProjectionCameraSettings;
  cameraProjection: CameraProjection;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onGridVisibleChange: (visible: boolean) => void;
  onAxesVisibleChange: (visible: boolean) => void;
  onWireframeVisibleChange: (visible: boolean) => void;
  onSnapEnabledChange: (enabled: boolean) => void;
  onSnapSizeChange: (size: number) => void;
  onBackgroundColorChange: (hex: string) => void;
  onGridColorChange: (hex: string) => void;
  onFovChange: (projection: CameraProjection, value: number) => void;
  onNearClipChange: (projection: CameraProjection, value: number) => void;
  onFarClipChange: (projection: CameraProjection, value: number) => void;
  onOrthoZoomChange: (value: number) => void;
  onCameraProjectionChange: (projection: CameraProjection) => void;
  onRenderMethodChange: (method: RenderMethod) => void;
};

type SettingsPaneState = SettingsState & {
  perspectiveFov: number;
  perspectiveNearClip: number;
  perspectiveFarClip: number;
  ortographicNearClip: number;
  ortographicFarClip: number;
  paniniFov: number;
  paniniNearClip: number;
  paniniFarClip: number;
  ortographicZoom: number;
  paniniStrength: number;
};

type TweakpaneInfo = {
  pane: any;
  settingsObj: SettingsPaneState;
  controllers: Record<string, any>;
};

export default function SettingsPane({
  isOpen,
  settings,
  cameraSettings,
  cameraProjection,
  panelRef,
  onGridVisibleChange,
  onAxesVisibleChange,
  onWireframeVisibleChange,
  onSnapEnabledChange,
  onSnapSizeChange,
  onBackgroundColorChange,
  onGridColorChange,
  onFovChange,
  onNearClipChange,
  onFarClipChange,
  onOrthoZoomChange,
  onCameraProjectionChange,
  onRenderMethodChange,
}: SettingsPaneProps) {
  const tweakpaneRef = useRef<TweakpaneInfo | null>(null);
  const tweakpaneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!tweakpaneContainerRef.current) return;

    try {
      const pane: any = new Pane({ container: tweakpaneContainerRef.current });

      const settingsObj: SettingsPaneState = {
        gridVisible: settings.gridVisible,
        axesVisible: settings.axesVisible,
        wireframeVisible: settings.wireframeVisible,
        snapToGrid: settings.snapToGrid,
        snapSize: settings.snapSize,
        backgroundColor: settings.backgroundColor,
        gridColor: settings.gridColor,
        nearClip: Number.isFinite(settings.nearClip) ? settings.nearClip : CAMERA_CONFIG.near,
        farClip: Number.isFinite(settings.farClip) ? settings.farClip : CAMERA_CONFIG.far,
        orthoZoom: Number.isFinite(settings.orthoZoom) ? settings.orthoZoom : CAMERA_PROJECTION_DEFAULTS.orthographic.zoom,
        renderMethod: settings.renderMethod,
        fov: Number.isFinite(settings.fov) ? settings.fov : CAMERA_CONFIG.fov,
        perspectiveFov: cameraSettings.perspective.fov,
        perspectiveNearClip: cameraSettings.perspective.nearClip,
        perspectiveFarClip: cameraSettings.perspective.farClip,
        ortographicNearClip: cameraSettings.ortographic.nearClip,
        ortographicFarClip: cameraSettings.ortographic.farClip,
        ortographicZoom: cameraSettings.ortographic.zoom,
        paniniFov: cameraSettings.panini.fov,
        paniniNearClip: cameraSettings.panini.nearClip,
        paniniFarClip: cameraSettings.panini.farClip,
        paniniStrength: CAMERA_PROJECTION_DEFAULTS.panini.strength,
      };

      const controllers: Record<string, any> = {};

      const visualFolder = pane.addFolder({ title: "Visual" });
      const cameraFolder = pane.addFolder({ title: "Camera" });

      controllers.grid = visualFolder.addInput(settingsObj, "gridVisible", { label: "Grid" });
      controllers.grid.on("change", (ev: any) => onGridVisibleChange(ev.value));

      controllers.axes = visualFolder.addInput(settingsObj, "axesVisible", { label: "Eixos" });
      controllers.axes.on("change", (ev: any) => onAxesVisibleChange(ev.value));

      controllers.wireframe = visualFolder.addInput(settingsObj, "wireframeVisible", { label: "Wireframe" });
      controllers.wireframe.on("change", (ev: any) => onWireframeVisibleChange(ev.value));

      controllers.bg = visualFolder.addInput(settingsObj, "backgroundColor", { view: "color", label: "Cor do Background" });
      controllers.bg.on("change", (ev: any) => onBackgroundColorChange(ev.value));

      controllers.gridColor = visualFolder.addInput(settingsObj, "gridColor", { view: "color", label: "Cor do Grid" });
      controllers.gridColor.on("change", (ev: any) => onGridColorChange(ev.value));

      controllers.snap = pane.addInput(settingsObj, "snapToGrid", { label: "Snap to Grid" });
      controllers.snap.on("change", () => onSnapEnabledChange(settingsObj.snapToGrid));

      controllers.snapSize = pane.addInput(settingsObj, "snapSize", { min: 0.1, max: 1, step: 0.1, label: "Snap Size" });
      controllers.snapSize.on("change", (ev: any) => onSnapSizeChange(ev.value));

      const cameraTabs = cameraFolder.addTab({
        pages: [
          { title: "Perspective" },
          { title: "Ortographic" },
          { title: "Panini" },
        ],
      });
      const projectionByIndex: CameraProjection[] = ["perspective", "ortographic", "panini"];
      const selectedTabIndex = projectionByIndex.indexOf(cameraProjection);
      if (selectedTabIndex >= 0) {
        cameraTabs.pages[selectedTabIndex].selected = true;
      }
      cameraTabs.on("select", (ev: any) => {
        const projection = projectionByIndex[ev.index] ?? "perspective";
        onCameraProjectionChange(projection);
      });
      controllers.cameraTabs = cameraTabs;

      const perspectiveTab = cameraTabs.pages[0];
      const ortographicTab = cameraTabs.pages[1];
      const paniniTab = cameraTabs.pages[2];

      controllers.fov = perspectiveTab.addInput(settingsObj, "perspectiveFov", { min: 10, max: 120, step: 1, label: "FOV" });
      controllers.fov.on("change", (ev: any) => onFovChange("perspective", ev.value));

      controllers.near = perspectiveTab.addInput(settingsObj, "perspectiveNearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
      controllers.near.on("change", (ev: any) => onNearClipChange("perspective", ev.value));

      controllers.far = perspectiveTab.addInput(settingsObj, "perspectiveFarClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
      controllers.far.on("change", (ev: any) => onFarClipChange("perspective", ev.value));

      controllers.orthoNear = ortographicTab.addInput(settingsObj, "ortographicNearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
      controllers.orthoNear.on("change", (ev: any) => onNearClipChange("ortographic", ev.value));

      controllers.orthoFar = ortographicTab.addInput(settingsObj, "ortographicFarClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
      controllers.orthoFar.on("change", (ev: any) => onFarClipChange("ortographic", ev.value));

      controllers.orthoZoom = ortographicTab.addInput(settingsObj, "ortographicZoom", {
        min: CAMERA_PROJECTION_DEFAULTS.orthographic.zoomMin,
        max: CAMERA_PROJECTION_DEFAULTS.orthographic.zoomMax,
        step: 0.1,
        label: "Zoom",
      });
      controllers.orthoZoom.on("change", (ev: any) => onOrthoZoomChange(ev.value));

      controllers.paniniFov = paniniTab.addInput(settingsObj, "paniniFov", { min: 10, max: 120, step: 1, label: "FOV" });
      controllers.paniniFov.on("change", (ev: any) => onFovChange("panini", ev.value));

      controllers.paniniNear = paniniTab.addInput(settingsObj, "paniniNearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
      controllers.paniniNear.on("change", (ev: any) => onNearClipChange("panini", ev.value));

      controllers.paniniFar = paniniTab.addInput(settingsObj, "paniniFarClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
      controllers.paniniFar.on("change", (ev: any) => onFarClipChange("panini", ev.value));

      controllers.paniniStrength = paniniTab.addInput(settingsObj, "paniniStrength", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Strength (UI)",
      });

      controllers.renderMethod = cameraFolder.addInput(settingsObj, "renderMethod", {
        label: "Render Method",
        options: {
          "Z-Buffer": "zbuffer",
          Painter: "painter",
          "Reverse Painter": "reversePainter",
        },
      });
      controllers.renderMethod.on("change", (ev: any) => onRenderMethodChange(ev.value));
      
      tweakpaneRef.current = { pane, settingsObj, controllers };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize Tweakpane", err);
    }

    return () => {
      if (tweakpaneRef.current?.pane) {
        try {
          tweakpaneRef.current.pane.dispose?.();
        } catch {
          // ignore cleanup failures
        }
        tweakpaneRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!tweakpaneRef.current) return;

    const info = tweakpaneRef.current;

    try {
      info.settingsObj.gridVisible = settings.gridVisible;
      info.settingsObj.axesVisible = settings.axesVisible;
      info.settingsObj.wireframeVisible = settings.wireframeVisible;
      info.settingsObj.snapToGrid = settings.snapToGrid;
      info.settingsObj.snapSize = settings.snapSize;
      info.settingsObj.backgroundColor = settings.backgroundColor;
      info.settingsObj.gridColor = settings.gridColor;
      info.settingsObj.orthoZoom = settings.orthoZoom;
      info.settingsObj.perspectiveFov = cameraSettings.perspective.fov;
      info.settingsObj.perspectiveNearClip = cameraSettings.perspective.nearClip;
      info.settingsObj.perspectiveFarClip = cameraSettings.perspective.farClip;
      info.settingsObj.ortographicNearClip = cameraSettings.ortographic.nearClip;
      info.settingsObj.ortographicFarClip = cameraSettings.ortographic.farClip;
      info.settingsObj.ortographicZoom = cameraSettings.ortographic.zoom;
      info.settingsObj.paniniFov = cameraSettings.panini.fov;
      info.settingsObj.paniniNearClip = cameraSettings.panini.nearClip;
      info.settingsObj.paniniFarClip = cameraSettings.panini.farClip;
      info.settingsObj.renderMethod = settings.renderMethod;

      const projectionByIndex: CameraProjection[] = ["perspective", "ortographic", "panini"];
      const selectedTabIndex = projectionByIndex.indexOf(cameraProjection);
      if (selectedTabIndex >= 0 && info.controllers.cameraTabs?.pages?.[selectedTabIndex]) {
        info.controllers.cameraTabs.pages[selectedTabIndex].selected = true;
      }

      info.controllers.grid.value = settings.gridVisible;
      info.controllers.axes.value = settings.axesVisible;
      info.controllers.wireframe.value = settings.wireframeVisible;
      info.controllers.snap.value = settings.snapToGrid;
      info.controllers.snapSize.value = settings.snapSize;
      info.controllers.bg.value = settings.backgroundColor;
      info.controllers.gridColor.value = settings.gridColor;
      info.controllers.fov.value = cameraSettings.perspective.fov;
      info.controllers.near.value = cameraSettings.perspective.nearClip;
      info.controllers.far.value = cameraSettings.perspective.farClip;
      info.controllers.orthoNear.value = cameraSettings.ortographic.nearClip;
      info.controllers.orthoFar.value = cameraSettings.ortographic.farClip;
      info.controllers.orthoZoom.value = cameraSettings.ortographic.zoom;
      info.controllers.paniniFov.value = cameraSettings.panini.fov;
      info.controllers.paniniNear.value = cameraSettings.panini.nearClip;
      info.controllers.paniniFar.value = cameraSettings.panini.farClip;
      info.controllers.renderMethod.value = settings.renderMethod;
    } catch {
      // ignore if a controller does not expose .value
    }
  }, [
    settings.axesVisible,
    cameraSettings,
    cameraProjection,
    settings.backgroundColor,
    settings.gridColor,
    settings.gridVisible,
    settings.renderMethod,
    settings.snapSize,
    settings.snapToGrid,
    settings.wireframeVisible,
  ]);

  return (
    <div
      className={`absolute right-3 top-[2.65rem] z-60 w-72 rounded-[0.2rem] ${isOpen ? "" : "hidden"}`}
      ref={panelRef}
    >
      <div className="px-2 py-2">
        <div className="w-full" ref={tweakpaneContainerRef} />
      </div>
    </div>
  );
}