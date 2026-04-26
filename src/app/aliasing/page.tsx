"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";

export default function AliasingPage() {
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

    const COL_ORIG = [85, 85, 85];
    const COL_OK = [90, 138, 90];
    const COL_ALIAS = [138, 90, 90];
    const COL_SAMPLE = [200, 200, 200];

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
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tEnd;
        const v = Math.sin(2 * Math.PI * f0 * t);
        i === 0 ? ctx.moveTo(xOf(t), yOf(v)) : ctx.lineTo(xOf(t), yOf(v));
      }
      ctx.strokeStyle = `rgba(${COL_ORIG.join(',')},0.55)`;
      ctx.lineWidth = 1;
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
      ctx.strokeStyle = `rgba(${recRGB.join(',')},${lerp(0.65, 0.9, mix)})`;
      ctx.lineWidth = lerp(1, 1.5, mix);
      ctx.setLineDash(mix > 0.05 ? [lerp(0, 8, mix), lerp(0, 5, mix)] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      const nSamples = Math.ceil(fs * tEnd) + 1;
      const dt = 1 / (fs || 1);
      ctx.strokeStyle = 'rgba(200,200,200,0.08)';
      ctx.lineWidth = 1;
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
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] font-sans font-light overflow-x-hidden pb-20">
      <header className="flex items-end justify-between gap-8 py-5 px-6 sm:px-16 border-b border-[#222]">
        <div>
          <div className="font-mono text-[11px] text-[#555] tracking-[0.15em] uppercase mb-2.5">
            Computação Gráfica — Amostragem
          </div>
          <h1 className="text-[36px] font-light tracking-tight leading-tight text-[#f0f0f0] m-0">
            <strong className="font-medium text-white">Sampling</strong> &amp; <strong className="font-medium text-white">Aliasing</strong>
          </h1>
        </div>
        <div className="font-mono text-[11px] text-[#444] text-right leading-loose">
          <div>Nyquist · Shannon</div>
          <div>f₀ · fₛ · f_alias</div>
        </div>
      </header>

      <div className="px-6 sm:px-16 mt-8">
        <div className="flex items-center gap-6 font-mono text-[10px] text-[#444] tracking-[0.2em] uppercase pb-3.5 mb-7 border-b border-[#1a1a1a]">
          01 <span className="text-[#333]">—</span> Visualização interativa
        </div>

        <div className="relative bg-[#111] border border-[#1e1e1e] overflow-hidden" ref={wrapRef}>
          <canvas ref={canvasRef} className="block w-full"></canvas>
          <div className="absolute font-mono text-[10px] text-[#555] tracking-widest pointer-events-none top-2.5 left-3.5">sinal original (f₀)</div>
          <div className="absolute font-mono text-[10px] text-[#555] tracking-widest pointer-events-none top-2.5 right-3.5">fₛ = {fsT} Hz</div>
          <div className="absolute font-mono text-[10px] text-[#555] tracking-widest pointer-events-none bottom-2.5 left-3.5">signal domain</div>
          <div className="absolute font-mono text-[10px] text-[#555] tracking-widest pointer-events-none bottom-2.5 right-3.5">{hasAlias ? `f_alias = ${faT.toFixed(1)} Hz` : 'sem alias'}</div>
        </div>

        <div className="flex gap-7 items-center py-2.5 px-3.5 border border-[#1e1e1e] border-t-0 bg-[#0d0d0d] flex-wrap">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#444] tracking-[0.06em]">
            <div className="w-5 h-px bg-[#555]"></div>
            sinal original (f₀)
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#444] tracking-[0.06em]">
            <svg className="w-1.75 h-1.75 shrink-0" viewBox="0 0 7 7"><rect width="7" height="7" fill="#c8c8c8"/></svg>
            amostras
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#444] tracking-[0.06em]">
            <div className="w-5 h-px" style={{ background: hasAlias ? '#8a5a5a' : '#5a8a5a' }}></div>
            <span>{hasAlias ? 'sinal com aliasing' : 'sinal reconstruído'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-[#1a1a1a] mt-0.5">
          <div className="bg-[#0d0d0d] py-6 px-7">
            <div className="flex items-baseline gap-3.5 pb-4.5 mb-5 border-b border-[#1e1e1e]">
              <span className="font-mono text-[10px] text-[#555] tracking-[0.18em] uppercase">parâmetro</span>
              <span className="text-[20px] font-normal text-[#ececec] tracking-tight">Taxa de Amostragem</span>
              <span className="font-mono text-[11px] text-[#3a3a3a] ml-auto">.fₛ = {fsT} Hz</span>
            </div>
            <div className="flex items-center gap-4 mb-3.5">
              <span className="w-22.5 shrink-0 font-mono text-[10px] text-[#444] tracking-[0.08em] uppercase">fₛ (hz)</span>
              <input 
                type="range" min="2" max="60" value={tgt.fs} step="1" 
                onChange={(e) => setTgt({...tgt, fs: parseFloat(e.target.value)})} 
                className="flex-1 h-px bg-[#222] appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#c8c8c8] [&::-webkit-slider-thumb]:cursor-grab"
              />
              <span className="w-11 shrink-0 text-right font-mono text-[10px] text-[#555]">{fsT}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="font-mono text-[9px] text-[#3a3a3a] tracking-[0.06em] whitespace-nowrap">nyquist</span>
              <div className="flex-1 h-px bg-[#1e1e1e] relative">
                <div className="h-full transition-all duration-100 ease-linear" style={{ width: `${pct}%`, background: hasAlias ? '#8a5a5a' : '#5a8a5a' }}></div>
                <div className="absolute -top-1 left-1/2 w-px h-2.25 bg-[#555]"></div>
              </div>
              <span className="font-mono text-[9px] text-[#3a3a3a] tracking-[0.06em] whitespace-nowrap">fₛ/2 = {nyqT} Hz</span>
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">frequência original</span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-[#7a7a5a]">{f0T} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">limite de nyquist</span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-[#7a7a5a]">{nyqT} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">frequência alias</span>
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: hasAlias ? '#8a5a5a' : '#3e3e3e' }}>{hasAlias ? `${faT.toFixed(1)} Hz` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">estado</span>
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: hasAlias ? '#8a5a5a' : '#5a8a5a' }}>{hasAlias ? 'ALIAS — distorção detectada' : 'OK — sem distorção'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d0d] py-6 px-7">
            <div className="flex items-baseline gap-3.5 pb-4.5 mb-5 border-b border-[#1e1e1e]">
              <span className="font-mono text-[10px] text-[#555] tracking-[0.18em] uppercase">parâmetro</span>
              <span className="text-[20px] font-normal text-[#ececec] tracking-tight">Frequência do Sinal</span>
              <span className="font-mono text-[11px] text-[#3a3a3a] ml-auto">.f₀ = {f0T} Hz</span>
            </div>
            <div className="flex items-center gap-4 mb-3.5">
              <span className="w-22.5 shrink-0 font-mono text-[10px] text-[#444] tracking-[0.08em] uppercase">f₀ (hz)</span>
              <input 
                type="range" min="1" max="30" value={tgt.f0} step="1" 
                onChange={(e) => setTgt({...tgt, f0: parseFloat(e.target.value)})} 
                className="flex-1 h-px bg-[#222] appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#c8c8c8] [&::-webkit-slider-thumb]:cursor-grab"
              />
              <span className="w-11 shrink-0 text-right font-mono text-[10px] text-[#555]">{f0T}</span>
            </div>
            <div className="mt-3.5 text-[12px] font-light text-[#555] leading-[1.7]">
              Frequência do sinal contínuo de entrada. Aumente até ultrapassar o limite de Nyquist (fₛ/2) para induzir aliasing e observar o surgimento da frequência fantasma no sinal reconstruído.
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center py-2.25 border-b border-t border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">fₛ ≥ 2·f₀ ?</span>
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: hasAlias ? '#8a5a5a' : '#5a8a5a' }}>{hasAlias ? 'não' : 'sim'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">recuperação</span>
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: hasAlias ? '#8a5a5a' : '#5a8a5a' }}>{hasAlias ? 'impossível' : 'perfeita'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">artefato</span>
                <span className="font-mono text-[10px] tracking-[0.06em]" style={{ color: hasAlias ? '#7a7a5a' : '#3e3e3e' }}>{hasAlias ? `alias em ${faT.toFixed(1)} Hz` : 'nenhum'}</span>
              </div>
              <div className="flex justify-between items-center py-2.25 border-b border-[#181818]">
                <span className="font-mono text-[10px] text-[#3e3e3e] tracking-[0.08em] uppercase">aplicação</span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-[#7a7a5a]">áudio · imagem · vídeo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[10px] text-[#444] tracking-[0.2em] uppercase mt-8 pb-3.5 mb-7 border-b border-[#1a1a1a]">
          02 <span className="text-[#333]">—</span> Fundamentos teóricos
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 bg-[#1a1a1a] border-t-2 border-[#1a1a1a]">
          <div className="bg-[#0d0d0d] py-7 px-8">
            <h3 className="font-mono text-[10px] text-[#444] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[#1a1a1a]">Teorema de Nyquist–Shannon</h3>
            <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-3">
              Para reconstruir um sinal de frequência <code className="font-mono text-[11.5px] text-[#666] bg-[#161616] px-1.5 py-px">f₀</code> sem distorção, a taxa de amostragem <code className="font-mono text-[11.5px] text-[#666] bg-[#161616] px-1.5 py-px">fₛ</code> deve satisfazer <strong className="font-medium text-[#b0b0b0]">fₛ &gt; 2·f₀</strong>. Este limiar é chamado de <strong className="font-medium text-[#b0b0b0]">frequência de Nyquist</strong>.
            </p>
            <p className="text-[13.5px] font-light text-[#888] leading-[1.75]">
              Quando a condição é atendida, o Teorema da Amostragem garante que o sinal contínuo original pode ser recuperado <em className="italic">exatamente</em> a partir das amostras discretas, via filtragem passa-baixas ideal.
            </p>
          </div>
          <div className="bg-[#0d0d0d] py-7 px-8">
            <h3 className="font-mono text-[10px] text-[#444] tracking-[0.15em] uppercase mb-3.5 pb-2.5 border-b border-[#1a1a1a]">Aliasing — Frequência Fantasma</h3>
            <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-3">
              Quando <code className="font-mono text-[11.5px] text-[#666] bg-[#161616] px-1.5 py-px">fₛ &lt; 2·f₀</code>, ocorre <strong className="font-medium text-[#b0b0b0]">aliasing</strong>: componentes de frequência acima de Nyquist são dobradas de volta ao espectro em outra frequência, criando um sinal fantasma.
            </p>
            <p className="text-[13.5px] font-light text-[#888] leading-[1.75]">
              A frequência alias é calculada por <code className="font-mono text-[11.5px] text-[#666] bg-[#161616] px-1.5 py-px">f_alias = | f₀ − round(f₀/fₛ)·fₛ |</code>. O artefato é irreversível — amostrado com fₛ insuficiente, a informação original não pode ser recuperada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
