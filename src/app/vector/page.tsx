"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Focus } from "lucide-react";

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    input[type=range]::-webkit-slider-thumb { cursor: grab; }
    input[type=range]::-moz-range-thumb { cursor: grab; border-radius: 0; }
  `}</style>
);

const VectorSVG = ({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) => {
  const scale = 1 + (zoom / 100) * 1.8;
  return (
    <svg
      className="relative z-10"
      width="180"
      height="180"
      viewBox="0 0 100 100"
      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
    >
      <circle cx="50" cy="50" r="38" fill="none" stroke="#2e2e2e" strokeWidth="1" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#3a3a3a" strokeWidth="0.5" />
      <polygon
        points="50,14 61,38 88,38 66,55 74,80 50,64 26,80 34,55 12,38 39,38"
        fill="none"
        stroke="#4a7a8a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="5" fill="#4a7a8a" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
    </svg>
  );
};

const RasterSVG = ({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) => {
  const scale = 1 + (zoom / 100) * 1.8;
  const blur = 0;
  const quality = 80;
  const blockSize = Math.max(1, Math.floor((1 - quality / 100) * 8));

  return (
    <svg
      className="relative z-10 [image-rendering:pixelated]"
      width="180"
      height="180"
      viewBox="0 0 100 100"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        filter: `blur(${blur}px)`,
      }}
    >
      <defs>
        <pattern id="px" x="0" y="0" width={blockSize} height={blockSize} patternUnits="userSpaceOnUse">
          <rect width={blockSize} height={blockSize} fill="none" stroke="#1a1a1a" strokeWidth="0.3" />
        </pattern>
      </defs>

      <circle cx="50" cy="50" r="38" fill="none" stroke="#2e2e2e" strokeWidth="1" />
      <circle cx="50" cy="50" r="24" fill="none" stroke="#3a3a3a" strokeWidth="0.5" />
      <polygon
        points="50,14 61,38 88,38 66,55 74,80 50,64 26,80 34,55 12,38 39,38"
        fill="none"
        stroke="#7a5a4a"
        strokeWidth="1.2"
        strokeLinejoin="round"
        style={{ shapeRendering: "crispEdges" }}
      />
      <circle cx="50" cy="50" r="5" fill="#7a5a4a" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      <rect width="100" height="100" fill="url(#px)" />
    </svg>
  );
};

export default function ImageComparison() {
  const [globalZoom, setGlobalZoom] = useState(30);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      setPan((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const badgeColor = (cls: string) => {
    if (cls === "good") return "text-[#5a8a5a]";
    if (cls === "bad") return "text-[#8a5a5a]";
    return "text-[#7a7a5a]";
  };

  const inputClasses = "flex-1 h-[1px] bg-[#222] appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[10px] [&::-webkit-slider-thumb]:bg-[#c8c8c8] [&::-webkit-slider-thumb]:border-none [&::-moz-range-thumb]:w-[10px] [&::-moz-range-thumb]:h-[10px] [&::-moz-range-thumb]:bg-[#c8c8c8] [&::-moz-range-thumb]:border-none";

  return (
    <div className={`min-h-screen bg-[#0d0d0d] text-[#e0e0e0] pb-20 font-['DM_Sans',_sans-serif] ${isDragging ? 'select-none' : ''}`}>
      <FontImport />

      <header className="flex items-end justify-between gap-8 pt-10 px-16 pb-6 border-b border-[#222]">
        <div>
          <div className="font-['IBM_Plex_Mono',_monospace] text-[11px] text-[#555] tracking-[0.15em] uppercase mb-2.5 pl-12">
            Multimídia - Vetorial vs Matricial
          </div>
          <h1 className="flex items-center gap-4 text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[#f0f0f0]">
            <Link href="/" className="flex items-center text-[#888] no-underline transition-all duration-200 hover:text-white" title="Voltar para a Home">
              <ArrowLeft size={32} strokeWidth={1} />
            </Link>
            <span>
              <strong className="font-medium text-white">Vetorial</strong> vs <strong className="font-medium text-white">Matricial</strong>
            </span>
          </h1>
        </div>
        <div className="font-['IBM_Plex_Mono',_monospace] text-[11px] text-[#444] text-right leading-[1.8]">
          <div>PNG · JPG · WebP · SVG</div>
        </div>
      </header>

      <div className="px-16">
        <div className="flex items-center gap-6 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pt-10 pb-4 mb-8 border-b border-[#1a1a1a]">
          01 <span className="text-[#333]">—</span> Visualização interativa
        </div>

        <div className="grid grid-cols-2 gap-[2px] bg-[#1a1a1a] mb-[2px]">
          {/* VECTOR PANEL */}
          <div className="bg-[#0d0d0d] p-10 pt-5">
            <div className="flex items-baseline gap-4 mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">formato</span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">Vetorial</span>
              <span className="font-['IBM_Plex_Mono',_monospace] text-xs text-[#3a3a3a] ml-auto">.svg</span>
            </div>

            <div 
              className="flex items-center justify-center relative overflow-hidden h-[280px] mb-8 bg-[#111] border border-[#1e1e1e] cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}            >
              <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              />
              <VectorSVG zoom={globalZoom} pan={pan} />
              <button
                className="absolute bottom-3 left-[14px] z-20 text-[#555] hover:text-[#f0f0f0] transition-colors"
                title="Centralizar Visualização"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setGlobalZoom(30);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <Focus size={18} strokeWidth={1.5} />
              </button>
              <div className="absolute bottom-3 right-[14px] font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555] tracking-[0.1em] z-20 pointer-events-none">
                {globalZoom}% zoom
              </div>
            </div>

            <div className="flex flex-col gap-[18px] mb-8">
              <div className="flex items-center gap-4">
                <span className="w-[90px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#444] tracking-[0.08em]">ZOOM</span>
                <input
                  type="range" min={0} max={100} value={globalZoom}
                  onChange={(e) => setGlobalZoom(Number(e.target.value))}
                  className={inputClasses}
                />
                <span className="w-[36px] shrink-0 text-right font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555]">{globalZoom}%</span>
              </div>
            </div>

            <div className="pt-7 border-t border-[#1a1a1a]">
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-[14px] last:mb-0">
                Imagens vetoriais são definidas por equações matemáticas — curvas de Bézier, arcos e primitivas
                geométricas armazenadas como instruções, não como pixels. O arquivo descreve <em className="italic">como</em> desenhar
                a forma, e o renderizador resolve isso em tempo real para qualquer resolução de saída.
              </p>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-[14px] last:mb-0">
                Em SVG, cada elemento é um nó DOM acessível via <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">getAttribute</code> e <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">setAttribute</code>.
                Em PDF/EPS, as instruções seguem um modelo de stream de operadores (
                <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">moveto</code>, <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">curveto</code>, <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">fill</code>). Isso torna o formato
                intrinsecamente escalável: ampliar 4000× não degrada nitidez porque não há amostragem discreta
                envolvida.
              </p>

              <div className="mt-5 flex flex-col">
                <div className="flex py-[9px] border-b border-[#181818] border-t-[1px]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">REPRESENTAÇÃO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Equações paramétricas + primitivas geométricas</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">ESCALONAMENTO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Lossless — resolução independente</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">TAMANHO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Proporcional à complexidade do caminho, não à área</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">IDEAL PARA</span>
                  <span className="text-[12.5px] text-[#777] font-light">Logotipos, tipografia, ícones, UI, impressão</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">LIMITAÇÃO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Fotografia e gradientes complexos são custosos</span>
                </div>
              </div>
            </div>
          </div>

          {/* RASTER PANEL */}
          <div className="bg-[#0d0d0d] p-10 pt-5">
            <div className="flex items-baseline gap-4 mb-7 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">formato</span>
              <span className="text-[22px] font-normal text-[#ececec] tracking-[-0.01em]">Matricial</span>
              <span className="font-['IBM_Plex_Mono',_monospace] text-xs text-[#3a3a3a] ml-auto">.png / .jpg / .webp</span>
            </div>

            <div 
              className="flex items-center justify-center relative overflow-hidden h-[280px] mb-8 bg-[#111] border border-[#1e1e1e] cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}
              />
              <RasterSVG zoom={globalZoom} pan={pan} />
              <button
                className="absolute bottom-3 left-[14px] z-20 text-[#555] hover:text-[#f0f0f0] transition-colors"
                title="Centralizar Visualização"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setGlobalZoom(30);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <Focus size={18} strokeWidth={1.5} />
              </button>
              <div className="absolute bottom-3 right-[14px] font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555] tracking-[0.1em] z-20 pointer-events-none">
                {globalZoom}% zoom
              </div>
            </div>

            <div className="flex flex-col gap-[18px] mb-8">
              <div className="flex items-center gap-4">
                <span className="w-[90px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#444] tracking-[0.08em]">ZOOM</span>
                <input
                  type="range" min={0} max={100} value={globalZoom}
                  onChange={(e) => setGlobalZoom(Number(e.target.value))}
                  className={inputClasses}
                />
                <span className="w-[36px] shrink-0 text-right font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#555]">{globalZoom}%</span>
              </div>
            </div>

            <div className="pt-7 border-t border-[#1a1a1a]">
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-[14px] last:mb-0">
                Imagens matriciais (bitmap) armazenam informação como uma grade bidimensional de pixels —
                cada célula contém valores numéricos de canal de cor (ex: <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">R, G, B, A</code> em 8 bits
                por canal = 32 bits por pixel). A qualidade da imagem é fixada no momento da exportação:
                a resolução em pixels por polegada (DPI/PPI) determina o nível de detalhe disponível.
              </p>
              <p className="text-[13.5px] font-light text-[#888] leading-[1.75] mb-[14px] last:mb-0">
                Ao ampliar além da resolução nativa, algoritmos de interpolação como{" "}
                <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">nearest-neighbor</code>, <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">bilinear</code> ou <code className="font-['IBM_Plex_Mono',_monospace] text-[11.5px] text-[#666] bg-[#161616] px-[5px] py-[1px]">bicubic</code> estimam valores
                para os novos pixels — gerando o artefato de pixelação ou borrão característico.
                Formatos com compressão com perda como JPEG aplicam a Transformada Discreta de Cossenos
                (DCT) por blocos de 8×8, descartando informação de alta frequência irreversível.
              </p>

              <div className="mt-5 flex flex-col">
                <div className="flex py-[9px] border-b border-[#181818] border-t-[1px]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">REPRESENTAÇÃO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Grade de pixels — valores discretos por canal</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">ESCALONAMENTO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Lossy — interpolação ao ampliar</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">TAMANHO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Proporcional à área (largura × altura × bit depth)</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">IDEAL PARA</span>
                  <span className="text-[12.5px] text-[#777] font-light">Fotografia, capturas de tela, texturas, render 3D</span>
                </div>
                <div className="flex py-[9px] border-b border-[#181818]">
                  <span className="w-[130px] shrink-0 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3e3e3e] tracking-[0.08em] pt-[1px]">LIMITAÇÃO</span>
                  <span className="text-[12.5px] text-[#777] font-light">Redimensionamento destrutivo; tamanho de arquivo alto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COMPARISON TABLE */}
        <div className="bg-[#0d0d0d] py-8 px-10 border-t-2 border-[#1a1a1a]">
          <div className="flex items-center gap-6 font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pb-4 mb-6 border-b border-[#1a1a1a]">
            02 <span className="text-[#333]">—</span> Tabela comparativa
          </div>
          <div className="grid grid-cols-2 gap-16">
            {/* Vector col */}
            <div>
              <div className="text-[13px] text-[#555] font-light mb-5">Vetorial</div>
              {[
                ["Escalabilidade",     "Perfeita",       "good"],
                ["Suporte fotografia", "Inadequado",     "bad"],
                ["Editabilidade",      "Alta (por nó)",  "good"],
                ["Renderização",       "CPU/GPU em RT",  "mid"],
                ["Compressão",         "SVGZ (gzip)",    "mid"],
                ["Interatividade web", "Nativa via DOM", "good"],
                ["Compatibilidade",    "Limitada",       "mid"],
              ].map(([attr, val, cls]) => (
                <div className="flex justify-between items-center py-[11px] border-b border-[#181818] first:border-t-[1px]" key={attr}>
                  <span className="font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3a3a3a] tracking-[0.08em]">{attr}</span>
                  <span className={`font-['IBM_Plex_Mono',_monospace] text-[10px] tracking-[0.06em] ${badgeColor(cls)}`}>{val}</span>
                </div>
              ))}
            </div>
            {/* Raster col */}
            <div>
              <div className="text-[13px] text-[#555] font-light mb-5">Matricial</div>
              {[
                ["Escalabilidade",     "Dependente de DPI",  "bad"],
                ["Suporte fotografia", "Excelente",          "good"],
                ["Editabilidade",      "Por pixel/camada",   "mid"],
                ["Renderização",       "Direta (blitting)",  "good"],
                ["Compressão",         "Lossy/lossless",     "mid"],
                ["Interatividade web", "Via canvas/WebGL",   "mid"],
                ["Compatibilidade",    "Universal",          "good"],
              ].map(([attr, val, cls]) => (
                <div className="flex justify-between items-center py-[11px] border-b border-[#181818] first:border-t-[1px]" key={attr}>
                  <span className="font-['IBM_Plex_Mono',_monospace] text-[10px] text-[#3a3a3a] tracking-[0.08em]">{attr}</span>
                  <span className={`font-['IBM_Plex_Mono',_monospace] text-[10px] tracking-[0.06em] ${badgeColor(cls)}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
