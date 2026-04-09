"use client";

import Link from "next/link";
import HeroLogo3D from "@/components/HeroLogo3D";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#13141c] px-6 pt-32 pb-20 sm:px-10">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-5xl gap-8 text-center pt-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-2">
          <h1 className="flex items-baseline gap-2 font-mono text-5xl sm:text-7xl lg:text-[6.5rem] font-bold tracking-tighter text-white">
            <span className="text-sky-400">PixelForge</span>
          </h1>
          <HeroLogo3D />
        </div>

        <p className="max-w-2xl text-lg sm:text-xl text-neutral-400 font-medium leading-relaxed font-mono mt-4">
          <span className="text-neutral-500">// </span>Um laboratório de visualização para
          <span className="text-white"> computação gráfica</span>,
          <span className="text-white"> multimídia</span> e
          <span className="text-white"> IA</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto font-mono text-sm">
          <Link
            href="/infos"
            className="flex items-center justify-center gap-2 rounded bg-white px-8 py-3 font-semibold text-black transition-transform hover:scale-105"
          >
            Material Teórico
          </Link>
          <Link
            href="#graphics"
            className="flex items-center justify-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 px-8 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white hover:border-sky-400/50"
          >
            Computação Gráfica
          </Link>
          <Link
            href="#multimidia"
            className="flex items-center justify-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 px-8 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white hover:border-fuchsia-400/50"
          >
            Multimídia
          </Link>
        </div>

        <div className="mt-16 pt-8 w-full border-t border-neutral-900 flex justify-center">
          <p className="text-[11px] font-mono text-neutral-500">
            <span className="text-green-400">~/pixelforge3d</span> $ ./start.sh --inatel --2026
          </p>
        </div>
      </div>
    </section>
  );
}
