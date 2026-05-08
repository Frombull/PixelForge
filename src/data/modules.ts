import { ToolCard } from "@/components/ModuleGrid";

export const graphicsTools: ToolCard[] = [
  {
    title: "Canvas 2D",
    previewImage: "/images/module-previews/canvas-2d-preview.jpg",
    description:
      "Desenhe e manipule formas geométricas com ferramentas interativas em 2D",
    href: "/canvas",
    tags: [
      "Transformações 2D",
      "Curvas de Bézier",
      "Sistema de cor",
      "Animações",
    ],
  },
  {
    title: "Canvas 3D",
    previewImage: "/images/module-previews/canvas-3d-preview.jpg",
    description: "Canvas 3D feito com three.js e WebGL",
    href: "/canvas-3d",
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
    previewImage: "/images/module-previews/3d-cube.jpg",
    description:
      "Vizualize o espectro de cores RGB em um Cubo",
    href: "/cube",
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
    previewImage: "/images/module-previews/fft-preview.jpg",
    description: "Explore algoritmos de processamento e manipulação de imagens",
    href: "/image-fft",
    tags: ["FFT", "Filtros"],
  },
  {
    title: "Aliasing",
    previewImage: "/images/module-previews/aliasing-preview.jpg",
    description: "Entenda e experimente frequência de amostragem",
    href: "/aliasing",
    tags: ["Análise Visual"],
  },
  {
    title: "Compressão de Dados",
    previewImage: "/images/module-previews/compression-preview.jpg",
    description: "Aprenda sobre algoritmos de compressão e codificação",
    href: "/compress",
    tags: ["JPEG", "WEBP", "FRACTAL", "DCT"],
  },
  {
    title: "Segmentação de Imagens",
    previewImage: "/images/module-previews/segmentation-preview.jpg",
    description: "Ferramenta interativa para segmentação inteligente e manual",
    href: "/segmentation",
    tags: ["Seleção inteligente", "Export"],
  },
  {
    title: "Vetorial vs Matricial",
    previewImage: "/images/module-previews/vector-preview.jpg",
    description: "Compare a qualidade de imagens vetoriais e matriciais",
    href: "/vector",
    tags: ["Comparação Visual", "Qualidade", "Vetor"],
  }
];

export const aiTools: ToolCard[] = [
  {
    title: "Pathfinding (WIP)",
    description: "Work In Progress",
    href: "/a-star",
    tags: ["Algoritmos de Busca", "A*", "BFS"],
  },
  {
    title: "Boids* (WIP)",
    description: "Work In Progress",
    href: "/boids",
    tags: ["-"],
  }
];
