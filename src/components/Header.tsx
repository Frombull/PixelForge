"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [activeSection, setActiveSection] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const sections = ["graphics", "multimidia", "ia"];
      let current = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isInfos = pathname?.startsWith("/infos");
  const isGraphics = !isInfos && (activeSection === "graphics" || activeSection === "");
  const isMultimidia = !isInfos && activeSection === "multimidia";
  const isIA = !isInfos && activeSection === "ia";

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] bg-[rgba(22,23,31,0.92)] backdrop-blur-[12px] border-b border-borderDark h-[52px] flex items-center px-4 sm:px-8 gap-4 sm:gap-8 transition-all duration-600 ease-out font-mono ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 3H15.5C19.6421 3 23 6.35786 23 10.5C23 14.6421 19.6421 18 15.5 18H10.5V25H7V3Z"
            fill="rgba(125,207,255,0.08)"
            stroke="#7dcfff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 7H15C16.933 7 18.5 8.567 18.5 10.5C18.5 12.433 16.933 14 15 14H10.5V7Z"
            fill="rgba(122,162,247,0.12)"
            stroke="#7aa2f7"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-[14px] font-bold tracking-[0.5px] hidden sm:block">
          <span className="text-whiteTheme">Pixel</span><span className="text-cyanTheme">Forge</span>
          <span className="text-dim font-normal text-[11px] ml-1"> // v2.0</span>
        </div>
      </Link>

      <nav className="flex gap-1 items-center overflow-x-auto no-scrollbar">
        <Link
          href="/#graphics"
          className={`text-[11px] no-underline px-[12px] py-[5px] rounded border tracking-[0.5px] transition-colors whitespace-nowrap ${
            isGraphics
              ? "text-cyanTheme border-[rgba(125,207,255,0.2)] bg-[rgba(125,207,255,0.05)]"
              : "text-dim border-transparent hover:text-fg hover:bg-[rgba(255,255,255,0.04)]"
          }`}
        >
          computação gráfica
        </Link>
        <Link
          href="/#multimidia"
          className={`text-[11px] no-underline px-[12px] py-[5px] rounded border tracking-[0.5px] transition-colors whitespace-nowrap ${
            isMultimidia
              ? "text-cyanTheme border-[rgba(125,207,255,0.2)] bg-[rgba(125,207,255,0.05)]"
              : "text-dim border-transparent hover:text-fg hover:bg-[rgba(255,255,255,0.04)]"
          }`}
        >
          multimídia
        </Link>
        <Link
          href="/#ia"
          className={`text-[11px] no-underline px-[12px] py-[5px] rounded border tracking-[0.5px] transition-colors whitespace-nowrap ${
            isIA
              ? "text-cyanTheme border-[rgba(125,207,255,0.2)] bg-[rgba(125,207,255,0.05)]"
              : "text-dim border-transparent hover:text-fg hover:bg-[rgba(255,255,255,0.04)]"
          }`}
        >
          IA
        </Link>
        <Link
          href="/infos"
          className={`text-[11px] no-underline px-[12px] py-[5px] rounded border tracking-[0.5px] transition-colors whitespace-nowrap ${
            isInfos
              ? "text-cyanTheme border-[rgba(125,207,255,0.2)] bg-[rgba(125,207,255,0.05)]"
              : "text-dim border-transparent hover:text-fg hover:bg-[rgba(255,255,255,0.04)]"
          }`}
        >
          conceitos
        </Link>
      </nav>

      <div className="flex-1"></div>
      
      <div className="hidden sm:block text-[10px] text-greenTheme tracking-[1.5px] border border-[rgba(158,206,106,0.3)] px-[10px] py-[3px] rounded-[3px] bg-[rgba(158,206,106,0.05)]">
        FETIN 2026
      </div>
    </header>
  );
}
