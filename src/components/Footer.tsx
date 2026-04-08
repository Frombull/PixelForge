"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0f1017] border-t border-neutral-800/60 text-xs font-mono text-neutral-500">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 lg:gap-8 mb-12">
          
          {/* Coluna 1: Branding e Créditos */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white font-bold tracking-tight text-lg">PixelForge<span className="text-sky-400">3D</span></span>
            </div>
            
            {/* Timeline */}
            <div className="flex gap-4 mt-2">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-sky-500/50 mt-1"></div>
                <div className="w-[1px] h-6 bg-neutral-800 my-1"></div>
                <div className="w-2 h-2 rounded-full bg-neutral-700 mb-1"></div>
              </div>
              <div className="flex flex-col justify-between">
                <p className="text-[10px] sm:text-xs text-neutral-400 whitespace-nowrap">FETIN 2026 Prof. Ruan Patrick</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 whitespace-nowrap">FETIN 2025 Prof. Me. Marcelo Cysneiros</p>
              </div>
            </div>
          </div>

          {/* Coluna 2: Módulos */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold tracking-wider">./módulos</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/#graphics" className="hover:text-sky-400 transition-colors">Computação Gráfica</Link>
              </li>
              <li>
                <Link href="/#multimidia" className="hover:text-fuchsia-400 transition-colors">Multimídia</Link>
              </li>
              <li>
                <Link href="/#ia" className="hover:text-green-400 transition-colors">Inteligência Computacional</Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Recursos */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold tracking-wider">./recursos</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/infos" className="hover:text-sky-400 transition-colors">Material Teórico</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-sky-400 transition-colors">Planos e Preços</Link>
              </li>
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">Página Inicial</Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Legal & Social */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold tracking-wider">./links</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/privacy" className="hover:text-sky-400 transition-colors">Política de Privacidade</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-sky-400 transition-colors">Política de Cookies</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="flex justify-center sm:justify-start items-center pt-8 border-t border-neutral-800/60 w-full">
          <p className="text-[10px] text-neutral-600 uppercase tracking-widest text-center sm:text-left">
            © 2026 Inatel // Desenvolvido por{" "}
            <a href="https://www.linkedin.com/in/marcoditoro/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-sky-400 transition-colors underline decoration-neutral-800 underline-offset-4 hover:decoration-sky-400">
              Marco Di Toro
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
