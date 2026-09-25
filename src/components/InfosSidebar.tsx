"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface ConceptItem {
  id: string;
  icon: string;
  title: string;
  category: "Computação Gráfica" | "Multimídia";
}

const concepts: ConceptItem[] = [
  { id: "bezier-curves", icon: "◫", title: "Curvas de Bézier", category: "Computação Gráfica" },
  { id: "animations", icon: "◫", title: "Animações", category: "Computação Gráfica" },
  { id: "canvas-2d", icon: "◫", title: "Canvas 2D", category: "Computação Gráfica" },
  { id: "canvas-3d", icon: "◫", title: "Canvas 3D", category: "Computação Gráfica" },
  { id: "rgb-cube", icon: "◫", title: "Cubo RGB", category: "Computação Gráfica" },
  { id: "image-processing", icon: "◫", title: "Processamento de Imagem", category: "Multimídia" },
  { id: "aliasing", icon: "◫", title: "Aliasing", category: "Multimídia" },
  { id: "compression", icon: "◫", title: "Compressão de Dados", category: "Multimídia" },
  { id: "segmentation", icon: "◫", title: "Segmentação de Imagens", category: "Multimídia" },
  { id: "vector-vs-raster", icon: "◫", title: "Vetorial vs Matricial", category: "Multimídia" },
];

const grouped = [
  { label: "Computação Gráfica", key: "CG", items: concepts.filter((c) => c.category === "Computação Gráfica") },
  { label: "Multimídia", key: "MM", items: concepts.filter((c) => c.category === "Multimídia") },
].filter((g) => g.items.length > 0);

export default function InfosSidebar() {
  const pathname = usePathname();
  const isHub = pathname === "/infos" || pathname === "/infos/";
  const [visibleId, setVisibleId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // On the hub page, watch concept cards via IntersectionObserver
  useEffect(() => {
    if (!isHub) return;

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the topmost visible entry
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        setVisibleId(visible[0].target.getAttribute("data-concept-id"));
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    });

    const attach = () => {
      const cards = document.querySelectorAll("[data-concept-id]");
      cards.forEach((el) => observerRef.current?.observe(el));
    };

    // Small delay to ensure cards are rendered
    const timer = setTimeout(attach, 100);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [isHub]);

  // On individual pages, derive active from pathname
  const activeConceptId = isHub
    ? visibleId
    : pathname.split("/infos/")[1]?.split("/")[0] ?? null;

  return (
    <aside className="flex flex-col w-full overflow-y-auto pb-8 pr-2">
      <div className="mb-4 pb-3 border-b border-[var(--pf-border)]">
        <Link
          href="/infos"
          className={`text-[11px] font-bold tracking-widest uppercase transition-colors font-mono ${
            isHub ? "text-[var(--pf-fg-strong)]" : "text-[var(--pf-fg-faint)] hover:text-[var(--pf-fg)]"
          }`}
        >
          material teórico
        </Link>
      </div>

      <nav className="space-y-5">
        {grouped.map((group) => (
          <div key={group.key}>
            <div className="text-[9px] tracking-[1.8px] uppercase font-mono font-bold mb-2.5 text-[var(--pf-fg-faint)]">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((concept) => {
                const isActive = activeConceptId === concept.id;
                return (
                  <li key={concept.id}>
                    <Link
                      href={`/infos/${concept.id}`}
                      className={`block px-2 py-1.5 rounded-[3px] text-[13px] font-sans transition-colors ${
                        isActive
                          ? "text-[var(--pf-fg-strong)]"
                          : "text-[var(--pf-fg-faint)] hover:text-[var(--pf-fg)]"
                      }`}
                    >
                      {concept.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
