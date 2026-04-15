"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const INSTANCE_COUNT = 4000;
const SPHERE_RADIUS = 5;

type HeroVoxelSphereProps = {
  className?: string;
  interactive?: boolean;
};

export default function HeroVoxelSphere({ className, interactive = true }: HeroVoxelSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

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
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const raycaster = new THREE.Raycaster();
    const mouseNdc = new THREE.Vector2(5, 5);
    const worldMouse = new THREE.Vector3(-20, -20, -20);
    const offscreenTarget = new THREE.Vector3(-20, -20, -20);
    let pointerInside = false;

    const interactionSphere = new THREE.Mesh(
      new THREE.SphereGeometry(SPHERE_RADIUS, 24, 24),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    scene.add(interactionSphere);

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float uTime;
      uniform vec3 uMouse;

      void main() {
        vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        vec3 worldInstancePos = (modelMatrix * vec4(instancePos, 1.0)).xyz;
        float dist = distance(worldInstancePos, uMouse);

        float hoverRadius = 3.5;
        float hoverEffect = smoothstep(hoverRadius, 0.0, dist);
        float baseScale = 0.7 + 0.2 * sin(uTime + length(instancePos));
        float finalScale = baseScale + (hoverEffect * 2.0);

        vec3 transformed = position * finalScale;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
        vNormal = normalMatrix * (mat3(instanceMatrix) * normal);
        vPos = instancePos;

        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float uTime;

      void main() {
        vec3 color = 0.5 + 0.5 * cos(uTime * 0.8 + vPos.xyz * 0.3 + vec3(0.0, 2.0, 4.0));
        float diffuse = max(dot(normalize(vNormal), vec3(1.0, 1.0, 1.0)), 0.4);
        gl_FragColor = vec4(color * diffuse, 1.0);
      }
    `;

    const geometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: worldMouse },
      },
    });

    const voxelSphere = new THREE.InstancedMesh(geometry, material, INSTANCE_COUNT);
    const dummy = new THREE.Object3D();

    for (let index = 0; index < INSTANCE_COUNT; index += 1) {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / INSTANCE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;

      dummy.position.set(
        SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi),
        SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi),
        SPHERE_RADIUS * Math.cos(phi),
      );
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      voxelSphere.setMatrixAt(index, dummy.matrix);
    }

    scene.add(voxelSphere);

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    };

    const handlePointerLeave = () => {
      pointerInside = false;
      mouseNdc.set(5, 5);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    if (interactive) {
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", handlePointerLeave);
    }

    resize();

    const animate = (time: number) => {
      frameRef.current = window.requestAnimationFrame(animate);

      const t = time * 0.001;
      material.uniforms.uTime.value = t;

      if (interactive) {
        raycaster.setFromCamera(mouseNdc, camera);
        const intersections = raycaster.intersectObject(interactionSphere, false);

        if (pointerInside && intersections.length > 0) {
          worldMouse.lerp(intersections[0].point, 0.15);
        } else {
          worldMouse.lerp(offscreenTarget, 0.05);
        }
      } else {
        worldMouse.lerp(offscreenTarget, 0.05);
      }

      voxelSphere.rotation.y += 0.0002;
      interactionSphere.rotation.y = voxelSphere.rotation.y;

      renderer.render(scene, camera);
    };

    animate(0);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      if (interactive) {
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
      }
      resizeObserver.disconnect();

      interactionSphere.geometry.dispose();
      (interactionSphere.material as THREE.Material).dispose();
      voxelSphere.geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [interactive]);

  return (
    <div className={`relative h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44 ${className ?? ""}`}>
      <div className="absolute inset-1 rounded-full bg-sky-400/20 blur-3xl" />
      <canvas
        ref={canvasRef}
        className={`relative z-10 h-full w-full rounded-full ${interactive ? "cursor-pointer" : ""}`}
        aria-label="Visualizacao interativa de voxels"
      />
    </div>
  );
}