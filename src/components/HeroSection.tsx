"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HeroLogo3D from "@/components/HeroLogo3D";
import HeroVoxelSphere from "@/components/HeroVoxelSphere";

const TERMINAL_COMMAND = "./start.sh --fetin --2026";
const TERMINAL_OUTPUT = [
  "[INFO] GitHub: https://github.com/Frombull/PixelForge",
  "[INFO] Fetin: https://inatel.br/fetin/",
];

export default function HeroSection() {
  const [typedCommand, setTypedCommand] = useState("");
  const [visibleOutputLines, setVisibleOutputLines] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay);
      timers.push(timer);
    };

    setTypedCommand("");
    setVisibleOutputLines(0);

    const typeCommand = (index: number) => {
      if (index > TERMINAL_COMMAND.length) {
        popOutputLine(0, 500);
        return;
      }

      setTypedCommand(TERMINAL_COMMAND.slice(0, index));
      schedule(() => typeCommand(index + 1), 26);
    };

    const popOutputLine = (lineIndex: number, delay: number) => {
      if (lineIndex >= TERMINAL_OUTPUT.length) {
        return;
      }

      schedule(() => {
        setVisibleOutputLines(lineIndex + 1);
        popOutputLine(lineIndex + 1, 1000);
      }, delay);
    };

    typeCommand(1);

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#13141c] px-6 pt-32 pb-20 sm:px-10">
      <div className="app-noise absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div
        className="absolute left-0 top-1/2 z-0 -translate-x-[40%] opacity-30"
        aria-hidden="true">
        <HeroVoxelSphere className="h-72 w-72 sm:h-112 sm:w-md lg:h-160 lg:w-160" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-5xl gap-8 text-center pt-10 pointer-events-none">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-2">
          <h1 className="flex items-baseline gap-2 font-mono text-5xl sm:text-7xl lg:text-[6.5rem] font-bold tracking-tighter text-white">
            <span className="text-sky-400">PixelForge</span>
          </h1>
          <HeroLogo3D />
        </div>

        <p className="max-w-2xl text-lg sm:text-xl text-neutral-400 font-medium leading-relaxed font-mono mt-4">
          <span className="text-neutral-500"></span>Plataforma educacional interativa para
          <span className="text-white"> computação gráfica</span>,
          <span className="text-white"> multimídia</span> e
          <span className="text-white"> IA</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto font-mono text-sm pointer-events-auto">
          <Link
            href="#graphics"
            className="flex items-center justify-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 px-8 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white hover:border-sky-400/50">
            Computação Gráfica
          </Link>
          <Link
            href="#multimidia"
            className="flex items-center justify-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 px-8 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white hover:border-fuchsia-400/50">
            Multimídia
          </Link>
          <Link
            href="#ia"
            className="flex items-center justify-center gap-2 rounded border border-neutral-800 bg-neutral-900/50 px-8 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white hover:border-purple-400/50">
            Inteligência Computacional
          </Link>
          <Link
            href="/infos"
            className="flex items-center justify-center gap-2 rounded bg-white px-8 py-3 font-semibold text-black transition-transform hover:scale-105">
            Material Teórico
          </Link>
        </div>

        <div className="mt-16 pt-8 w-full flex justify-center pointer-events-none">
          <div className="w-full max-w-3xl px-4 py-3 text-center font-mono text-[12px] text-neutral-500 pointer-events-none">
            <p className="h-4 whitespace-nowrap">
              <span className="text-green-400">~/pixelforge3d</span> $ {typedCommand}
              {typedCommand.length < TERMINAL_COMMAND.length && (
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-sky-400 align-middle" />
              )}
            </p>
            <div className="mt-2 h-19 space-y-1 overflow-hidden" aria-live="polite">
              {TERMINAL_OUTPUT.map((line, lineIndex) => (
                <p
                  key={line}
                  className={`h-4 whitespace-nowrap text-neutral-400 transition-all duration-150 ${
                    lineIndex < visibleOutputLines ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                  }`}>
                  {lineIndex < visibleOutputLines ? line : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Link
        href="#graphics"
        aria-label="Descer"
        className="scroll-cue group absolute bottom-7 left-1/2 z-20 -translate-x-1/2 text-neutral-400 transition-colors hover:text-sky-300 focus-visible:text-sky-300">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
          aria-hidden="true">
          <path d="M5.5 7.5L10 12l4.5-4.5" />
        </svg>
      </Link>
    </section>
  );
}
