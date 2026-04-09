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
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#15263b_0%,#09111a_42%,#02060b_100%)] px-4 pt-28 pb-20 md:px-8 md:pt-36">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(92,170,255,0.24),transparent_54%)]" />
        <div className="absolute left-1/2 top-44 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-5xl font-black leading-tight tracking-[-0.04em] text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-sky-300 bg-clip-text sm:text-6xl lg:text-7xl">
              Planos e Preços
            </h1>
            <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 sm:w-36" />
            <p className="mx-auto max-w-2xl text-lg text-slate-100/88 sm:text-xl">
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
    </main>
  );
}
