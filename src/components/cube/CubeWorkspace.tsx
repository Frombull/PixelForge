"use client";

import Link from "next/link";
import { ArrowLeft, Box, House, Info } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { UI_THEME } from "../canvas-3d/types";

type CubeRuntime = {
  camera: THREE.PerspectiveCamera;
  currentCamera: THREE.Camera;
  edgeLines: THREE.LineSegments;
  material: THREE.MeshBasicMaterial;
  orthoCamera: THREE.OrthographicCamera;
  controls: OrbitControls;
  vertexSpheres: THREE.Group;
  wireframe: THREE.LineSegments;
};

type ToggleCardProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleCard({ checked, label, onChange }: ToggleCardProps) {
  return (
    <label
      className={`flex min-h-8.5 cursor-pointer items-center justify-between gap-2 rounded-[0.1rem] border px-2 py-1.5 text-[0.65rem] transition-colors duration-100 hover:border-[#474850] hover:bg-[#3e3f44] hover:text-white ${
        checked
          ? "border-[#474850] bg-[#3e3f44] text-white"
          : "border-[#2a2d3e] bg-(--ui-field-bg) text-(--ui-text)"
      }`}
    >
      <span>{label}</span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-[0.82rem] w-6 shrink-0 rounded-full border border-[#55565d] bg-[#25262b] transition-colors after:absolute after:left-[0.12rem] after:top-[0.12rem] after:h-[0.44rem] after:w-[0.44rem] after:rounded-full after:bg-[#797a81] after:content-[''] after:transition-all peer-checked:bg-[#55565d] peer-checked:after:translate-x-[0.68rem] peer-checked:after:bg-white" />
    </label>
  );
}

export default function CubeWorkspace() {
  const themeVars: CSSProperties = {
    "--ui-text": UI_THEME.text,
    "--ui-text-muted": UI_THEME.textMuted,
    "--ui-accent": UI_THEME.accent,
    "--ui-accent-soft": UI_THEME.accentSoft,
    "--ui-accent-active-bg": UI_THEME.accentActiveBg,
    "--ui-main-bg": UI_THEME.mainBg,
    "--ui-field-bg": UI_THEME.fieldBg,
    "--ui-button-pressed": UI_THEME.buttonPressed,
  } as CSSProperties;

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<CubeRuntime | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showEdges, setShowEdges] = useState(false);
  const [showVertices, setShowVertices] = useState(false);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isOrthographic, setIsOrthographic] = useState(false);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(UI_THEME.mainBg);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.classList.add("h-full", "w-full");
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 500);
    camera.position.set(5, 5, 5);

    const orthoCamera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.01, 1000);
    orthoCamera.position.set(5, 5, 5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 1;
    controls.maxDistance = 5;
    controls.minZoom = 1;
    controls.maxZoom = 3;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    const vertices = new Float32Array([
      -1, -1, -1,
      1, -1, -1,
      1, 1, -1,
      -1, 1, -1,
      -1, -1, 1,
      1, -1, 1,
      1, 1, 1,
      -1, 1, 1,
    ]);

    const vertexColors = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,
      0, 0, 1,
      1, 0, 1,
      1, 1, 1,
      0, 1, 1,
    ]);

    const indices = new Uint16Array([
      4, 5, 6, 4, 6, 7,
      1, 0, 3, 1, 3, 2,
      7, 6, 2, 7, 2, 3,
      0, 1, 5, 0, 5, 4,
      5, 1, 2, 5, 2, 6,
      0, 4, 7, 0, 7, 3,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(vertexColors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edgeLines = new THREE.LineSegments(edgesGeometry, edgeMaterial);
    edgeLines.visible = false;
    cube.add(edgeLines);

    const wireframeGeometry = edgesGeometry.clone();
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.visible = false;
    cube.add(wireframe);

    const vertexSpheres = new THREE.Group();
    const vertexData: Array<{ position: [number, number, number]; color: [number, number, number] }> = [
      { position: [-1, -1, -1], color: [0, 0, 0] },
      { position: [1, -1, -1], color: [1, 0, 0] },
      { position: [1, 1, -1], color: [1, 1, 0] },
      { position: [-1, 1, -1], color: [0, 1, 0] },
      { position: [-1, -1, 1], color: [0, 0, 1] },
      { position: [1, -1, 1], color: [1, 0, 1] },
      { position: [1, 1, 1], color: [1, 1, 1] },
      { position: [-1, 1, 1], color: [0, 1, 1] },
    ];

    vertexData.forEach(({ position, color }) => {
      const sphereGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(...color) });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(...position);
      vertexSpheres.add(sphere);
    });
    vertexSpheres.visible = false;
    scene.add(vertexSpheres);

    const runtime: CubeRuntime = {
      camera,
      controls,
      currentCamera: camera,
      edgeLines,
      material,
      orthoCamera,
      vertexSpheres,
      wireframe,
    };
    runtimeRef.current = runtime;

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;

      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      orthoCamera.left = -3 * aspect;
      orthoCamera.right = 3 * aspect;
      orthoCamera.top = 3;
      orthoCamera.bottom = -3;
      orthoCamera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const handleControlsStart = () => {
      controls.autoRotate = false;
    };
    controls.addEventListener("start", handleControlsStart);

    let animationFrameId = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, runtime.currentCamera);
      animationFrameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.removeEventListener("start", handleControlsStart);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      edgesGeometry.dispose();
      edgeMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      vertexSpheres.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose());
        else object.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isInfoOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsInfoOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isInfoOpen]);

  const updateEdges = (visible: boolean) => {
    setShowEdges(visible);
    if (runtimeRef.current) runtimeRef.current.edgeLines.visible = visible;
  };

  const updateVertices = (visible: boolean) => {
    setShowVertices(visible);
    if (runtimeRef.current) runtimeRef.current.vertexSpheres.visible = visible;
  };

  const updateWireframe = (visible: boolean) => {
    setIsWireframe(visible);
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.wireframe.visible = visible;
    runtime.material.wireframe = visible;
    if (visible) {
      setShowVertices(false);
      runtime.vertexSpheres.visible = false;
    }
  };

  const updateProjection = (orthographic: boolean) => {
    setIsOrthographic(orthographic);
    const runtime = runtimeRef.current;
    if (!runtime) return;

    if (orthographic) {
      runtime.orthoCamera.position.copy(runtime.camera.position);
      runtime.orthoCamera.quaternion.copy(runtime.camera.quaternion);
      runtime.currentCamera = runtime.orthoCamera;
      runtime.controls.object = runtime.orthoCamera;
    } else {
      runtime.camera.position.copy(runtime.orthoCamera.position);
      runtime.camera.quaternion.copy(runtime.orthoCamera.quaternion);
      runtime.currentCamera = runtime.camera;
      runtime.controls.object = runtime.camera;
    }
    runtime.controls.update();
  };

  const resetCamera = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.camera.position.set(5, 5, 5);
    runtime.orthoCamera.position.set(5, 5, 5);
    runtime.orthoCamera.zoom = 1;
    runtime.orthoCamera.updateProjectionMatrix();
    runtime.controls.target.set(0, 0, 0);
    runtime.controls.autoRotate = true;
    runtime.controls.update();
  };

  const panelHeaderClass = "mb-2 text-[0.68rem] uppercase tracking-[0.08em] text-(--ui-accent)";
  const toolbarButtonClass = "inline-flex h-6.5 min-w-6.5 cursor-pointer items-center justify-center rounded-[0.1rem] border border-transparent bg-black/15 px-1.5 text-[0.64rem] text-white transition-colors duration-100 hover:border-[#474850] hover:bg-[#3e3f44] active:bg-(--ui-button-pressed)";

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-(--ui-main-bg) font-mono text-(--ui-text) max-sm:flex-col" style={themeVars}>
      <aside
        className="relative z-20 flex h-full w-75 shrink-0 flex-col overflow-hidden border-r border-[#2a2d3e] bg-[#202126] max-sm:h-auto max-sm:w-full max-sm:border-b max-sm:border-r-0"
        id="cube-sidebar"
      >
        <header className="flex h-14.5 w-75 shrink-0 items-center gap-2.5 border-b border-[#2a2d3e] p-2 max-sm:w-full">
          <Link
            aria-label="Voltar para a página inicial"
            className="inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[0.1rem] border border-[#2a2d3e] bg-(--ui-field-bg) text-(--ui-accent) transition-colors hover:border-[#474850] hover:bg-[#3e3f44]"
            href="/"
            title="Voltar para a página inicial"
          >
            <ArrowLeft aria-hidden="true" size={15} />
          </Link>

          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="truncate text-[0.8rem] font-semibold tracking-[0.02em] text-white">Cubo RGB</h1>
          </div>
        </header>

        <div className="flex min-h-0 w-75 flex-1 flex-col max-sm:h-auto max-sm:w-full" id="cube-sidebar-content">
          <div className="min-h-0 flex-1 overflow-y-auto px-2">
            <section className="border-b border-[#2a2d3e] py-3" aria-labelledby="cube-view-heading">
              <h2 className={panelHeaderClass} id="cube-view-heading">Visualização</h2>
              <div className="grid grid-cols-1 gap-1.5">
                <ToggleCard checked={showEdges} label="Arestas" onChange={updateEdges} />
                <ToggleCard checked={isWireframe} label="Wireframe" onChange={updateWireframe} />
                <ToggleCard checked={showVertices} label="Vértices" onChange={updateVertices} />
                <ToggleCard checked={isOrthographic} label="Câmera ortográfica" onChange={updateProjection} />
              </div>
            </section>

          </div>
        </div>

        <div className="border-t border-[#2a2d3e] px-2 py-3">
          <button
            className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.1rem] border border-[#474850] bg-(--ui-field-bg) px-3 text-[0.78rem] font-medium uppercase tracking-[0.08em] text-white transition-colors duration-100 hover:bg-[#3e3f44] active:bg-(--ui-button-pressed)"
            onClick={resetCamera}
            title="Resetar câmera"
            type="button"
          >
            <House aria-hidden="true" size={16} />
            Resetar câmera
          </button>
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden bg-(--ui-main-bg)" aria-label="Visualização tridimensional do cubo RGB">
        <div className="absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" ref={canvasContainerRef} />

        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <strong className="text-[0.62rem] font-medium uppercase tracking-[0.06em] text-white">Espaço RGB</strong>
        </div>

        <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5" aria-label="Ferramentas da visualização">
          <button
            aria-expanded={isInfoOpen}
            aria-label={isInfoOpen ? "Ocultar controles" : "Mostrar controles"}
            className={`${toolbarButtonClass} ${isInfoOpen ? "border-[#474850] bg-[#3e3f44]" : ""}`}
            onClick={() => setIsInfoOpen((current) => !current)}
            title="Controles"
            type="button"
          >
            <Info aria-hidden="true" size={14} />
          </button>
        </div>

        {isInfoOpen && (
          <section className="absolute right-2 top-10 z-20 w-69 rounded-[0.1rem] border border-[#474850] bg-[#202126]/90 p-2.5 text-[0.58rem] shadow-xl backdrop-blur-md max-sm:w-[calc(100%-3.75rem)]" aria-label="Controles da câmera">
            <div className={`${panelHeaderClass} mb-1.5`}>Controles</div>
            <div className="grid min-h-7 grid-cols-[1fr_auto] items-center gap-2 text-(--ui-text)"><span>Rodar câmera</span><kbd className="rounded-[0.1rem] border border-[#474850] px-1.5 py-0.5 text-[0.5rem] text-(--ui-text-muted)">Arrastar</kbd></div>
            <div className="grid min-h-7 grid-cols-[1fr_auto] items-center gap-2 text-(--ui-text)"><span>Zoom</span><kbd className="rounded-[0.1rem] border border-[#474850] px-1.5 py-0.5 text-[0.5rem] text-(--ui-text-muted)">Scroll</kbd></div>
            <div className="grid min-h-7 grid-cols-[1fr_auto] items-center gap-2 text-(--ui-text)"><span>Mover câmera</span><kbd className="rounded-[0.1rem] border border-[#474850] px-1.5 py-0.5 text-[0.5rem] text-(--ui-text-muted)">Botão direito</kbd></div>
          </section>
        )}
      </main>
    </div>
  );
}
