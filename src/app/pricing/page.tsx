"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";

const pricingPlans = [
  {
    id: "student-free",
    name: "Acadêmico",
    price: 0,
    description: "Ideal para estudantes autodidatas.",
    features: ["Canvas 3D Básico", "Textos Didáticos", "Acesso Comunitário"],
    highlighted: false,
  },
  {
    id: "educator-pro",
    name: "Educador Pro",
    price: 29.90,
    description: "Ferramentas avançadas para professores e entusiastas.",
    features: [
      "Sem Watermarks",
      "Debug de Z-Buffer/A-Buffer",
      "Editor de Shaders",
      "Exportação de Dados",
    ],
    highlighted: true,
  },
  {
    id: "campus-enterprise",
    name: "Campus",
    price: "Custom",
    description: "A solução completa para cursos de Engenharia e Computação.",
    features: [
      "Contas ilimitadas",
      "Integração Moodle/Canvas",
      "Dashboard de Analytics",
      "Suporte 24/7",
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <main className="relative isolate min-h-screen flex flex-col bg-[#13141c] text-[#a9b1d6] overflow-x-hidden font-mono">
      <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
      <Header />

      <section className="relative flex min-h-screen flex-col overflow-hidden border-t border-[#2a2d3e] bg-[#0f1017] px-4 pt-28 pb-20 md:px-8 md:pt-36">
        <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-[#c0caf5] sm:text-6xl lg:text-7xl">
              Planos e Preços
            </h1>
            <div className="mx-auto mb-6 h-px w-36 bg-[#2a2d3e]" />
            <p className="mx-auto max-w-2xl text-sm text-[#a9b1d6] sm:text-base">
              Escolha o plano ideal para sua jornada em Computação Gráfica
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </main>
  );
}
