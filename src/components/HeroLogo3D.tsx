"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const FACE_COLORS = [
  "#526980",
  "#2f3f52",
  "#7088a1",
  "#1c2633",
  "#4a6178",
  "#395064",
];

const DEV_FONT_STACK =
  '"Cascadia Code", "Fira Code", "Source Code Pro", "Consolas", "DejaVu Sans Mono", "Liberation Mono", "Courier New", monospace';

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;

  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createFaceTexture(baseColor: string, includeText: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, 256, 256);
  context.fillStyle = hexToRgba(baseColor, 0.3);
  context.fillRect(0, 0, 256, 256);

  context.strokeStyle = "rgba(10, 16, 24, 0.28)";
  context.lineWidth = 1;

  const gridCells = 16;
  const cellSize = 256 / gridCells;

  for (let index = 0; index <= gridCells; index += 1) {
    const position = index * cellSize;

    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, 256);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(256, position);
    context.stroke();
  }

  if (includeText) {
    context.fillStyle = "#f8fbff";
    context.strokeStyle = "#0f1722";
    context.lineJoin = "round";
    context.lineWidth = 10;
    context.font = `900 156px ${DEV_FONT_STACK}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.strokeText("3D", 128, 130);
    context.fillText("3D", 128, 130);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function HeroLogo3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  // Tracks mouse position and whether the pointer is over the cube
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  // Y angle that accumulates slowly during idle; synced on leave so rotation resumes seamlessly
  const idleYRef = useRef(0.55);
  // Saved cube rotation + pointer position at the moment hover begins
  const hoverBaseRef = useRef({ rotX: 0.45, rotY: 0.55, px: 0, py: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const parent = canvas.parentElement;

    if (!parent) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 5.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const faceTexturesWithText = FACE_COLORS.map((color) => createFaceTexture(color, true));
    const faceTexturesNoText = FACE_COLORS.map((color) => createFaceTexture(color, false));
    const materials = faceTexturesWithText.map(
      (texture) =>
        new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          opacity: 0.5,
          metalness: 0.3,
          roughness: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
    );

    // BoxGeometry material index order: +X, -X, +Y, -Y, +Z, -Z
    const localFaceNormals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];

    const worldNormal = new THREE.Vector3();
    const toCamera = new THREE.Vector3();
    const cubeWorldPosition = new THREE.Vector3();
    const faceCenterOffset = new THREE.Vector3();
    const faceCenterWorld = new THREE.Vector3();

    const geometry = new THREE.BoxGeometry(2.05, 2.05, 2.05);
    const cube = new THREE.Mesh(geometry, materials);
    cube.rotation.set(0.45, 0.55, 0.05);
    scene.add(cube);

    const edges = new THREE.EdgesGeometry(geometry);
    const wireframe = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: 0xe9f1fb,
        transparent: true,
        opacity: 0.92,
      }),
    );
    cube.add(wireframe);

    scene.add(new THREE.AmbientLight(0xffffff, 1.35));

    const keyLight = new THREE.PointLight(0xbfe7ff, 18, 20);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x7ea0ff, 10, 20);
    rimLight.position.set(-5, -4, 3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffc684, 8, 20);
    fillLight.position.set(1, -3, 5);
    scene.add(fillLight);

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      // First frame of hover: save current cube angles and pointer position as anchor
      if (!pointerRef.current.active) {
        hoverBaseRef.current = {
          rotX: cube.rotation.x,
          rotY: cube.rotation.y,
          px: nx,
          py: ny,
        };
      }

      pointerRef.current = { x: nx, y: ny, active: true };
    };

    const handlePointerLeave = () => {
      // Sync idle accumulator to current Y so rotation resumes from here without snapping
      idleYRef.current = cube.rotation.y;
      pointerRef.current = { x: 0, y: 0, active: false };
    };

    parent.addEventListener("pointermove", handlePointerMove);
    parent.addEventListener("pointerleave", handlePointerLeave);

    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current = window.requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      const { x, y, active } = pointerRef.current;

      let targetX: number;
      let targetY: number;

      if (active) {
        // Rotate relative to where the cube was when the mouse entered
        const dx = x - hoverBaseRef.current.px;
        const dy = y - hoverBaseRef.current.py;
        targetX = hoverBaseRef.current.rotX + dy * 0.55;
        targetY = hoverBaseRef.current.rotY + dx * 0.75;
      } else {
        // Slow idle spin: Y accumulates, X gently oscillates
        idleYRef.current += 0.003;
        targetX = Math.sin(t * 0.55) * 0.18;
        targetY = idleYRef.current;
      }

      cube.rotation.x += (targetX - cube.rotation.x) * 0.07;
      cube.rotation.y += (targetY - cube.rotation.y) * 0.07;
      cube.rotation.z = Math.sin(t * 1.3) * 0.03;

      cube.getWorldPosition(cubeWorldPosition);
      for (let faceIndex = 0; faceIndex < materials.length; faceIndex += 1) {
        worldNormal.copy(localFaceNormals[faceIndex]).applyQuaternion(cube.quaternion).normalize();

        faceCenterOffset.copy(worldNormal).multiplyScalar(1.025);
        faceCenterWorld.copy(cubeWorldPosition).add(faceCenterOffset);
        toCamera.copy(camera.position).sub(faceCenterWorld).normalize();

        const isFaceVisible = worldNormal.dot(toCamera) > 0;
        const expectedMap = isFaceVisible
          ? faceTexturesWithText[faceIndex]
          : faceTexturesNoText[faceIndex];

        if (materials[faceIndex].map !== expectedMap) {
          materials[faceIndex].map = expectedMap;
          materials[faceIndex].needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();

      edges.dispose();
      geometry.dispose();
      wireframe.geometry.dispose();
      (wireframe.material as THREE.Material).dispose();

      materials.forEach((material) => material.dispose());
      faceTexturesWithText.forEach((texture) => texture.dispose());
      faceTexturesNoText.forEach((texture) => texture.dispose());
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44">
      <div className="absolute inset-3 rounded-full bg-cyan-400/20 blur-3xl" />
      <canvas
        ref={canvasRef}
        className="relative z-10 h-full w-full cursor-pointer rounded-3xl"
        aria-label="Logo 3D do PixelForge"
      />
    </div>
  );
}