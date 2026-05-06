import type { Metadata } from "next";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SectionsGrid from "@/components/ComputacaoGraficaSection";
import Multimedia from "@/components/MultimediaSection";
import AISection from "@/components/AISection";
import Footer from "@/components/Footer";

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
      <div className="app-noise absolute inset-0 z-0 pointer-events-none" />

      <div className="relative z-10">
        <Header />
        <HeroSection />
        <SectionsGrid />
        <Multimedia />
        <AISection />
        <Footer />
      </div>
    </main>
  );
}
