import { ToolCard } from "@/components/SectionGrid";

export const graphicsTools: ToolCard[] = [
  {
    title: "Canvas 2D",
    description:
      "Desenhe e manipule formas geométricas com ferramentas interativas em 2D",
    icon: "🎨",
    href: "/canvas",
    color: "purple",
    features: [
      "Transformações 2D",
      "Curvas de Bézier",
      "Sistema de cor",
      "Animações",
    ],
  },
  {
    title: "Canvas 3D (WIP)",
    description: "Work In Progress",
    icon: "🎨",
    href: "/canvas-3d",
    color: "purple",
    features: [
      "Transformações 3D",
    ],
  },
  {
    title: "Cubo espectro de cores RGB",
    description:
      "Vizualize o espectro de cores RGB em um Cubo",
    icon: "🎲",
    href: "/cube",
    color: "pink",
    features: [
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
    features: ["FFT", "Filtros"],
  },
  {
    title: "Aliasing",
    description: "Entenda e experimente frequência de amostragem",
    icon: "✨",
    href: "/aliasing",
    color: "green",
    features: ["Análise Visual"],
  },
  {
    title: "Compressão de Dados",
    description: "Aprenda sobre algoritmos de compressão e codificação",
    icon: "🗜️",
    href: "/compress",
    color: "orange",
    features: ["JPEG", "WEBP", "FRACTAL", "DCT"],
  },
  {
    title: "Segmentação de Imagens",
    description: "Ferramenta interativa para segmentação inteligente e manual",
    icon: "🎯",
    href: "/segmentation",
    color: "purple",
    features: ["Seleção inteligente", "Export"],
  },
  {
    title: "Vetorial vs Matricial",
    description: "Compare a qualidade de imagens vetoriais e matriciais",
    icon: "🎨",
    href: "/vector",
    color: "pink",
    features: ["Comparação Visual", "Qualidade", "Vetor"],
  }
];

export const aiTools: ToolCard[] = [
  {
    title: "Pathfinding (WIP)",
    description: "Work In Progress",
    icon: "🧠",
    href: "/a-star",
    color: "blue",
    features: ["Algoritmos de Busca", "A*", "BFS"],
  },
  {
    title: "Boids* (WIP)",
    description: "Work In Progress",
    icon: "🔺",
    href: "/boids",
    color: "blue",
    features: ["-"],
  }
];
