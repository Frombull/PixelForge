"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-10 bg-bg3">
      <div
        className={`w-full max-w-[720px] bg-bg rounded-xl border border-borderDark overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-bg2 border-b border-borderDark px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-redTheme"></div>
            <div className="w-3 h-3 rounded-full bg-yellowTheme"></div>
            <div className="w-3 h-3 rounded-full bg-greenTheme"></div>
          </div>
          <div className="text-xs text-dim mx-auto font-mono">
            kitty — <span className="text-fg">~/pixelforge</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-[13px] leading-[1.7] font-mono">
          <div className={`flex flex-col sm:flex-row gap-6 sm:gap-8 mb-6 items-start transition-all duration-500 delay-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <div className="shrink-0 text-cyanTheme leading-[1.3]">
              <pre className="m-0 font-mono text-[11px]">
{`        `} <span className="text-whiteTheme">{`/\\`}</span>{`
       `} <span className="text-whiteTheme">{`/  \\`}</span>{`
      `} <span className="text-whiteTheme">{`/\\   \\`}</span>{`
     `} <span className="text-whiteTheme">{`/  __  \\`}</span>{`
    `} <span className="text-whiteTheme">{`/  (  )  \\`}</span>{`
   `} <span className="text-whiteTheme">{`/ __|  |__ \\`}</span>{`
  `} <span className="text-whiteTheme">{`/.//      \\\\.\\`}</span>
              </pre>
            </div>

            <div className={`flex-1 transition-all duration-500 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
              <div className="mb-1.5">
                <span className="text-blueTheme font-bold">user</span>
                <span className="text-dim">@</span>
                <span className="text-magentaTheme font-bold">pixelforge</span>
              </div>
              <div className="h-[1px] bg-borderDark mb-2"></div>
              
              <div className="flex m-0.5 text-xs">
                <span className="text-blueTheme min-w-[110px] font-bold">OS</span>
                <span className="text-fg"><span className="text-cyanTheme">Arch Linux</span> x86_64</span>
              </div>
              <div className="flex m-0.5 text-xs">
                <span className="text-blueTheme min-w-[110px] font-bold">Platform</span>
                <span className="text-fg"><span className="text-whiteTheme">Next.js & React</span></span>
              </div>
              <div className="flex m-0.5 text-xs">
                <span className="text-blueTheme min-w-[110px] font-bold">Shell</span>
                <span className="text-fg"><span className="text-magentaTheme">zsh</span> 5.9</span>
              </div>
              <div className="flex m-0.5 text-xs">
                <span className="text-blueTheme min-w-[110px] font-bold">Project</span>
                <span className="text-fg"><span className="text-cyanTheme">PixelForge</span> <span className="text-dim">// Inatel 2026</span></span>
              </div>
              <div className="flex m-0.5 text-xs">
                <span className="text-blueTheme min-w-[110px] font-bold">Stack</span>
                <span className="text-fg"><span className="text-magentaTheme">Next.js</span> · <span className="text-cyanTheme">Three.js</span> · <span className="text-greenTheme">p5.js</span></span>
              </div>

              <div className="flex gap-1 mt-2.5">
                <div className="w-[18px] h-[18px] rounded-sm bg-redTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-yellowTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-greenTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-cyanTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-blueTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-magentaTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-whiteTheme"></div>
                <div className="w-[18px] h-[18px] rounded-sm bg-dim"></div>
              </div>
            </div>
          </div>

          <hr className={`border-t border-borderDark my-[18px] transition-all duration-300 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`} />

          <div className={`flex items-baseline gap-2 my-1 transition-all duration-300 delay-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span>
              <span className="text-greenTheme font-bold">user</span>
              <span className="text-dim">@</span>
              <span className="text-magentaTheme font-bold">arch</span>{" "}
              <span className="text-blueTheme">~/pixelforge</span>
              <span className="text-whiteTheme ml-0.5"> $</span>
            </span>
            <span>
              <span className="text-magentaTheme">cat</span> <span className="text-cyanTheme">README.md</span>
            </span>
          </div>
          <div className={`pl-1 text-xs text-fg mb-3 transition-all duration-300 delay-[800ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span className="text-whiteTheme">Plataforma educacional de Computação Gráfica e Multimídia.</span><br />
            Transforme conceitos abstratos em <span className="text-cyanTheme">visualizações interativas</span>.
          </div>

          <div className={`flex items-baseline gap-2 my-1 transition-all duration-300 delay-[900ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span>
              <span className="text-greenTheme font-bold">user</span>
              <span className="text-dim">@</span>
              <span className="text-magentaTheme font-bold">arch</span>{" "}
              <span className="text-blueTheme">~/pixelforge</span>
              <span className="text-whiteTheme ml-0.5"> $</span>
            </span>
            <span>
              <span className="text-magentaTheme">ls</span> <span className="text-yellowTheme">-la</span> <span className="text-cyanTheme">modules/</span>
            </span>
          </div>
          <div className={`pl-1 text-xs text-fg mb-3 transition-all duration-300 delay-[1000ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <Link href="#graphics" className="hover:underline flex group">
              <span className="text-blueTheme min-w-[90px]">drwxr-xr-x</span>  <span className="text-cyanTheme min-w-[140px]">computacao-grafica/</span>   <span className="text-dim group-hover:text-blueTheme transition-colors">// módulos 3D</span>
            </Link>
            <Link href="#multimidia" className="hover:underline flex group">
              <span className="text-blueTheme min-w-[90px]">drwxr-xr-x</span>  <span className="text-magentaTheme min-w-[140px]">multimidia/</span>           <span className="text-dim group-hover:text-blueTheme transition-colors">// módulos 2D</span>
            </Link>
            <Link href="#ia" className="hover:underline flex group">
              <span className="text-blueTheme min-w-[90px]">drwxr-xr-x</span>  <span className="text-redTheme min-w-[140px]">inteligencia-comp/</span>    <span className="text-dim group-hover:text-blueTheme transition-colors">// IA</span>
            </Link>
            <Link href="/infos" className="hover:underline flex group">
              <span className="text-blueTheme min-w-[90px]">drwxr-xr-x</span>  <span className="text-yellowTheme min-w-[140px]">material-teorico/</span>     <span className="text-dim group-hover:text-blueTheme transition-colors">// conceitos e infos</span>
            </Link>
          </div>

          <div className={`flex items-baseline gap-2 my-1 transition-all duration-300 delay-[1100ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span>
              <span className="text-greenTheme font-bold">user</span>
              <span className="text-dim">@</span>
              <span className="text-magentaTheme font-bold">arch</span>{" "}
              <span className="text-blueTheme">~/pixelforge</span>
              <span className="text-whiteTheme ml-0.5"> $</span>
            </span>
            <span>
              <span className="text-magentaTheme">pnpm</span> <span className="text-cyanTheme">run</span> <span className="text-greenTheme">dev</span>
            </span>
          </div>
          <div className={`pl-1 text-xs text-fg mb-3 transition-all duration-300 delay-[1200ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span className="text-greenTheme">✓</span> ready on <span className="text-cyanTheme">http://localhost:3000</span><br />
            <span className="text-greenTheme">✓</span> three.js renderer <span className="text-whiteTheme">initialized</span><br />
            <span className="text-greenTheme">✓</span> <span className="text-magentaTheme">modules</span> loaded · <span className="text-greenTheme">● all systems online</span>
          </div>

          <div className={`flex items-center gap-2 mt-1.5 transition-all duration-300 delay-[1300ms] ${mounted ? "opacity-100" : "opacity-0"}`}>
            <span>
              <span className="text-greenTheme font-bold">user</span>
              <span className="text-dim">@</span>
              <span className="text-magentaTheme font-bold">arch</span>{" "}
              <span className="text-blueTheme">~/pixelforge</span>
              <span className="text-whiteTheme ml-0.5"> $</span>
            </span>
            <div className="inline-block w-[9px] h-[16px] bg-blueTheme animate-[pulse_1s_step-end_infinite]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
