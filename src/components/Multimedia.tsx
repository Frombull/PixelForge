"use client";

import Link from "next/link";

interface ToolCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  features: string[];
}

const tools: ToolCard[] = [
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
const getColorClasses = (color: string) => {
  switch (color) {
    case "purple":
      return "from-purple-500/20 to-purple-500/5 hover:shadow-purple-500/10 hover:border-purple-500/30";
    case "blue":
      return "from-blue-500/20 to-blue-500/5 hover:shadow-blue-500/10 hover:border-blue-500/30";
    case "green":
      return "from-green-500/20 to-green-500/5 hover:shadow-green-500/10 hover:border-green-500/30";
    case "orange":
      return "from-orange-500/20 to-orange-500/5 hover:shadow-orange-500/10 hover:border-orange-500/30";
    case "pink":
      return "from-pink-500/20 to-pink-500/5 hover:shadow-pink-500/10 hover:border-pink-500/30";
    default:
      return "from-purple-500/20 to-purple-500/5 hover:shadow-purple-500/10 hover:border-purple-500/30";
  }
};

export default function SectionsComponent() {
  return (
    <section
      id="multimidia"
      className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-slate-900 to-black"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 px-2">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Multimídia
          </h2>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-12 sm:mb-16">
          {tools.map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className={`group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-white/15 min-h-[320px] sm:min-h-[380px] lg:min-h-[400px] flex flex-col ${getColorClasses(
                tool.color
              )}`}
            >
              {/* Header */}
              <div className="relative flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl group-hover:scale-105 transition-transform duration-300 ${getColorClasses(
                      tool.color
                    )}`}
                  >
                    {tool.icon}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white">
                    {tool.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="relative text-white/80 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base flex-grow">
                {tool.description}
              </p>

              {/* Features */}
              <div className="relative flex flex-wrap gap-2 mb-4 sm:mb-6">
                {tool.features.map((feature) => (
                  <span
                    key={feature}
                    className="bg-white/10 text-white/90 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border border-white/10 hover:bg-white/15 transition-colors duration-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="relative flex items-center justify-between mt-auto">
                <span className="text-white/60 text-xs sm:text-sm">
                  Clique para explorar
                </span>
                <span className="text-lg sm:text-2xl group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
