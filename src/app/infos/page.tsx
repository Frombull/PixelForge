"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Concept {
  id: string;
  title: string;
  description: string;
  category: string;
  links: string[];
  image?: string;
}

const concepts: Concept[] = [
  {
    id: "bezier-curves",
    title: "Curvas de Bézier",
    image: "/images/module-previews/bezier_cover.jpg",
    description:
      "Curvas paramétricas definidas por pontos de controle, amplamente utilizadas em design gráfico, animação e modelagem 3D. Fundamentais para criar formas suaves e orgânicas.",
    category: "Computação Gráfica",
    links: ["Teoria", "Demo Interativa", "Aplicações"],
  },
  {
    id: "animations",
    title: "Animações",
    image: "/images/module-previews/animation_cover.jpg",
    description:
      "Sequências temporais que criam movimento através da interpolação entre estados, fundamentais em jogos, interfaces e mídia digital. Essenciais para dar vida e fluidez às experiências visuais interativas.",
    category: "Computação Gráfica",
    links: ["Teoria", "História", "Aplicações"],
  },
  {
    id: "canvas-2d",
    title: "Canvas 2D",
    image: "/images/module-previews/canvas-2d-preview.jpg",
    description:
      "Sistema de coordenadas, transformações e composição de formas em um plano 2D. A base para qualquer ferramenta de desenho ou editor gráfico vetorial.",
    category: "Computação Gráfica",
    links: ["Teoria", "Transformações", "Demo Interativa"],
  },
  {
    id: "canvas-3d",
    title: "Canvas 3D",
    image: "/images/module-previews/canvas-3d-preview.jpg",
    description:
      "Renderização de cenas tridimensionais com câmeras, iluminação e z-buffer. Introduz os conceitos que sustentam engines gráficas e WebGL.",
    category: "Computação Gráfica",
    links: ["Teoria", "Câmeras", "Z-buffer"],
  },
  {
    id: "rgb-cube",
    title: "Cubo RGB",
    image: "/images/module-previews/3d-cube.jpg",
    description:
      "O espaço de cores RGB representado como um cubo tridimensional, revelando como misturas aditivas de luz formam todas as cores exibidas em telas.",
    category: "Computação Gráfica",
    links: ["Teoria", "Espectro de Cores", "Demo Interativa"],
  },
  {
    id: "image-processing",
    title: "Processamento de Imagem",
    image: "/images/module-previews/fft-preview.jpg",
    description:
      "Filtros, convoluções e a Transformada de Fourier aplicados a imagens digitais para realce, suavização e análise no domínio da frequência.",
    category: "Multimídia",
    links: ["Teoria", "FFT", "Filtros"],
  },
  {
    id: "aliasing",
    title: "Aliasing",
    image: "/images/module-previews/aliasing-preview.jpg",
    description:
      "O que acontece quando a frequência de amostragem não é suficiente para representar um sinal — e como técnicas de anti-aliasing corrigem o problema.",
    category: "Multimídia",
    links: ["Teoria", "Amostragem", "Nyquist"],
  },
  {
    id: "compression",
    title: "Compressão de Dados",
    image: "/images/module-previews/compression-preview.jpg",
    description:
      "Algoritmos com e sem perdas usados para reduzir o tamanho de imagens e arquivos, de JPEG e DCT a compressão fractal e WebP.",
    category: "Multimídia",
    links: ["Teoria", "JPEG", "DCT"],
  },
  {
    id: "segmentation",
    title: "Segmentação de Imagens",
    image: "/images/module-previews/segmentation-preview.jpg",
    description:
      "Técnicas para dividir uma imagem em regiões significativas, da seleção manual a algoritmos de seleção inteligente baseados em cor e borda.",
    category: "Multimídia",
    links: ["Teoria", "Seleção Inteligente", "Aplicações"],
  },
  {
    id: "vector-vs-raster",
    title: "Vetorial vs Matricial",
    image: "/images/module-previews/vector-preview.jpg",
    description:
      "As diferenças fundamentais entre representar imagens como formas matemáticas ou como grades de pixels, e o impacto disso em qualidade e escalabilidade.",
    category: "Multimídia",
    links: ["Teoria", "Comparação Visual", "Qualidade"],
  },
];

const categories = ["Todos", "Computação Gráfica", "Multimídia"];

