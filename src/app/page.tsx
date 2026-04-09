import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SectionsGrid from "@/components/ComputacaoGraficaSection";
import Multimedia from "@/components/MultimediaSection";
import AISection from "@/components/AISection";
import Footer from "@/components/Footer";

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
