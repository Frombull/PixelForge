const IMPORT_MAP = {
  imports: {
    three: "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
    "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.0/build/index.module.js",
    "three-bvh-csg": "https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.16/build/index.module.js",
    "three-viewport-gizmo": "https://cdn.jsdelivr.net/npm/three-viewport-gizmo@2.2.0/dist/three-viewport-gizmo.js",
  },
};

export function injectImportMap() {
  if (document.getElementById("canvas3d-importmap")) return;

  const script = document.createElement("script");
  script.id = "canvas3d-importmap";
  script.type = "importmap";
  script.textContent = JSON.stringify(IMPORT_MAP);
  document.head.appendChild(script);
}

export function loadCanvasRuntimeModule() {
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

export async function waitForBridge(retries = 50, delayMs = 50) {
  for (let i = 0; i < retries; i += 1) {
    if (window.Canvas3DBridge) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}
