"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, AlertTriangle, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { Slider } from "@/components/ui/Slider";

// Sinal contínuo fixo — apenas a taxa de amostragem é controlável.
const F0 = 6;
const FS_MIN = 3;
const FS_MAX = 40;
const FS_DEFAULT = 8; // abaixo de Nyquist (12Hz) por padrão, para expor o aliasing de imediato.
const WINDOW = 1; // janela fixa de 1s — nº de amostras visíveis = fs + 1, sem "degraus".

const aliasFreq = (f0: number, fs: number) => {
  let f = ((f0 % fs) + fs) % fs;
  if (f > fs / 2) f = fs - f;
  return f;
};

type Layers = { original: boolean; constructed: boolean; points: boolean };

export default function AliasingPage() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [tgtFs, setTgtFs] = useState(FS_DEFAULT);
  const curFsRef = useRef(FS_DEFAULT);

  const [layers, setLayers] = useState<Layers>({ original: true, constructed: true, points: true });
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);

  const toggleLayer = (key: keyof Layers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    let animationFrameId: number;
    let W = 0, H = 0;
    const SPEED = 0.12;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      if (!wrap) return;
      W = wrap.clientWidth;
      H = Math.round(W * 0.34);
      canvas.width = W;
      canvas.height = H;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpRGB = (a: number[], b: number[], t: number) => [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];

    const COL_ORIG = [150, 150, 150]; // sinal original
    const COL_MARK = [110, 168, 216]; // pontos amostrados sobre o sinal original
    const COL_OK = [70, 200, 80]; // sinal construído, fiel ao original
    const COL_ALIAS = [220, 70, 70]; // sinal construído, com aliasing

    const draw = () => {
      const fs = curFsRef.current;
      const nyq = fs / 2;
      const fa = aliasFreq(F0, fs);
      const eps = Math.max(F0 * 0.06, 0.3);
      const mix = Math.max(0, Math.min(1, (F0 - nyq) / eps));
      const { original, constructed, points } = layersRef.current;

      ctx.clearRect(0, 0, W, H);

      const tEnd = WINDOW;
      const xOf = (t: number) => (t / tEnd) * W;
      const steps = W * 2;
      const cy = H / 2;
      const amp = H * 0.36;
      const yOf = (v: number) => cy - v * amp;

      // grade de fundo
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      const gs = 24;
      for (let x = 0; x <= W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // eixo zero
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      // sinal original (fixo)
      if (original) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * tEnd;
          const v = Math.sin(2 * Math.PI * F0 * t);
          i === 0 ? ctx.moveTo(xOf(t), yOf(v)) : ctx.lineTo(xOf(t), yOf(v));
        }
        ctx.strokeStyle = `rgba(${COL_ORIG.join(",")},0.75)`;
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // amostras: onde o sinal original é lido
      const nSamples = Math.floor(fs * tEnd) + 1;
      const dt = 1 / fs;
      const samples: { t: number; v: number }[] = [];
      for (let i = 0; i < nSamples; i++) {
        const t = i * dt;
        if (t > tEnd + 0.001) break;
        samples.push({ t, v: Math.sin(2 * Math.PI * F0 * t) });
      }

      // sinal construído: liga as amostras — verde se fiel, vermelho se aliasing
      if (constructed) {
        const discRGB = lerpRGB(COL_OK, COL_ALIAS, mix);
        ctx.beginPath();
        samples.forEach((s, i) => {
          i === 0 ? ctx.moveTo(xOf(s.t), yOf(s.v)) : ctx.lineTo(xOf(s.t), yOf(s.v));
        });
        ctx.strokeStyle = `rgba(${discRGB.join(",")},0.95)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // pontos do sinal construído (hastes + marcadores, na própria curva original)
      if (points) {
        ctx.strokeStyle = `rgba(${COL_MARK.join(",")},0.5)`;
        ctx.lineWidth = 1.5;
        for (const s of samples) {
          ctx.beginPath(); ctx.moveTo(xOf(s.t), cy); ctx.lineTo(xOf(s.t), yOf(s.v)); ctx.stroke();
        }
        for (const s of samples) {
          ctx.beginPath();
          ctx.arc(xOf(s.t), yOf(s.v), 4.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${COL_MARK.join(",")},0.95)`;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      const eps = 0.01;
      const prev = curFsRef.current;
      curFsRef.current = Math.abs(prev - tgtFs) > eps ? lerp(prev, tgtFs, SPEED) : tgtFs;
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [tgtFs]);

  const fsT = Math.round(tgtFs);
  const nyqT = fsT / 2;
  const faT = aliasFreq(F0, fsT);
  const hasAlias = fsT < 2 * F0;
  const oversampling = fsT / F0;

  return (
    <div className="pf-surface min-h-screen bg-[var(--pf-bg)] text-[var(--pf-fg)] font-sans font-light overflow-x-hidden pb-20 transition-colors duration-200">
      <header className="flex items-end justify-between gap-8 pt-5 px-16 pb-6 border-b border-[var(--pf-border-strong)]">
        <div>
          <div className="font-sans text-[11px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase mb-2.5 pl-12">
            Computação Gráfica — Amostragem
          </div>
          <h1 className="flex items-center gap-4 text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[var(--pf-fg-strong)] m-0">
            <Link
              href="/"
              className="flex items-center text-[var(--pf-fg-muted)] no-underline transition-all duration-200 hover:text-[var(--pf-fg-strong)]"
              title="Voltar para a Home"
            >
              <ArrowLeft size={32} strokeWidth={1} />
            </Link>
            <span>
              <strong className="font-medium text-[var(--pf-fg-strong)]">Sampling</strong> &amp; <strong className="font-medium text-[var(--pf-fg-strong)]">Aliasing</strong>
            </span>
          </h1>
        </div>
        <div className="flex items-start gap-6">
          <div className="font-sans text-[11px] text-[var(--pf-fg-faint)] text-right leading-[1.8]">
            <div>Nyquist · Shannon</div>
            <div>f₀ fixo · fₛ variável</div>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 shrink-0 text-[var(--pf-fg-muted)] hover:text-[var(--pf-fg-strong)] border border-[var(--pf-border-strong)] hover:border-[var(--pf-accent)] rounded transition-colors"
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <div className="px-16 mt-8">
        <div className="relative bg-[#111] border border-[#1e1e1e] overflow-hidden" ref={wrapRef}>
          <canvas ref={canvasRef} className="block w-full"></canvas>
          <div className="absolute font-mono text-[20px] text-[#555] tracking-widest pointer-events-none top-2.5 right-3.5">{fsT}Hz</div>

          {hasAlias && (
            <div className="absolute left-0 right-0 bottom-0 flex items-center gap-2.5 py-2.5 px-3.5 bg-[rgba(22,5,5,0.92)] border-t border-[#552222] backdrop-blur-[1px]">
              <AlertTriangle size={15} strokeWidth={1.75} className="text-[#e08080] shrink-0" />
              <div className="font-sans text-[13px] font-normal leading-[1.4] text-[#e08080]">
                Aliasing — parece um sinal de {faT.toFixed(1)} Hz.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 items-center py-2.5 px-3.5 border border-[#1e1e1e] border-t-0 bg-[#0d0d0d] flex-wrap">
          <button
            onClick={() => toggleLayer("original")}
            className={`flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] px-2.5 py-1.5 border transition-colors cursor-pointer ${
              layers.original ? "border-[#333] text-[#c8c8c8]" : "border-transparent text-[#555]"
            }`}
          >
            <div className={`w-5 h-[2px] ${layers.original ? "bg-[#969696]" : "bg-[#444]"}`}></div>
            sinal original
          </button>
          <button
            onClick={() => toggleLayer("constructed")}
            className={`flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] px-2.5 py-1.5 border transition-colors cursor-pointer ${
              layers.constructed ? "border-[#333] text-[#c8c8c8]" : "border-transparent text-[#555]"
            }`}
          >
            <div className="w-5 h-[2px]" style={{ background: !layers.constructed ? '#444' : hasAlias ? '#dc4646' : '#46c850' }}></div>
            <span>sinal construído {hasAlias ? '(com aliasing)' : '(fiel ao original)'}</span>
          </button>
          <button
            onClick={() => toggleLayer("points")}
            className={`flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] px-2.5 py-1.5 border transition-colors cursor-pointer ${
              layers.points ? "border-[#333] text-[#c8c8c8]" : "border-transparent text-[#555]"
            }`}
          >
            <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={layers.points ? "#6ea8d8" : "#444"}/></svg>
            pontos amostrados
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-[var(--pf-border)] mt-0.5">
          <div className="bg-[var(--pf-bg)] py-6 px-7">
            <div className="flex items-center gap-4 mb-3.5">
              <span className="text-[18px] font-normal text-[var(--pf-fg-strong)] tracking-tight">Taxa de Amostragem</span>
              <Slider
                min={FS_MIN}
                max={FS_MAX}
                step={1}
                value={tgtFs}
                onChange={setTgtFs}
                aria-label="Taxa de amostragem"
                className="flex-1"
              />
              <span className="w-11 shrink-0 text-right font-mono text-[14px] text-[var(--pf-fg-strong)] font-medium">{fsT}</span>
            </div>
            <div className="mt-3.5 text-[13px] font-light text-[var(--pf-fg-muted)] leading-[1.7]">
              Único parâmetro controlável. Arraste para baixo do limite de Nyquist para provocar aliasing, ou acima para uma reconstrução fiel.
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">limite de nyquist</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{nyqT} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">taxa de superamostragem</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{oversampling.toFixed(2)}×</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[12px] text-[var(--pf-fg-muted)] tracking-[0.08em] uppercase">frequência alias</span>
                <span className="font-mono text-[12px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#dc4646' : 'var(--pf-fg)' }}>{hasAlias ? `${faT.toFixed(1)} Hz` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[12px] text-[var(--pf-fg-muted)] tracking-[0.08em] uppercase">estado</span>
                <span className="font-mono text-[12px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#dc4646' : '#2f9e46' }}>{hasAlias ? 'ALIASING' : 'SEM ALIASING'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--pf-bg)] py-6 px-7">
            <div className="flex items-center gap-4 mb-3.5">
              <span className="text-[18px] font-normal text-[var(--pf-fg-strong)] tracking-tight">Sinal de Entrada</span>
              <span className="font-mono text-[13px] text-[var(--pf-fg-faint)] tracking-[0.06em]">fixo, não editável</span>
            </div>
            <div className="mt-3.5 text-[13px] font-light text-[var(--pf-fg-muted)] leading-[1.7]">
              A senoide contínua acima permanece constante em {F0} Hz. Só a taxa de amostragem muda — assim fica claro que o aliasing é resultado exclusivo de <em className="italic">como</em> o sinal foi medido, não de qualquer alteração no sinal original.
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">frequência do sinal (f₀)</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{F0} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">fₛ ≥ 2·f₀ ?</span>
                <span className="font-mono text-[11px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#a8453a' : '#2f9e46' }}>{hasAlias ? 'não' : 'sim'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">recuperação</span>
                <span className="font-mono text-[11px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#a8453a' : '#2f9e46' }}>{hasAlias ? 'impossível' : 'perfeita'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">aplicação</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">áudio · imagem · vídeo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.2em] uppercase mt-8 pb-3.5">
          02 <span className="text-[var(--pf-border-strong)]">—</span> Fundamentos teóricos
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-[var(--pf-border)] border-t-2 border-[var(--pf-border)]">
          <div className="bg-[var(--pf-bg)] py-7 px-8">
            <h3 className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[var(--pf-border)]">Teorema de Nyquist–Shannon</h3>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-3">
              Para reconstruir um sinal de frequência <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">f₀</code> sem distorção, a taxa de amostragem <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">fₛ</code> deve satisfazer <strong className="font-medium text-[var(--pf-fg)]">fₛ &gt; 2·f₀</strong>. Este limiar é chamado de <strong className="font-medium text-[var(--pf-fg)]">frequência de Nyquist</strong>.
            </p>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75]">
              Quando a condição é atendida, o Teorema da Amostragem garante que o sinal contínuo original pode ser recuperado <em className="italic">exatamente</em> a partir das amostras discretas — o sinal construído (verde) acompanha de perto a curva cinza.
            </p>
          </div>
          <div className="bg-[var(--pf-bg)] py-7 px-8">
            <h3 className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[var(--pf-border)]">Aliasing — Frequência Fantasma</h3>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-3">
              Quando <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">fₛ &lt; 2·f₀</code>, ocorre <strong className="font-medium text-[var(--pf-fg)]">aliasing</strong>: os mesmos pontos amostrados (bolinhas azuis) também pertencem a uma senoide de frequência muito mais baixa. É essa senoide — não a original — que o sinal construído (vermelho) acaba representando.
            </p>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75]">
              A frequência alias é calculada por <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">f_alias = | f₀ − round(f₀/fₛ)·fₛ |</code>. O artefato é irreversível — amostrado com fₛ insuficiente, a informação original não pode ser recuperada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
