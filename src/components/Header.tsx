"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 w-full z-50 border-b border-[#2a2d3e] bg-[rgb(22,23,31)]`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 lg:h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-lg lg:text-xl group-hover:bg-neutral-800 transition-colors duration-300">
              <img
                src="/images/anvil.svg"
                alt="logo"
                className="w-5 h-5 lg:w-6 lg:h-6 opacity-80"
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold font-mono text-lg lg:text-xl tracking-tight flex items-baseline gap-1.5">
                <span>PixelForge</span>
                <span className="text-sky-400 font-normal">3D</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 font-mono text-xs">
            <Link
              href="/#graphics"
              className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-3 py-1.5 rounded transition-all duration-300"
            >
              computação gráfica
            </Link>
            <Link
              href="/#multimidia"
              className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-3 py-1.5 rounded transition-all duration-300"
            >
              multimídia
            </Link>
            <Link
              href="/#ia"
              className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-3 py-1.5 rounded transition-all duration-300"
            >
              inteligência computacional
            </Link>
            <Link
              href="/infos"
              className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-3 py-1.5 rounded transition-all duration-300"
            >
              material teórico
            </Link>
            <Link
              href="/pricing"
              className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-3 py-1.5 rounded transition-all duration-300"
            >
              preços
            </Link>
          </nav>

          {/* Badge */}
          <div className="hidden lg:flex items-center">
            <div className="font-mono text-[10px] text-green-400 border border-green-400/30 bg-green-400/5 px-2.5 py-1 rounded tracking-widest">
              FETIN 2026
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4">
            <div className="font-mono text-[10px] text-green-400 border border-green-400/30 bg-green-400/5 px-2 py-0.5 rounded tracking-widest">
              FETIN 2026
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition-all duration-300"
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
        </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-neutral-900 bg-black/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-2 font-mono text-sm px-4">
              <Link
                href="/#graphics"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-4 py-3 rounded transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                computação gráfica
              </Link>
              <Link
                href="/#multimidia"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-4 py-3 rounded transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                multimídia
              </Link>
              <Link
                href="/#ia"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-4 py-3 rounded transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                inteligência computacional
              </Link>
              <Link
                href="/infos"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-4 py-3 rounded transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                material teórico
              </Link>
              <Link
                href="/pricing"
                className="text-neutral-400 hover:text-white hover:bg-neutral-900/50 px-4 py-3 rounded transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                preços
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
