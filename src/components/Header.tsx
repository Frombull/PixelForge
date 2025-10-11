"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isInfosPage = pathname.startsWith("/infos");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo / Back Button */}
          {isInfosPage ? (
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-bold text-lg lg:text-xl">
                  Voltar ao Início
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-lg lg:text-xl shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform duration-300">
                <img
                  src="/images/anvil.svg"
                  alt="logo"
                  className="w-6 h-6 lg:w-8 lg:h-8"
                />
              </div>
              <div className="hidden sm:block">
                <div className="bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent font-bold text-lg lg:text-xl">
                  Pixel Forge
                </div>
                <div className="text-xs text-white/60 -mt-1">
                  Educação Interativa
                </div>
              </div>
            </Link>
          )}

          {/* Desktop Navigation */}
          {(
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                href="/#graphics"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
              >
                Computação Gráfica
              </Link>
              <Link
                href="/#multimidia"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
              >
                Multimídia
              </Link>
              <Link
                href="/#ia"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
              >
                Inteligência Computacional
              </Link>
              <Link
                href="/infos"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
              >
                Material Teórico
              </Link>
            </nav>
          )}

          {/* Mobile Menu Button - Only show on home page */}
          {!isInfosPage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile Menu - Only show on home page */}
        {mobileMenuOpen && !isInfosPage && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-2">
              <Link
                href="#graphics"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Computação Gráfica
              </Link>
              <Link
                href="#multimidia"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Multimídia
              </Link>
              <Link
                href="#ia"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inteligência Computacional
              </Link>
              <Link
                href="/infos"
                className="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all duration-300 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Material Teórico
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
