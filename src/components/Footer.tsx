"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-borderDark px-8 py-7 flex flex-col sm:flex-row justify-between items-center sm:items-start bg-bg4 font-mono gap-4 sm:gap-0">
      <div className="text-[11px] text-dim text-center sm:text-left leading-relaxed">
        <span className="text-fg font-bold">PixelForge 3D</span> | Desenvolvido por Marco Di Toro<br/>
        <span className="text-[10px]">Fetin 2025/2026, orientado por Prof. Ruan Patrick</span>
      </div>
      <div className="text-[10px] text-dim text-center sm:text-right leading-[1.8]">
        <a href="https://github.com/marcoditoro" target="_blank" rel="noreferrer" className="text-blueTheme no-underline hover:text-cyanTheme transition-colors">
          Código Fonte
        </a>
        <span className="mx-2">·</span>
        <a href="https://www.linkedin.com/in/marcoditoro/" target="_blank" rel="noreferrer" className="text-blueTheme no-underline hover:text-cyanTheme transition-colors">
          LinkedIn
        </a>
        <br/>
        <Link href="/" className="text-dim no-underline hover:text-fg transition-colors">
          pixelforge3d.com.br
        </Link>
      </div>
    </footer>
  );
}
