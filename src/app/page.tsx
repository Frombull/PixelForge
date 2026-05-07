import ComputacaoGraficaSection from "@/components/ComputacaoGraficaSection";
import MultimediaSection from "@/components/MultimediaSection";
import HeroSection from "@/components/HeroSection";
import AISection from "@/components/AISection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pixel Forge",
  description:
    "PixelForge é uma plataforma educacional interativa para aprender computação gráfica, multimídia e inteligência artificial com demos, visualizações e material teórico.",
  openGraph: {
    title: "Pixel Forge",
    description:
      "Plataforma educacional interativa para computação gráfica, multimídia e IA.",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "PixelForge landing page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Forge",
    description:
      "Plataforma educacional interativa para computação gráfica, multimídia e IA.",
    images: ["/og"],
  },
};

export default function Home() {
  return (
    <main className="relative isolate min-h-screen bg-[#13141c] text-white overflow-x-hidden">
      <div className="relative z-10">
        <Header />
        <HeroSection />
        <div className="grid-surface">
          <ComputacaoGraficaSection />
          <MultimediaSection />
          <AISection />
          <Footer />
        </div>
      </div>
    </main>
  );
}
