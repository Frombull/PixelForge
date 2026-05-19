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
      <div className="mb-4 pb-3 border-b border-[#2a2d3e]">
        <Link
          href="/infos"
          className={`text-[11px] font-bold tracking-widest uppercase transition-colors font-mono ${
            isHub ? "text-[#c0caf5]" : "text-[#414868] hover:text-[#a9b1d6]"
          }`}
        >
          material teórico
        </Link>
      </div>

      <nav className="space-y-5">
        {grouped.map((group) => (
          <div key={group.key}>
            <div className="text-[9px] tracking-[1.8px] uppercase font-mono font-bold mb-2.5 text-[#414868]">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((concept) => {
                const isActive = activeConceptId === concept.id;
                return (
                  <li key={concept.id}>
                    <Link
                      href={`/infos/${concept.id}`}
                      className={`block px-2 py-1.5 rounded-[3px] text-[13px] font-mono transition-colors ${
                        isActive
                          ? "text-[#c0caf5]"
                          : "text-[#414868] hover:text-[#a9b1d6]"
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
