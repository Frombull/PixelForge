"use client";

import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    background: #0d0d0d;
    color: #e0e0e0;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    padding: 0 0 80px 0;
  }

  .header {
    border-bottom: 1px solid #222;
    padding: 40px 64px 32px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 32px;
  }

  .header-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #555;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .header-title {
    font-size: 36px;
    font-weight: 300;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: #f0f0f0;
  }

  .header-title strong {
    font-weight: 500;
    color: #fff;
  }

  .header-meta {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #444;
    text-align: right;
    line-height: 1.8;
  }

  .main {
    padding: 0 64px;
  }

  .section-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #444;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 32px 0 16px;
    border-bottom: 1px solid #1a1a1a;
    margin-bottom: 32px;
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .section-label span {
    color: #333;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: #1a1a1a;
    margin-bottom: 2px;
  }

  .panel {
    background: #0d0d0d;
    padding: 40px;
  }

  .panel-header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid #1e1e1e;
  }

  .panel-type {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #555;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .panel-name {
    font-size: 22px;
    font-weight: 400;
    color: #ececec;
    letter-spacing: -0.01em;
  }

  .panel-ext {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: #3a3a3a;
    margin-left: auto;
  }

  .image-area {
    background: #111;
    border: 1px solid #1e1e1e;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 280px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }

  .image-area::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  /* SVG Sample - Vector */
  .svg-sample {
    position: relative;
    z-index: 1;
  }

  /* Raster sample: pixelated canvas effect */
  .raster-canvas {
    position: relative;
    z-index: 1;
    image-rendering: pixelated;
  }

  .zoom-indicator {
    position: absolute;
    bottom: 12px;
    right: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #333;
    letter-spacing: 0.1em;
    z-index: 2;
  }

  .sliders-section {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 32px;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .slider-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #444;
    width: 90px;
    flex-shrink: 0;
    letter-spacing: 0.08em;
  }

  .slider-track {
    flex: 1;
    height: 1px;
    background: #222;
    position: relative;
    cursor: pointer;
  }

  .slider-fill {
    height: 100%;
    background: #3a3a3a;
    transition: width 0.15s;
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background: #e0e0e0;
    border: none;
    cursor: grab;
  }

  .slider-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #555;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }

  input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 1px;
    background: #222;
    cursor: pointer;
    outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    background: #c8c8c8;
    cursor: grab;
    border: none;
  }
  input[type=range]::-moz-range-thumb {
    width: 10px;
    height: 10px;
    background: #c8c8c8;
    cursor: grab;
    border: none;
    border-radius: 0;
  }

  .description-block {
    padding-top: 28px;
    border-top: 1px solid #1a1a1a;
  }

  .description-block p {
    font-size: 13.5px;
    font-weight: 300;
    color: #888;
    line-height: 1.75;
    margin-bottom: 14px;
  }

  .description-block p:last-child {
    margin-bottom: 0;
  }

  .description-block code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: #666;
    background: #161616;
    padding: 1px 5px;
  }

  .spec-table {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .spec-row {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #181818;
    padding: 9px 0;
  }

  .spec-row:first-child {
    border-top: 1px solid #181818;
  }

  .spec-key {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #3e3e3e;
    width: 130px;
    flex-shrink: 0;
    letter-spacing: 0.08em;
    padding-top: 1px;
  }

  .spec-val {
    font-size: 12.5px;
    color: #777;
    font-weight: 300;
  }

  .divider-panel {
    background: #0d0d0d;
    padding: 32px 40px;
    border-top: 2px solid #1a1a1a;
  }

  .divider-panel-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
  }

  .comparison-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid #181818;
  }

  .comparison-row:first-child {
    border-top: 1px solid #181818;
  }

  .comparison-attr {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #3a3a3a;
    letter-spacing: 0.08em;
  }

  .comparison-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #555;
    letter-spacing: 0.06em;
  }

  .badge-good { color: #5a8a5a; }
  .badge-bad  { color: #8a5a5a; }
  .badge-mid  { color: #7a7a5a; }

  .section-subtitle {
    font-size: 13px;
    color: #555;
    font-weight: 300;
    margin-bottom: 20px;
  }
`;

const VectorSVG = ({ zoom }: { zoom: number }) => {
  const scale = 1 + (zoom / 100) * 1.8;
  return (
    <svg
      className="svg-sample"
      width="180"
      height="180"
      viewBox="0 0 100 100"
      style={{ transform: `scale(${scale})`, transition: "transform 0.2s" }}
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
      <circle cx="50" cy="50" r="5" fill="#4a7a8a" opacity="0.6" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
    </svg>
  );
};

const RasterSVG = ({ zoom, quality }: { zoom: number; quality: number }) => {
  const scale = 1 + (zoom / 100) * 1.8;
  const blur = zoom > 60 ? ((zoom - 60) / 40) * 2.5 : 0;
  const blockSize = Math.max(1, Math.floor((1 - quality / 100) * 8));

  return (
    <svg
      className="raster-canvas"
      width="180"
      height="180"
      viewBox="0 0 100 100"
      style={{
        transform: `scale(${scale})`,
        transition: "transform 0.2s",
        filter: `blur(${blur}px)`,
        imageRendering: "pixelated",
      }}
    >
      {/* Simulated pixel grid */}
      <defs>
        <pattern id="px" x="0" y="0" width={blockSize} height={blockSize} patternUnits="userSpaceOnUse">
          <rect width={blockSize} height={blockSize} fill="none" stroke="#1a1a1a" strokeWidth="0.3" />
        </pattern>
      </defs>

      {/* Rasterized circle approximation */}
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
      <circle cx="50" cy="50" r="5" fill="#7a5a4a" opacity="0.6" />
      <line x1="50" y1="12" x2="50" y2="88" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="#222" strokeWidth="0.4" strokeDasharray="2,3" />
      {/* Pixel grid overlay */}
      <rect width="100" height="100" fill="url(#px)" opacity={0.4 + (1 - quality / 100) * 0.6} />
    </svg>
  );
};

export default function ImageComparison() {
  const [vectorZoom, setVectorZoom] = useState(30);
  const [vectorStroke, setVectorStroke] = useState(60);
  const [vectorOpacity, setVectorOpacity] = useState(80);

  const [rasterZoom, setRasterZoom] = useState(30);
  const [rasterQuality, setRasterQuality] = useState(80);
  const [rasterDpi, setRasterDpi] = useState(72);

  return (
    <div className="page">
      <style>{styles}</style>

      <header className="header">
        <div>
          <div className="header-label">Gráficos Digitais — Análise Comparativa</div>
          <h1 className="header-title">
            <strong>Vetorial</strong> vs <strong>Matricial</strong>
            <br />
          </h1>
        </div>
        <div className="header-meta">
          <div>PNG · JPG · WebP · SVG</div>
        </div>
      </header>

      <div className="main">
        <div className="section-label">
          01 <span>—</span> Visualização interativa
        </div>

        <div className="comparison-grid">
          {/* VECTOR PANEL */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-type">formato</span>
              <span className="panel-name">Vetorial</span>
              <span className="panel-ext">.svg / .pdf / .eps</span>
            </div>

            <div className="image-area">
              <VectorSVG zoom={vectorZoom} />
              <div className="zoom-indicator">{vectorZoom}% zoom</div>
            </div>

            <div className="sliders-section">
              <div className="slider-row">
                <span className="slider-label">ZOOM</span>
                <input
                  type="range" min={0} max={100} value={vectorZoom}
                  onChange={(e) => setVectorZoom(Number(e.target.value))}
                />
                <span className="slider-value">{vectorZoom}%</span>
              </div>
              <div className="slider-row">
                <span className="slider-label">STROKE</span>
                <input
                  type="range" min={0} max={100} value={vectorStroke}
                  onChange={(e) => setVectorStroke(Number(e.target.value))}
                />
                <span className="slider-value">{vectorStroke}%</span>
              </div>
              <div className="slider-row">
                <span className="slider-label">OPACITY</span>
                <input
                  type="range" min={0} max={100} value={vectorOpacity}
                  onChange={(e) => setVectorOpacity(Number(e.target.value))}
                />
                <span className="slider-value">{vectorOpacity}%</span>
              </div>
            </div>

            <div className="description-block">
              <p>
                Imagens vetoriais são definidas por equações matemáticas — curvas de Bézier, arcos e primitivas
                geométricas armazenadas como instruções, não como pixels. O arquivo descreve <em>como</em> desenhar
                a forma, e o renderizador resolve isso em tempo real para qualquer resolução de saída.
              </p>
              <p>
                Em SVG, cada elemento é um nó DOM acessível via <code>getAttribute</code> e <code>setAttribute</code>.
                Em PDF/EPS, as instruções seguem um modelo de stream de operadores (
                <code>moveto</code>, <code>curveto</code>, <code>fill</code>). Isso torna o formato
                intrinsecamente escalável: ampliar 4000× não degrada nitidez porque não há amostragem discreta
                envolvida.
              </p>

              <div className="spec-table">
                <div className="spec-row">
                  <span className="spec-key">REPRESENTAÇÃO</span>
                  <span className="spec-val">Equações paramétricas + primitivas geométricas</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">ESCALONAMENTO</span>
                  <span className="spec-val">Lossless — resolução independente</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">TAMANHO</span>
                  <span className="spec-val">Proporcional à complexidade do caminho, não à área</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">IDEAL PARA</span>
                  <span className="spec-val">Logotipos, tipografia, ícones, UI, impressão</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">LIMITAÇÃO</span>
                  <span className="spec-val">Fotografia e gradientes complexos são custosos</span>
                </div>
              </div>
            </div>
          </div>

          {/* RASTER PANEL */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-type">formato</span>
              <span className="panel-name">Matricial</span>
              <span className="panel-ext">.png / .jpg / .webp</span>
            </div>

            <div className="image-area">
              <RasterSVG zoom={rasterZoom} quality={rasterQuality} />
              <div className="zoom-indicator">{rasterZoom}% zoom</div>
            </div>

            <div className="sliders-section">
              <div className="slider-row">
                <span className="slider-label">ZOOM</span>
                <input
                  type="range" min={0} max={100} value={rasterZoom}
                  onChange={(e) => setRasterZoom(Number(e.target.value))}
                />
                <span className="slider-value">{rasterZoom}%</span>
              </div>
              <div className="slider-row">
                <span className="slider-label">QUALIDADE</span>
                <input
                  type="range" min={10} max={100} value={rasterQuality}
                  onChange={(e) => setRasterQuality(Number(e.target.value))}
                />
                <span className="slider-value">{rasterQuality}%</span>
              </div>
              <div className="slider-row">
                <span className="slider-label">DPI</span>
                <input
                  type="range" min={72} max={300} value={rasterDpi}
                  onChange={(e) => setRasterDpi(Number(e.target.value))}
                />
                <span className="slider-value">{rasterDpi}</span>
              </div>
            </div>

            <div className="description-block">
              <p>
                Imagens matriciais (bitmap) armazenam informação como uma grade bidimensional de pixels —
                cada célula contém valores numéricos de canal de cor (ex: <code>R, G, B, A</code> em 8 bits
                por canal = 32 bits por pixel). A qualidade da imagem é fixada no momento da exportação:
                a resolução em pixels por polegada (DPI/PPI) determina o nível de detalhe disponível.
              </p>
              <p>
                Ao ampliar além da resolução nativa, algoritmos de interpolação como{" "}
                <code>nearest-neighbor</code>, <code>bilinear</code> ou <code>bicubic</code> estimam valores
                para os novos pixels — gerando o artefato de pixelação ou borrão característico.
                Formatos com compressão com perda como JPEG aplicam a Transformada Discreta de Cossenos
                (DCT) por blocos de 8×8, descartando informação de alta frequência irreversível.
              </p>

              <div className="spec-table">
                <div className="spec-row">
                  <span className="spec-key">REPRESENTAÇÃO</span>
                  <span className="spec-val">Grade de pixels — valores discretos por canal</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">ESCALONAMENTO</span>
                  <span className="spec-val">Lossy — interpolação ao ampliar</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">TAMANHO</span>
                  <span className="spec-val">Proporcional à área (largura × altura × bit depth)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">IDEAL PARA</span>
                  <span className="spec-val">Fotografia, capturas de tela, texturas, render 3D</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">LIMITAÇÃO</span>
                  <span className="spec-val">Redimensionamento destrutivo; tamanho de arquivo alto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COMPARISON TABLE */}
        <div className="divider-panel">
          <div className="section-label" style={{ paddingTop: 0, marginBottom: 24 }}>
            02 <span>—</span> Tabela comparativa
          </div>
          <div className="divider-panel-inner">
            {/* Vector col */}
            <div>
              <div className="section-subtitle">Vetorial</div>
              {[
                ["Escalabilidade",     "Perfeita",       "good"],
                ["Suporte fotografia", "Inadequado",     "bad"],
                ["Editabilidade",      "Alta (por nó)",  "good"],
                ["Renderização",       "CPU/GPU em RT",  "mid"],
                ["Compressão",         "SVGZ (gzip)",    "mid"],
                ["Interatividade web", "Nativa via DOM", "good"],
                ["Compatibilidade",    "Limitada",       "mid"],
              ].map(([attr, val, cls]) => (
                <div className="comparison-row" key={attr}>
                  <span className="comparison-attr">{attr}</span>
                  <span className={`comparison-badge badge-${cls}`}>{val}</span>
                </div>
              ))}
            </div>
            {/* Raster col */}
            <div>
              <div className="section-subtitle">Matricial</div>
              {[
                ["Escalabilidade",     "Dependente de DPI",  "bad"],
                ["Suporte fotografia", "Excelente",          "good"],
                ["Editabilidade",      "Por pixel/camada",   "mid"],
                ["Renderização",       "Direta (blitting)",  "good"],
                ["Compressão",         "Lossy/lossless",     "mid"],
                ["Interatividade web", "Via canvas/WebGL",   "mid"],
                ["Compatibilidade",    "Universal",          "good"],
              ].map(([attr, val, cls]) => (
                <div className="comparison-row" key={attr}>
                  <span className="comparison-attr">{attr}</span>
                  <span className={`comparison-badge badge-${cls}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
