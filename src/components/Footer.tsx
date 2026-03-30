"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo e descrição */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                <img
                  src="/images/anvil.svg"
                  alt="logo"
                  className="w-6 h-6"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                Pixel Forge
              </span>
            </div>
            <p className="text-white/60 text-sm">
              Plataforma educacional interativa para Computação Gráfica, Multimídia e Inteligência Computacional.
            </p>
          </div>

          {/* Links rápidos */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold mb-2">Links Rápidos</h3>
            <Link href="/infos" className="text-white/70 hover:text-sky-400 transition-colors duration-200 text-sm">
              Material Teórico
            </Link>
            <Link href="/pricing" className="text-white/70 hover:text-sky-400 transition-colors duration-200 text-sm">
              Preços
            </Link>
            <Link href="/cookies" className="text-white/70 hover:text-sky-400 transition-colors duration-200 text-sm">
              Política de Cookies
            </Link>
            <Link href="/privacy" className="text-white/70 hover:text-sky-400 transition-colors duration-200 text-sm">
              Política de Privacidade
            </Link>
          </div>

          {/* Links sociais */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold mb-2">Conecte-se</h3>
            <a
              href="https://www.linkedin.com/in/marcoditoro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-sky-400 transition-colors duration-200 flex items-center gap-2 text-sm">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.026-3.063-1.867-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.603 2.002 3.603 4.604v5.592z" />
              </svg>
              LinkedIn - Marco
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

        {/* Copyright e créditos */}
        <div className="text-center text-white/40 text-sm">
          <p className="mb-6">© 2026 Pixel Forge. Desenvolvido por Marco Di Toro</p>
          <p className="text-xs mb-1">Fetin 2026 | Orientado por Prof. Ruan Patrik</p>
          <p className="text-xs mb-1">Fetin 2025 | Orientado por Prof. Me. Marcelo Cysneiros</p>
        </div>
      </div>
    </footer>
  );
}
