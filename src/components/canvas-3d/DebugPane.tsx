"use client";

import { useEffect, useRef } from "react";
import { Pane } from "tweakpane";
import { type Canvas3DState } from "./types";

type Props = {
  engineState: Canvas3DState;
  className?: string;
};

export default function DebugPane({ engineState, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<any>(null);
  const debugObjRef = useRef<any>(null);
  const controllersRef = useRef<Record<string, any> | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestStateRef = useRef<Canvas3DState>(engineState);
  const lastTsRef = useRef<number | null>(null);
  const fpsRef = useRef<number>(0);

  const formatCoord = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;
  const formatCameraPos = (x: number, y: number, z: number) => `${formatCoord(x)}, ${formatCoord(y)}, ${formatCoord(z)}`;

  useEffect(() => {
    latestStateRef.current = engineState;
  }, [engineState]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const pane: any = new Pane({ container: containerRef.current, title: "Debug", expanded: false });

      const s = latestStateRef.current;
      const debugObj = {
        mode: s.mode,
        selectedUuid: s.selectedUuid ?? "",
        selectedName: s.selected?.name ?? "",
        objectsCount: Math.trunc(s.objects.length),
        isOrthographic: s.isOrthographic,
        isCullingViewEnabled: s.isCullingViewEnabled,
        fps: 0,
        cameraPos: formatCameraPos(s.cameraPosition.x ?? 0, s.cameraPosition.y ?? 0, s.cameraPosition.z ?? 0),
      };

      const controllers: Record<string, any> = {};

      controllers.mode = pane.addMonitor(debugObj, "mode", { label: "Mode" });
      controllers.selectedUuid = pane.addMonitor(debugObj, "selectedUuid", { label: "Selected UUID" });
      controllers.selectedName = pane.addMonitor(debugObj, "selectedName", { label: "Selected Name" });
      controllers.objectsCount = pane.addMonitor(debugObj, "objectsCount", { label: "Objects" });
      controllers.isOrthographic = pane.addMonitor(debugObj, "isOrthographic", { label: "Orthographic" });
      controllers.isCullingViewEnabled = pane.addMonitor(debugObj, "isCullingViewEnabled", { label: "Culling View" });
      controllers.cameraPos = pane.addMonitor(debugObj, "cameraPos", { label: "Camera XYZ" });
      controllers.fps = pane.addMonitor(debugObj, "fps", { label: "FPS" });
      controllers.fpsGraph = pane.addMonitor(debugObj, "fps", {
        label: "FPS Graph",
        view: "graph",
        min: 0,
        max: 200,
        interval: 200,
      });

      paneRef.current = pane;
      debugObjRef.current = debugObj;
      controllersRef.current = controllers;

      function tick(ts?: number) {
        if (ts == null) ts = performance.now();
        const latest = latestStateRef.current;
        const info = debugObjRef.current;
        if (!info) return;

        info.mode = latest.mode;
        info.selectedUuid = latest.selectedUuid ?? "";
        info.selectedName = latest.selected?.name ?? "";
        info.objectsCount = Math.trunc(latest.objects.length);
        info.isOrthographic = latest.isOrthographic;
        info.isCullingViewEnabled = latest.isCullingViewEnabled;

        const bridgeState = window.Canvas3DBridge?.getState?.();
        const cameraPosition = bridgeState?.cameraPosition ?? latest.cameraPosition;
        info.cameraPos = formatCameraPos(cameraPosition?.x ?? 0, cameraPosition?.y ?? 0, cameraPosition?.z ?? 0);

        if (lastTsRef.current) {
          const dt = ts - lastTsRef.current;
          const inst = dt > 0 ? 1000 / dt : 0;
          fpsRef.current = fpsRef.current ? fpsRef.current * 0.85 + inst * 0.15 : inst;
        }
        info.fps = Math.round(fpsRef.current);
        lastTsRef.current = ts;

        try {
          const ctr = controllersRef.current;
          if (ctr) {
            if (ctr.mode) ctr.mode.value = info.mode;
            if (ctr.selectedUuid) ctr.selectedUuid.value = info.selectedUuid;
            if (ctr.selectedName) ctr.selectedName.value = info.selectedName;
            if (ctr.objectsCount) ctr.objectsCount.value = info.objectsCount;
            if (ctr.isOrthographic) ctr.isOrthographic.value = info.isOrthographic;
            if (ctr.isCullingViewEnabled) ctr.isCullingViewEnabled.value = info.isCullingViewEnabled;
            if (ctr.cameraPos) ctr.cameraPos.value = info.cameraPos;
            if (ctr.fps) ctr.fps.value = info.fps;
          }
        } catch (e) {
          // ignore
        }

        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize Debug Tweakpane", err);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (paneRef.current) {
        try {
          paneRef.current.dispose?.();
        } catch (e) {
          /* ignore */
        }
        paneRef.current = null;
      }
      debugObjRef.current = null;
      controllersRef.current = null;
      lastTsRef.current = null;
    };
  }, []);

  return (
    <div className={`${className ?? ""}`} onClick={(e) => e.stopPropagation()}>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
