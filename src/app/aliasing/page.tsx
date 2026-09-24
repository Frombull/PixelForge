"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme";
import { Slider } from "@/components/ui/Slider";

export default function AliasingPage() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [tgt, setTgt] = useState({ fs: 8, f0: 5 });
  const curRef = useRef({ fs: 8, f0: 5 });
  const [windowWidth, setWindowWidth] = useState(1000);

  useEffect(() => {
    let animationFrameId: number;
    let W = 0, H = 0;
    const SPEED = 0.10;

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!wrap) return;
      W = wrap.clientWidth;
      H = Math.round(W * 0.36);
      canvas.width = W;
      canvas.height = H;
      setWindowWidth(window.innerWidth);
    };

    const aliasFreq = (f0: number, fs: number) => {
      let f = ((f0 % fs) + fs) % fs;
      if (f > fs / 2) f = fs - f;
      return f;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpRGB = (a: number[], b: number[], t: number) => [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t))
    ];

    const COL_ORIG = [160, 160, 160];     // Sinal original do BG
    const COL_OK = [70, 200, 80];         // Sinal sem aliasing
    const COL_ALIAS = [220, 70, 70];      // Sinal com aliasing
    const COL_SAMPLE = [240, 240, 240];   // Sample rects

    const draw = () => {
      const c = curRef.current;
      const fs = c.fs;
      const f0 = c.f0;
      const nyq = fs / 2;
      const fa = aliasFreq(f0, fs);
      const mix = Math.max(0, Math.min(1, (f0 - nyq) / Math.max(nyq * 0.12, 0.3)));

      ctx.clearRect(0, 0, W, H);

      const cy = H / 2;
      const amp = H * 0.38;
      const tEnd = Math.max(1, 2 / (f0 || 1));
      const xOf = (t: number) => (t / tEnd) * W;
      const yOf = (v: number) => cy - v * amp;
      const steps = W * 2;

      ctx.strokeStyle = 'rgba(255,255,255,0.015)';
      ctx.lineWidth = 1;
      const gs = 24;
      for (let x = 0; x <= W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tEnd;
        const v = Math.sin(2 * Math.PI * f0 * t);
        i === 0 ? ctx.moveTo(xOf(t), yOf(v)) : ctx.lineTo(xOf(t), yOf(v));
      }
      ctx.strokeStyle = `rgba(${COL_ORIG.join(',')},0.7)`;
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.lineTo(xOf(tEnd), cy); ctx.lineTo(0, cy); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.01)';
      ctx.fill();

      const freqRec = lerp(f0, fa, mix);
      const recRGB = lerpRGB(COL_OK, COL_ALIAS, mix);
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tEnd;
        const v = Math.sin(2 * Math.PI * freqRec * t);
        i === 0 ? ctx.moveTo(xOf(t), yOf(v)) : ctx.lineTo(xOf(t), yOf(v));
      }
      ctx.strokeStyle = `rgba(${recRGB.join(',')},${lerp(0.85, 1, mix)})`;
      ctx.lineWidth = lerp(2, 3, mix);
      ctx.setLineDash(mix > 0.05 ? [lerp(0, 8, mix), lerp(0, 5, mix)] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      const nSamples = Math.ceil(fs * tEnd) + 1;
      const dt = 1 / (fs || 1);
      ctx.strokeStyle = 'rgba(200,200,200,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < nSamples; i++) {
        const t = i * dt;
        if (t > tEnd + 0.001) break;
        const v = Math.sin(2 * Math.PI * f0 * t);
        ctx.beginPath(); ctx.moveTo(xOf(t), cy); ctx.lineTo(xOf(t), yOf(v)); ctx.stroke();
      }

      for (let i = 0; i < nSamples; i++) {
        const t = i * dt;
        if (t > tEnd + 0.001) break;
        const v = Math.sin(2 * Math.PI * f0 * t);
        ctx.fillStyle = `rgba(${COL_SAMPLE.join(',')},0.75)`;
        ctx.fillRect(xOf(t) - 3, yOf(v) - 3, 6, 6);
      }
    };

    const loop = () => {
      const eps = 0.004;
      const prev = curRef.current;
      const nextFs = Math.abs(prev.fs - tgt.fs) > eps ? lerp(prev.fs, tgt.fs, SPEED) : tgt.fs;
      const nextF0 = Math.abs(prev.f0 - tgt.f0) > eps ? lerp(prev.f0, tgt.f0, SPEED) : tgt.f0;
      curRef.current = { fs: nextFs, f0: nextF0 };
      
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resize);
    resize();
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [tgt]);

  const fsT = Math.round(tgt.fs);
  const f0T = Math.round(tgt.f0);
  const nyqT = fsT / 2;
  
  const aliasFreqHelper = (f0: number, fs: number) => {
    let f = ((f0 % fs) + fs) % fs;
    if (f > fs / 2) f = fs - f;
    return f;
  };
  
  const faT = aliasFreqHelper(f0T, fsT);
  const hasAlias = f0T > nyqT;
  const pct = Math.min((f0T / nyqT) * 50, 100);

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
            <div>f_alias</div>
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
        </div>

        <div className="flex gap-7 items-center py-2.5 px-3.5 border border-[#1e1e1e] border-t-0 bg-[#0d0d0d] flex-wrap">
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <div className="w-5 h-[2px] bg-[#6e6e6e]"></div>
            sinal original (f₀)
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <svg className="w-2 h-2 shrink-0" viewBox="0 0 7 7"><rect width="7" height="7" fill="#f0f0f0"/></svg>
            amostras
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-[#c8c8c8] tracking-[0.06em]">
            <div className="w-5 h-[2px]" style={{ background: hasAlias ? '#dc4646' : '#46c850' }}></div>
            <span>{hasAlias ? 'sinal com aliasing' : 'sinal sem aliasing'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-[var(--pf-border)] mt-0.5">
          <div className="bg-[var(--pf-bg)] py-6 px-7">
            <div className="flex items-center gap-4 mb-3.5">
              <span className="text-[18px] font-normal text-[var(--pf-fg-strong)] tracking-tight">Taxa de Amostragem</span>
              <Slider
                min={2}
                max={60}
                step={1}
                value={tgt.fs}
                onChange={(v) => setTgt({ ...tgt, fs: v })}
                aria-label="Taxa de amostragem"
                className="flex-1"
              />
              <span className="w-11 shrink-0 text-right font-mono text-[14px] text-[var(--pf-fg-strong)] font-medium">{fsT}</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">frequência original</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{f0T} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">limite de nyquist</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{nyqT} Hz</span>
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
              <span className="text-[18px] font-normal text-[var(--pf-fg-strong)] tracking-tight">Frequência do Sinal</span>
              <Slider
                min={1}
                max={30}
                step={1}
                value={tgt.f0}
                onChange={(v) => setTgt({ ...tgt, f0: v })}
                aria-label="Frequência do sinal"
                className="flex-1"
              />
              <span className="w-11 shrink-0 text-right font-mono text-[14px] text-[var(--pf-fg-strong)] font-medium">{f0T}Hz</span>
            </div>
            <div className="mt-3.5 text-[13px] font-light text-[var(--pf-fg-muted)] leading-[1.7]">
              Frequência do sinal contínuo de entrada. Aumente até ultrapassar o limite de Nyquist (fₛ/2) para induzir aliasing e observar o surgimento da frequência fantasma no sinal reconstruído.
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">fₛ ≥ 2·f₀ ?</span>
                <span className="font-mono text-[11px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#a8453a' : '#2f9e46' }}>{hasAlias ? 'não' : 'sim'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">recuperação</span>
                <span className="font-mono text-[11px] tracking-[0.06em] font-medium" style={{ color: hasAlias ? '#a8453a' : '#2f9e46' }}>{hasAlias ? 'impossível' : 'perfeita'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[var(--pf-border)]">
                <span className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.08em] uppercase">artefato</span>
                <span className="font-mono text-[11px] tracking-[0.06em] text-[var(--pf-fg)]">{hasAlias ? `alias em ${faT.toFixed(1)} Hz` : 'nenhum'}</span>
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
              Quando a condição é atendida, o Teorema da Amostragem garante que o sinal contínuo original pode ser recuperado <em className="italic">exatamente</em> a partir das amostras discretas, via filtragem passa-baixas ideal.
            </p>
          </div>
          <div className="bg-[var(--pf-bg)] py-7 px-8">
            <h3 className="font-mono text-[11px] text-[var(--pf-fg-faint)] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[var(--pf-border)]">Aliasing — Frequência Fantasma</h3>
            <p className="text-[14.5px] font-light text-[var(--pf-fg-muted)] leading-[1.75] mb-3">
              Quando <code className="font-mono text-[12.5px] text-[var(--pf-code-fg)] bg-[var(--pf-code-bg)] px-1.5 py-px">fₛ &lt; 2·f₀</code>, ocorre <strong className="font-medium text-[var(--pf-fg)]">aliasing</strong>: componentes de frequência acima de Nyquist são dobradas de volta ao espectro em outra frequência, criando um sinal fantasma.
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
