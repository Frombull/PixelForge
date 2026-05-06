import { ImageResponse } from "next/og";
import type { Font } from "next/dist/compiled/@vercel/og/satori";
import { headers } from "next/headers";

export const runtime = "edge";

const imageSize = { width: 1200, height: 630 };

const getBaseUrl = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${protocol}://${host}`;
};

const loadFontData = async () => {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((res) => res.text());

  const getUrl = (weight: number) => {
    const match = css.match(
      new RegExp(`@font-face\\s*{[^}]*font-weight:\\s*${weight};[^}]*src:\\s*url\\(([^)]+)\\)`, "m"),
    );
    return match?.[1];
  };

  const [regularData, boldData] = await Promise.all([
    getUrl(400) ? fetch(getUrl(400)!).then((r) => r.arrayBuffer()) : null,
    getUrl(700) ? fetch(getUrl(700)!).then((r) => r.arrayBuffer()) : null,
  ]);

  const fonts: Font[] = [];
  if (regularData) fonts.push({ name: "JetBrains Mono", data: regularData, weight: 400, style: "normal" });
  if (boldData)    fonts.push({ name: "JetBrains Mono", data: boldData,    weight: 700, style: "normal" });
  return fonts;
};

const noiseSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='300' height='300' filter='url(#n)' opacity='0.1'/>
</svg>`;

export async function GET() {
  const baseUrl = await getBaseUrl();
  const logoUrl = `${baseUrl}/images/PixelForge_Logo_V2.png`;
  const noiseUrl = `data:image/svg+xml;base64,${Buffer.from(noiseSvg).toString("base64")}`;
  const fonts = await loadFontData();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#13151a",
          fontFamily: "JetBrains Mono, monospace",
          color: "#f0f4f8",
          position: "relative",
        }}
      >
        {/* Noise */}
        <img
        src={noiseUrl}
        width={1200}
        height={630}
        style={{ position: "absolute", inset: 0, opacity: 0.055 }}
        />

        {/* Grid */}
        <svg
        width="1200"
        height="630"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0 }}
        >
        <defs>
            <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
            </pattern>
        </defs>
        <rect width="1200" height="630" fill="url(#grid)" />
        </svg>

        {/* Conteúdo */}
        <div style={{ width: "100%", height: "100%", padding: "72px 88px", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>

        {/* Logo + título — sem caixa, logo maior */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoUrl} width={124} height={124} />  {/* sem wrapper */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "64px", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 }}>
                PixelForge3D
            </span>
            <span style={{ fontSize: "22px", fontWeight: 400, color: "#636b7a", letterSpacing: "0.04em" }}>
                Plataforma educacional interativa
            </span>
            </div>
        </div>

        {/* Módulos */}
        <div style={{ display: "flex", alignItems: "center", fontSize: "20px", fontWeight: 400, color: "#7a8799", letterSpacing: "0.06em" }}>
            <span>Computação Gráfica</span>
            <span style={{ color: "#2a2f38", margin: "0 20px" }}>·</span>
            <span>Multimídia</span>
            <span style={{ color: "#2a2f38", margin: "0 20px" }}>·</span>
            <span>IA Aplicada</span>
        </div>
        </div>
      </div>
    ),
    { ...imageSize, fonts },
  );
}