"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col text-center px-4 md:px-8 pt-28 md:pt-36 relative bg-gradient-to-t from-slate-900 to-black overflow-hidden">
      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-4 md:mb-6 bg-gradient-to-r from-white via-purple-300 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
            Pixel Forge
          </h1>
          <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-4 md:mb-6"></div>
        </div>

        {/* Subtitle */}
        <p className="text-base md:text-2xl lg:text-3xl text-white/90 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2">
          Plataforma educacional interativa para
          <span className="font-semibold text-purple-300">
            {" "}
            Computação Gráfica{" "}
          </span>
          e <span className="font-semibold text-blue-300">Multimídia</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 mb-12 md:mb-16 w-full md:w-auto px-2">
          <Link
            href="/infos"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3">
            <span>Material Teórico</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#graphics"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3">
            <span>Computação Gráfica</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#multimidia"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3">
            <span>Multimídia</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#ia"
            className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold text-base md:text-lg transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3">
            <span>Inteligência Computacional</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