export default function InfosPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConcepts, setFilteredConcepts] = useState(concepts);

  useEffect(() => {
    let filtered = concepts;

    // Filter by category
    if (activeCategory !== "Todos") {
      filtered = filtered.filter(
        (concept) => concept.category === activeCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (concept) =>
          concept.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          concept.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredConcepts(filtered);
  }, [searchTerm, activeCategory]);

  const handleConceptClick = (conceptId: string) => {
    router.push(`/infos/${conceptId}`);
  };

  return (
    <div className="flex flex-col flex-1 gap-10">
      {/* Page Hero + Search */}
      <div className="pt-12 pb-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-[28px] font-bold text-[var(--pf-fg-strong)] tracking-tight leading-[1.2] mt-2 font-sans">
            <span className="text-[var(--pf-accent)]">Material teórico</span><br />
          </h1>

          <div className="flex items-center gap-3 w-full max-w-[560px]">
            <div className="flex-1 flex items-center gap-2.5 bg-[var(--pf-bg-raised)] border border-[var(--pf-border)] rounded-md px-3.5 focus-within:border-[var(--pf-border-strong)] focus-within:ring-[3px] focus-within:ring-[var(--pf-accent)]/10 transition-all">
              <span className="text-[var(--pf-fg-faint)] text-xs shrink-0">⌕</span>
              <input
                type="text"
                placeholder="buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none font-sans text-[13px] text-[var(--pf-fg-strong)] w-full py-2.5 placeholder:text-[var(--pf-fg-faint)]"
              />
              <span className="text-[9px] text-[var(--pf-fg-faint)] border border-[var(--pf-border)] px-1.5 py-0.5 rounded-[3px] tracking-widest shrink-0">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {categories.map((category) => {
              const isCategory = category !== "Todos";
              const isActive = activeCategory === category;

              let pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border border-[var(--pf-border)] text-[var(--pf-fg-faint)] cursor-pointer transition-all hover:text-[var(--pf-fg)] hover:border-[var(--pf-border-strong)]";

              if (isActive) {
                if (isCategory) {
                  pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border cursor-pointer transition-all text-[var(--pf-accent)] border-[var(--pf-accent)]/40 bg-[var(--pf-accent)]/5";
                } else {
                  pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border cursor-pointer transition-all text-[var(--pf-fg-strong)] border-[var(--pf-border-strong)] bg-[var(--pf-bg-raised)]";
                }
              }

              return (
                <div
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`${pillClass} font-mono`}
                >
                  {category}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content (CG Section Style) */}
      <div className="relative isolate overflow-hidden bg-[var(--pf-bg)] border-t border-[var(--pf-border)] border-b pb-16 flex-1">
        <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 py-14">
          {categories
            .filter(
              (c) =>
                c !== "Todos" &&
                (activeCategory === "Todos" || activeCategory === c)
            )
            .map((category, idx) => {
              const categoryConcepts = filteredConcepts.filter(
                (c) => c.category === category
              );

              if (categoryConcepts.length === 0) return null;

              const dirName =
                category === "Computação Gráfica"
                  ? "computacao-grafica/"
                  : "multimidia/";

              return (
                <div key={category} className="mb-12">
                  <div className="flex items-center gap-3.5 mb-8">
                    <span className="text-[11px] text-[var(--pf-fg-faint)] tracking-widest">
                      0{idx + 1}
                    </span>
                    <span className="text-[var(--pf-accent)] font-bold text-[13px]">$</span>
                    <span className="text-[var(--pf-fg-strong)] text-[13px] font-bold tracking-wide">
                      ls material/{dirName}
                    </span>
                    <div className="flex-1 h-px bg-[var(--pf-border)]"></div>
                    <span className="text-[9px] text-[var(--pf-fg-faint)] tracking-widest border border-[var(--pf-border)] px-2 py-0.5 rounded-[3px]">
                      {categoryConcepts.length} ITENS
                    </span>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                    {categoryConcepts.map((concept, index) => {
                      return (
                        <div
                          key={index}
                          data-concept-id={concept.id}
                          onClick={() => handleConceptClick(concept.id)}
                          className="bg-[var(--pf-bg-raised)] p-0 relative cursor-pointer block transition-colors group border border-[var(--pf-border)] rounded-md overflow-hidden hover:border-[var(--pf-border-strong)]">

                          {concept.image && (
                            <div className="relative -mx-0 -mt-0 overflow-hidden rounded-t-md h-40 bg-[#0d0d0d] border-b border-[var(--pf-border)]">
                              <img
                                src={concept.image}
                                alt={`${concept.title} preview`}
                                className="w-full h-full object-cover"
                                style={{
                                  WebkitMaskImage:
                                    "radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
                                  maskImage:
                                    "radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
                                }}
                              />
                            </div>
                          )}

                          <div className="p-[18px] px-5 pb-5 pt-2">
                            <div className="text-[9px] tracking-widest uppercase mb-2.5 pb-2 inline-flex items-center gap-1.5 text-[var(--pf-accent)]">
                              {concept.category}
                            </div>
                            <div className="text-base font-bold text-[var(--pf-fg-strong)] mb-2 tracking-wide pr-6 leading-tight font-sans">
                              {concept.title}
                            </div>
                            <div className="text-[13px] text-[var(--pf-fg)] leading-relaxed font-light line-clamp-3 font-sans">
                              {concept.description}
                            </div>

                            <div className="mt-3.5 flex flex-wrap gap-1.5">
                              {concept.links.map((link, i) => (
                                <span key={i} className="text-[9px] text-[var(--pf-fg-muted)] border border-[var(--pf-border)] bg-[var(--pf-bg)] px-1.5 py-0.5 rounded-[3px] tracking-wide">
                                  {link.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
            })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
