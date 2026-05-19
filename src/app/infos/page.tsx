"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Concept {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: string;
  links: string[];
}

const concepts: Concept[] = [
  {
    id: "bezier-curves",
    icon: "✦",
    title: "Curvas de Bézier",
    description:
      "Curvas paramétricas definidas por pontos de controle, amplamente utilizadas em design gráfico, animação e modelagem 3D. Fundamentais para criar formas suaves e orgânicas.",
    category: "Computação Gráfica",
    links: ["Teoria", "Demo Interativa", "Aplicações"],
  },
  {
    id: "animations",
    icon: "◈",
    title: "Animações",
    description:
      "Sequências temporais que criam movimento através da interpolação entre estados, fundamentais em jogos, interfaces e mídia digital. Essenciais para dar vida e fluidez às experiências visuais interativas.",
    category: "Computação Gráfica",
    links: ["Teoria", "História", "Aplicações"],
  },
];

const categories = ["Todos", "Computação Gráfica"];

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
          <h1 className="text-[28px] font-bold text-[#c0caf5] tracking-tight leading-[1.2] mt-2 font-mono">
            <span className="text-[#7dcfff]">Material teórico</span><br />
          </h1>

          <div className="flex items-center gap-3 w-full max-w-[560px]">
            <div className="flex-1 flex items-center gap-2.5 bg-[#1a1b26] border border-[#2a2d3e] rounded-md px-3.5 focus-within:border-[#3a3d52] focus-within:ring-[3px] focus-within:ring-[#7aa2f7]/10 transition-all">
              <span className="text-[#414868] text-xs shrink-0">⌕</span>
              <input
                type="text"
                placeholder="buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-[12px] text-[#c0caf5] w-full py-2.5 placeholder:text-[#414868]"
              />
              <span className="text-[9px] text-[#414868] border border-[#2a2d3e] px-1.5 py-0.5 rounded-[3px] tracking-widest shrink-0">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {categories.map((category) => {
              const isCG = category === "Computação Gráfica";
              const isMM = category === "Multimídia";
              const isActive = activeCategory === category;
              
              let pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border border-[#2a2d3e] text-[#414868] cursor-pointer transition-all hover:text-[#a9b1d6] hover:border-[#3a3d52]";
              
              if (isActive) {
                if (isCG) {
                  pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border cursor-pointer transition-all text-[#7dcfff] border-[#7dcfff]/40 bg-[#7dcfff]/5";
                } else if (isMM) {
                  pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border cursor-pointer transition-all text-[#bb9af7] border-[#bb9af7]/40 bg-[#bb9af7]/5";
                } else {
                  pillClass = "text-[9px] tracking-[1.5px] uppercase px-3 py-1 rounded-[3px] border cursor-pointer transition-all text-[#c0caf5] border-[#3a3d52] bg-[#2a2d3e]/30";
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
      <div className="relative isolate overflow-hidden bg-[#13141c] border-t border-[#2a2d3e] border-b pb-16 flex-1">
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
                    <span className="text-[11px] text-[#414868] tracking-widest">
                      0{idx + 1}
                    </span>
                    <span className="text-[#9ece6a] font-bold text-[13px]">$</span>
                    <span className="text-[#c0caf5] text-[13px] font-bold tracking-wide">
                      ls material/{dirName}
                    </span>
                    <div className="flex-1 h-px bg-[#2a2d3e]"></div>
                    <span className="text-[9px] text-[#414868] tracking-widest border border-[#2a2d3e] px-2 py-0.5 rounded-[3px]">
                      {categoryConcepts.length} ITENS
                    </span>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                    {categoryConcepts.map((concept, index) => {
                      const isCG = concept.category === "Computação Gráfica";
                      
                      return (
                        <div
                          key={index}
                          data-concept-id={concept.id}
                          onClick={() => handleConceptClick(concept.id)}
                          className="bg-[#1a1b26] p-0 relative cursor-pointer block transition-colors group border border-[#2a2d3e] rounded-md overflow-hidden hover:bg-[#171823] hover:border-[#3a3d52]">
                   
                  <div className="w-full h-24 bg-[#13141c] border-b border-[#2a2d3e] flex items-center justify-center overflow-hidden">
                    <span className="text-[32px]">{concept.icon}</span>
                  </div>

                  <div className="p-[18px] px-5 pb-5 pt-2">
                    <div className={`text-[9px] tracking-widest uppercase mb-2.5 pb-2 inline-flex items-center gap-1.5 ${isCG ? 'text-[#7dcfff]' : 'text-[#bb9af7]'}`}>
                      {concept.category}
                    </div>
                    <div className="text-base font-bold text-[#c0caf5] mb-2 tracking-wide pr-6 leading-tight font-mono">
                      {concept.title}
                    </div>
                    <div className="text-[11px] text-[#a9b1d6] leading-relaxed font-light line-clamp-3 font-mono">
                      {concept.description}
                    </div>
                    
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {concept.links.map((link, i) => (
                        <span key={i} className="text-[9px] text-[#9aa5ce] border border-[#2f3244] bg-[#14161f] px-1.5 py-0.5 rounded-[3px] tracking-wide">
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
