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
const PANEL_SPLIT = 0.58;
const PANEL_GAP = 22;

const aliasFreq = (f0: number, fs: number) => {
  let f = ((f0 % fs) + fs) % fs;
  if (f > fs / 2) f = fs - f;
  return f;
};

export default function AliasingPage() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [tgtFs, setTgtFs] = useState(FS_DEFAULT);
  const curFsRef = useRef(FS_DEFAULT);

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
      H = Math.round(W * 0.48);
      canvas.width = W;
      canvas.height = H;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpRGB = (a: number[], b: number[], t: number) => [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];

    const COL_ORIG = [150, 150, 150]; // sinal contínuo original
    const COL_MARK = [110, 168, 216]; // pontos/hastes de amostragem sobre o sinal original
    const COL_OK = [70, 200, 80]; // sinal discreto sem aliasing
    const COL_ALIAS = [220, 70, 70]; // sinal discreto / fantasma com aliasing

    const draw = () => {
      const fs = curFsRef.current;
      const nyq = fs / 2;
      const fa = aliasFreq(F0, fs);
      const eps = Math.max(F0 * 0.06, 0.3);
      const mix = Math.max(0, Math.min(1, (F0 - nyq) / eps));

      ctx.clearRect(0, 0, W, H);

      const tEnd = 3 / F0;
      const xOf = (t: number) => (t / tEnd) * W;
      const steps = W * 2;

      const splitY = H * PANEL_SPLIT;
      const topH = splitY - PANEL_GAP / 2;
      const botTop = splitY + PANEL_GAP / 2;
      const botH = H - botTop;
      const cyA = topH / 2;
      const cyB = botTop + botH / 2;
      const ampA = topH * 0.38;
      const ampB = botH * 0.4;
      const yA = (v: number) => cyA - v * ampA;
      const yB = (v: number) => cyB - v * ampB;

      // grade de fundo
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 1;
      const gs = 24;
      for (let x = 0; x <= W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // divisor entre os dois painéis
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, splitY); ctx.lineTo(W, splitY); ctx.stroke();
      ctx.setLineDash([]);

      // eixos zero
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cyA); ctx.lineTo(W, cyA); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cyB); ctx.lineTo(W, cyB); ctx.stroke();

      // --- PAINEL A: sinal contínuo fixo ---
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tEnd;
        const v = Math.sin(2 * Math.PI * F0 * t);
        i === 0 ? ctx.moveTo(xOf(t), yA(v)) : ctx.lineTo(xOf(t), yA(v));
      }
      ctx.strokeStyle = `rgba(${COL_ORIG.join(",")},0.75)`;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // curva fantasma (frequência alias) sobreposta ao sinal original, quando presente
      if (mix > 0.02) {
        const recRGB = lerpRGB(COL_OK, COL_ALIAS, mix);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * tEnd;
          const v = Math.sin(2 * Math.PI * fa * t);
          i === 0 ? ctx.moveTo(xOf(t), yA(v)) : ctx.lineTo(xOf(t), yA(v));
        }
        ctx.strokeStyle = `rgba(${recRGB.join(",")},${lerp(0, 0.9, mix)})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // amostras: hastes + pontos mostrando ONDE o sinal original é lido
      const nSamples = Math.floor(fs * tEnd) + 1;
      const dt = 1 / fs;
      const samples: { t: number; v: number }[] = [];
      for (let i = 0; i < nSamples; i++) {
        const t = i * dt;
        if (t > tEnd + 0.001) break;
        samples.push({ t, v: Math.sin(2 * Math.PI * F0 * t) });
      }

      ctx.strokeStyle = `rgba(${COL_MARK.join(",")},0.55)`;
      ctx.lineWidth = 1.5;
      for (const s of samples) {
        ctx.beginPath(); ctx.moveTo(xOf(s.t), cyA); ctx.lineTo(xOf(s.t), yA(s.v)); ctx.stroke();
      }
      for (const s of samples) {
        ctx.beginPath();
        ctx.arc(xOf(s.t), yA(s.v), 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COL_MARK.join(",")},0.95)`;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.stroke();
      }

      // --- PAINEL B: representação do sinal discreto ---
      const discRGB = lerpRGB(COL_OK, COL_ALIAS, mix);
      const discCol = `rgba(${discRGB.join(",")},0.95)`;

      // reconstrução (liga as amostras — mostra o que o sinal discreto "parece" representar)
      ctx.beginPath();
      samples.forEach((s, i) => {
        i === 0 ? ctx.moveTo(xOf(s.t), yB(s.v)) : ctx.lineTo(xOf(s.t), yB(s.v));
      });
      ctx.strokeStyle = discCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      // hastes + pontos do sinal discreto (stem plot)
      for (const s of samples) {
        ctx.beginPath(); ctx.moveTo(xOf(s.t), cyB); ctx.lineTo(xOf(s.t), yB(s.v)); ctx.stroke();
      }
      for (const s of samples) {
        ctx.beginPath();
        ctx.arc(xOf(s.t), yB(s.v), 5, 0, Math.PI * 2);
        ctx.fillStyle = discCol;
        ctx.fill();
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
          <div
            className="absolute font-mono text-[10px] text-[#555] tracking-[0.15em] uppercase pointer-events-none top-2.5 left-3.5"
          >
            sinal contínuo · amostragem
          </div>
          <div
            className="absolute font-mono text-[10px] text-[#555] tracking-[0.15em] uppercase pointer-events-none left-3.5"
            style={{ top: `calc(${PANEL_SPLIT * 100}% + 8px)` }}
          >
            sinal discreto (reconstrução)
          </div>
        </div>

        <div className="flex gap-7 items-center py-2.5 px-3.5 border border-[#1e1e1e] border-t-0 bg-[#0d0d0d] flex-wrap">
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <div className="w-5 h-[2px] bg-[#969696]"></div>
            sinal original (f₀ fixo)
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#6ea8d8"/></svg>
            onde o sinal é amostrado
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <div className="w-5 h-[2px]" style={{ background: hasAlias ? '#dc4646' : '#46c850' }}></div>
            <span>{hasAlias ? 'sinal discreto (com aliasing)' : 'sinal discreto (fiel ao original)'}</span>
          </div>
        </div>

        {hasAlias && (
          <div className="flex items-start gap-3.5 mt-0.5 py-4 px-5 border border-[var(--pf-danger-border)] bg-[var(--pf-danger-bg)]">
            <AlertTriangle size={18} strokeWidth={1.75} className="text-[var(--pf-danger-fg-hover)] shrink-0 mt-0.5" />
            <div className="text-[13.5px] font-light leading-[1.7] text-[var(--pf-danger-fg-hover)]">
              <strong className="font-medium">Aliasing detectado.</strong> A taxa de amostragem (fₛ = {fsT} Hz) é menor que o dobro da frequência do sinal (2·f₀ = {2 * F0} Hz). As amostras coletadas são indistinguíveis das que seriam geradas por um sinal de <strong className="font-medium">{faT.toFixed(1)} Hz</strong> — a frequência fantasma visível no painel inferior. A informação original não pode mais ser recuperada a partir dessas amostras.
            </div>
          </div>
        )}

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
              A senoide contínua abaixo permanece constante em {F0} Hz. Só a taxa de amostragem muda — assim fica claro que o aliasing é resultado exclusivo de <em className="italic">como</em> o sinal foi medido, não de qualquer alteração no sinal original.
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
              Quando a condição é atendida, o Teorema da Amostragem garante que o sinal contínuo original pode ser recuperado <em className="italic">exatamente</em> a partir das amostras discretas, via filtragem passa-baixas ideal — é exatamente o que o painel inferior mostra ao seguir de perto a curva cinza.
            </p>
          </div>
          <div className="bg-[var(--pf-bg)] py-7 px-8">
            <h3 className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[var(--pf-border)]">Aliasing — Frequência Fantasma</h3>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-3">
              Quando <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">fₛ &lt; 2·f₀</code>, ocorre <strong className="font-medium text-[var(--pf-fg)]">aliasing</strong>: as mesmas amostras (bolinhas azuis no painel superior) também pertencem a uma senoide de frequência muito mais baixa — a curva vermelha tracejada. O sinal discreto não tem como distinguir as duas.
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
