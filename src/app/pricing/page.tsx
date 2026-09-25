"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";

const PLANS = [
  {
    name: "Open Source",
    price: "Grátis",
    description: "Para quem quer rodar o PixelForge por conta própria.",
    features: [
      "Todos os módulos (Computação Gráfica, Multimídia, IA)",
      "Código-fonte completo sob licença MIT",
      "Self-hosted — hospede no seu próprio servidor",
      "Suporte via comunidade no GitHub",
    ],
    ctaLabel: "Ver no GitHub",
    ctaHref: "https://github.com/Frombull/PixelForge",
  },
  {
    name: "Institucional",
    price: "Sob consulta",
    description: "Para faculdades e escolas técnicas que querem adotar o PixelForge em curso.",
    features: [
      "Hospedagem gerenciada, sem manutenção",
      "Dashboard de progresso por turma e aluno",
      "Marca da instituição (logo, subdomínio)",
      "Suporte prioritário",
    ],
    ctaLabel: "Falar com a gente",
    ctaHref: "mailto:marcorrditoro@gmail.com?subject=PixelForge%20-%20Plano%20Institucional",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    description: "Para quem precisa de módulos e integrações feitos sob medida.",
    features: [
      "Tudo do plano Institucional",
      "Módulos novos, mapeados à ementa do curso",
      "Integração com LMS (Moodle, Canvas, etc.)",
      "SLA e canal de suporte dedicado",
    ],
    ctaLabel: "Agendar conversa",
    ctaHref: "mailto:marcorrditoro@gmail.com?subject=PixelForge%20-%20Plano%20Enterprise",
  },
];

export default function PricingPage() {
  return (
    <div className="relative isolate min-h-screen flex flex-col font-sans text-[var(--pf-fg)] bg-[var(--pf-bg)] overflow-x-clip">
      <div className="app-noise absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-1 pt-[112px] pb-20 px-4 md:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-14 text-center">
              <h1 className="text-[28px] sm:text-4xl font-bold text-[var(--pf-fg-strong)] tracking-tight font-sans">
                Preços
              </h1>
              <p className="mt-4 mx-auto max-w-xl text-sm sm:text-base text-[var(--pf-fg-muted)] font-sans">
                O PixelForge é e sempre será open source — todos os módulos, de graça, para qualquer aluno ou professor.
                Os planos abaixo existem para instituições que querem mais do que self-hosting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {PLANS.map((plan) => (
                <PricingCard key={plan.name} {...plan} />
              ))}
            </div>

            <p className="mt-12 text-center text-xs text-[var(--pf-fg-faint)] font-sans">
              Precisa de algo diferente? Escreva para{" "}
              <a
                href="mailto:marcorrditoro@gmail.com"
                className="text-[var(--pf-accent)] hover:underline"
              >
                marcorrditoro@gmail.com
              </a>
              .
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
