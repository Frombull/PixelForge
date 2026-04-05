import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SectionsGrid from "@/components/ComputacaoGraficaSection";
import Multimedia from "@/components/MultimediaSection";
import AISection from "@/components/AISection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      <HeroSection />
      <SectionsGrid />
      <Multimedia />
      <AISection />
      <Footer />
    </main>
  );
}
