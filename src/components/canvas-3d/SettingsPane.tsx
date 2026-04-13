"use client";

import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";

type SettingsState = {
  gridVisible: boolean;
  axesVisible: boolean;
  wireframeVisible: boolean;
  snapToGrid: boolean;
  snapSize: number;
  backgroundColor: string;
  gridColor: string;
  nearClip: number;
  farClip: number;
};

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
}: SettingsPaneProps) {
  const tweakpaneRef = useRef<TweakpaneInfo | null>(null);
  const tweakpaneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!tweakpaneContainerRef.current) return;

    try {
      const pane: any = new Pane({ container: tweakpaneContainerRef.current, title: "Configurações" });

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
      };

      const controllers: Record<string, any> = {};

      controllers.grid = pane.addInput(settingsObj, "gridVisible", { label: "Mostrar Grid" });
      controllers.grid.on("change", (ev: any) => onGridVisibleChange(ev.value));

      controllers.axes = pane.addInput(settingsObj, "axesVisible", { label: "Mostrar Eixos" });
      controllers.axes.on("change", (ev: any) => onAxesVisibleChange(ev.value));

      controllers.wireframe = pane.addInput(settingsObj, "wireframeVisible", { label: "Show Wireframe" });
      controllers.wireframe.on("change", (ev: any) => onWireframeVisibleChange(ev.value));

      controllers.snap = pane.addInput(settingsObj, "snapToGrid", { label: "Snap to Grid" });
      controllers.snap.on("change", () => onSnapEnabledChange(settingsObj.snapToGrid));

      controllers.snapSize = pane.addInput(settingsObj, "snapSize", { min: 0.1, max: 10, step: 0.1, label: "Snap Size" });
      controllers.snapSize.on("change", (ev: any) => onSnapSizeChange(ev.value));

      controllers.bg = pane.addInput(settingsObj, "backgroundColor", { view: "color", label: "Background" });
      controllers.bg.on("change", (ev: any) => onBackgroundColorChange(ev.value));

      controllers.gridColor = pane.addInput(settingsObj, "gridColor", { view: "color", label: "Grid Color" });
      controllers.gridColor.on("change", (ev: any) => onGridColorChange(ev.value));

      controllers.far = pane.addInput(settingsObj, "farClip", { min: 5, max: 50, step: 1, label: "Far Clip" });
      controllers.far.on("change", (ev: any) => onFarClipChange(ev.value));
      
      controllers.near = pane.addInput(settingsObj, "nearClip", { min: 0.01, max: 5, step: 0.01, label: "Near Clip" });
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
  }, [
    isOpen,
    onAxesVisibleChange,
    onBackgroundColorChange,
    onFarClipChange,
    onGridColorChange,
    onGridVisibleChange,
    onNearClipChange,
    onSnapEnabledChange,
    onSnapSizeChange,
    onWireframeVisibleChange,
    settings.axesVisible,
    settings.backgroundColor,
    settings.farClip,
    settings.gridColor,
    settings.gridVisible,
    settings.nearClip,
    settings.snapSize,
    settings.snapToGrid,
    settings.wireframeVisible,
  ]);

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

      info.controllers.grid.value = settings.gridVisible;
      info.controllers.axes.value = settings.axesVisible;
      info.controllers.wireframe.value = settings.wireframeVisible;
      info.controllers.snap.value = settings.snapToGrid;
      info.controllers.snapSize.value = settings.snapSize;
      info.controllers.bg.value = settings.backgroundColor;
      info.controllers.gridColor.value = settings.gridColor;
      info.controllers.near.value = settings.nearClip;
      info.controllers.far.value = settings.farClip;
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