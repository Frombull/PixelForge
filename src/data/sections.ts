import { ToolCard } from "@/components/SectionGrid";

export const graphicsTools: ToolCard[] = [
  {
    title: "Canvas Interativo",
    description:
      "Desenhe e manipule formas geométricas com ferramentas interativas",
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
    features: ["Zoom Interativo", "Comparação Visual", "Qualidade"],
  },
];

export const aiTools: ToolCard[] = [
  {
    title: "A*",
    description: "A*",
    icon: "🧠",
    href: "/ai/a-star",
    color: "blue",
    features: ["Algoritmo de Busca"],
  },
];
