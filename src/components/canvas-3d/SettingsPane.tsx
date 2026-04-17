"use client";

import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";
import { type RenderMethod, type SettingsState } from "./types";

type SettingsPaneProps = {
  isOpen: boolean;
  settings: SettingsState;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onGridVisibleChange: (visible: boolean) => void;
  onAxesVisibleChange: (visible: boolean) => void;
  onWireframeVisibleChange: (visible: boolean) => void;
  onSnapEnabledChange: (enabled: boolean) => void;
  onSnapSizeChange: (size: number) => void;
  onBackgroundColorChange: (hex: string) => void;
  onGridColorChange: (hex: string) => void;
  onNearClipChange: (value: number) => void;
  onFarClipChange: (value: number) => void;
  onRenderMethodChange: (method: RenderMethod) => void;
};

type TweakpaneInfo = {
  pane: any;
  settingsObj: SettingsState;
  controllers: Record<string, any>;
};

export default function SettingsPane({
  isOpen,
  settings,
  panelRef,
  onGridVisibleChange,
  onAxesVisibleChange,
  onWireframeVisibleChange,
  onSnapEnabledChange,
  onSnapSizeChange,
  onBackgroundColorChange,
  onGridColorChange,
  onNearClipChange,
  onFarClipChange,
  onRenderMethodChange,
}: SettingsPaneProps) {
  const tweakpaneRef = useRef<TweakpaneInfo | null>(null);
  const tweakpaneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!tweakpaneContainerRef.current) return;

    try {
      const pane: any = new Pane({ container: tweakpaneContainerRef.current });

      const settingsObj: SettingsState = {
        gridVisible: settings.gridVisible,
        axesVisible: settings.axesVisible,
        wireframeVisible: settings.wireframeVisible,
        snapToGrid: settings.snapToGrid,
        snapSize: settings.snapSize,
        backgroundColor: settings.backgroundColor,
        gridColor: settings.gridColor,
        nearClip: settings.nearClip,
        farClip: settings.farClip,
        renderMethod: settings.renderMethod,
      };

      const controllers: Record<string, any> = {};

      const visualFolder = pane.addFolder({ title: "Visual" });
      const ClippingFolder = pane.addFolder({ title: "Clipping/Culling" });

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

      controllers.far = ClippingFolder.addInput(settingsObj, "farClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
      controllers.far.on("change", (ev: any) => onFarClipChange(ev.value));

      controllers.renderMethod = pane.addInput(settingsObj, "renderMethod", {
        label: "Render Method",
        options: {
          "Z-Buffer": "zbuffer",
          Painter: "painter",
          "Reverse Painter": "reversePainter",
        },
      });
      controllers.renderMethod.on("change", (ev: any) => onRenderMethodChange(ev.value));
      
      controllers.near = ClippingFolder.addInput(settingsObj, "nearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
      controllers.near.on("change", (ev: any) => onNearClipChange(ev.value));

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
      info.settingsObj.nearClip = settings.nearClip;
      info.settingsObj.farClip = settings.farClip;
      info.settingsObj.renderMethod = settings.renderMethod;

      info.controllers.grid.value = settings.gridVisible;
      info.controllers.axes.value = settings.axesVisible;
      info.controllers.wireframe.value = settings.wireframeVisible;
      info.controllers.snap.value = settings.snapToGrid;
      info.controllers.snapSize.value = settings.snapSize;
      info.controllers.bg.value = settings.backgroundColor;
      info.controllers.gridColor.value = settings.gridColor;
      info.controllers.near.value = settings.nearClip;
      info.controllers.far.value = settings.farClip;
      info.controllers.renderMethod.value = settings.renderMethod;
    } catch {
      // ignore if a controller does not expose .value
    }
  }, [
    settings.axesVisible,
    settings.backgroundColor,
    settings.farClip,
    settings.gridColor,
    settings.gridVisible,
    settings.nearClip,
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