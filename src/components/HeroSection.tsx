"use client";

import Link from "next/link";
import HeroLogo3D from "@/components/HeroLogo3D";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#15263b_0%,#09111a_42%,#02060b_100%)] px-4 pt-28 text-center md:px-8 md:pt-36">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(92,170,255,0.24),transparent_54%)]" />
      <div className="absolute left-1/2 top-44 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center">
        <div className="mb-8 flex flex-col items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
            <h1 className="px-1 pb-2 text-5xl font-black leading-[1.08] tracking-[-0.04em] text-transparent drop-shadow-2xl bg-gradient-to-r from-slate-100 via-slate-200 to-sky-300 bg-clip-text sm:text-7xl lg:text-[7rem]">
              PixelForge
            </h1>
            <HeroLogo3D />
          </div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 sm:w-36" />
        </div>

        <p className="mb-8 max-w-4xl px-2 text-base leading-relaxed text-slate-100/88 sm:text-xl md:mb-12 md:text-2xl lg:text-3xl">
          Plataforma educacional interativa para
          <span className="font-semibold text-sky-300"> Computação Gráfica</span>,
          <span className="font-semibold text-cyan-200"> Multimídia </span>
          e
          <span className="font-semibold text-amber-200"> Inteligência Computacional</span>.
        </p>

        <div className="mb-12 flex w-full flex-col gap-4 px-2 md:mb-16 md:w-auto md:flex-row md:gap-6">
          <Link
            href="/infos"
            className="group flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/18 md:gap-3 md:px-8 md:py-4 md:text-lg">
            <span>Material Teórico</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#graphics"
            className="group flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/18 md:gap-3 md:px-8 md:py-4 md:text-lg">
            <span>Computação Gráfica</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#multimidia"
            className="group flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/18 md:gap-3 md:px-8 md:py-4 md:text-lg">
            <span>Multimídia</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
          <Link
            href="#ia"
            className="group flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/18 md:gap-3 md:px-8 md:py-4 md:text-lg">
            <span>Inteligência Computacional</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>

        <p className="max-w-2xl text-sm uppercase tracking-[0.28em] text-slate-300/70 sm:text-base">
          Computação Gráfica • Multimídia • Exploração Visual Interativa
        </p>
      </div>
    </section>
  );
}
