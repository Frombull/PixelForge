import { ToolCard } from "@/components/ModuleGrid";

export const graphicsTools: ToolCard[] = [
  {
    title: "Canvas 2D",
    description:
      "Desenhe e manipule formas geométricas com ferramentas interativas em 2D",
    icon: "🎨",
    href: "/canvas",
    color: "purple",
    tags: [
      "Transformações 2D",
      "Curvas de Bézier",
      "Sistema de cor",
      "Animações",
    ],
  },
  {
    title: "Canvas 3D",
    description: "Canvas 3D feito com three.js e WebGL",
    icon: "🎨",
    href: "/canvas-3d",
    color: "purple",
    tags: [
      "Transformações 3D",
      "z-fighting",
      "câmeras",
      "z-buffer",
      "color-picker",
      "gizmos"
    ],
  },
  {
    title: "Cubo espectro de cores RGB",
    description:
      "Vizualize o espectro de cores RGB em um Cubo",
    icon: "🎲",
    href: "/cube",
    color: "pink",
    tags: [
      "Espectro de Cores",
      "RGB",
      "Câmera Ortogonal"
    ],
  },
];

export const multimediaTools: ToolCard[] = [
  {
    title: "Processamento de Imagem",
    description: "Explore algoritmos de processamento e manipulação de imagens",
    icon: "🖼️",
    href: "/image-fft",
    color: "blue",
    tags: ["FFT", "Filtros"],
  },
  {
    title: "Aliasing",
    description: "Entenda e experimente frequência de amostragem",
    icon: "✨",
    href: "/aliasing",
    color: "green",
    tags: ["Análise Visual"],
  },
  {
    title: "Compressão de Dados",
    description: "Aprenda sobre algoritmos de compressão e codificação",
    icon: "🗜️",
    href: "/compress",
    color: "orange",
    tags: ["JPEG", "WEBP", "FRACTAL", "DCT"],
  },
  {
    title: "Segmentação de Imagens",
    description: "Ferramenta interativa para segmentação inteligente e manual",
    icon: "🎯",
    href: "/segmentation",
    color: "purple",
    tags: ["Seleção inteligente", "Export"],
  },
  {
    title: "Vetorial vs Matricial",
    description: "Compare a qualidade de imagens vetoriais e matriciais",
    icon: "🎨",
    href: "/vector",
    color: "pink",
    tags: ["Comparação Visual", "Qualidade", "Vetor"],
  }
];

export const aiTools: ToolCard[] = [
  {
    title: "Pathfinding (WIP)",
    description: "Work In Progress",
    icon: "🧠",
    href: "/a-star",
    color: "blue",
    tags: ["Algoritmos de Busca", "A*", "BFS"],
  },
  {
    title: "Boids* (WIP)",
    description: "Work In Progress",
    icon: "🔺",
    href: "/boids",
    color: "blue",
    tags: ["-"],
  }
];
