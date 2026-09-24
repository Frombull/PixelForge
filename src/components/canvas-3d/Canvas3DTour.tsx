"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STEPS = [
  {
    element: "#tour-tool-translate",
    popover: {
      title: "Translate",
      description:
        "Move o objeto selecionado pelo espaço 3D. Arraste os eixos coloridos (X, Y, Z) para mover em uma direção específica, ou o cubo central para mover livremente no plano da câmera. Atalho: <kbd>G</kbd>",
    },
  },
  {
    element: "#tour-tool-rotate",
    popover: {
      title: "Rotate",
      description:
        "Rotaciona o objeto ao redor dos seus eixos locais. Clique e arraste os arcos coloridos para girar em torno de X, Y ou Z. Segure <kbd>Shift</kbd> para fazer snap a incrementos de 15°. Atalho: <kbd>R</kbd>",
    },
  },
  {
    element: "#tour-tool-scale",
    popover: {
      title: "Scale",
      description:
        "Redimensiona o objeto. Arraste os handles nos eixos para escalar em uma direção, ou o cubo central para escala uniforme. A matriz de escala é exibida em tempo real na parte inferior deste painel. Atalho: <kbd>S</kbd>",
    },
  },
  {
    element: "#tour-tool-skew",
    popover: {
      title: "Skew",
      description:
        "Aplica uma transformação de cisalhamento (shear) ao objeto, inclinando-o ao longo de um eixo em função do deslocamento nos outros. Útil para demonstrar transformações lineares não-ortogonais. Atalho: <kbd>K</kbd>",
    },
  },
];

export default function Canvas3DTour() {
  useEffect(() => {
    // Small delay so the sidebar has time to render and the DOM elements exist
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        animate: true,
        overlayColor: "#0d0e14",
        overlayOpacity: 0.72,
        smoothScroll: false,
        allowClose: true,
        showButtons: ["next", "previous", "close"],
        nextBtnText: "Próximo →",
        prevBtnText: "← Voltar",
        doneBtnText: "Entendido",
        popoverClass: "canvas3d-tour-popover",
        onDestroyStarted: () => {
          driverObj.destroy();
        },
        steps: TOUR_STEPS,
      });

      driverObj.drive();
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
