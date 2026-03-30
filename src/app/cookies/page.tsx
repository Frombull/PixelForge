"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#15263b_0%,#09111a_42%,#02060b_100%)] px-4 pt-28 pb-20 md:px-8 md:pt-36">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(92,170,255,0.24),transparent_54%)]" />

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-[-0.04em] text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-sky-300 bg-clip-text sm:text-5xl lg:text-6xl">
              Política de Cookies
            </h1>
            <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300" />
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6 text-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">O que são cookies?</h2>
              <p className="text-slate-300 leading-relaxed">
                Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita o PixelForge. 
                Eles nos ajudam a melhorar sua experiência, lembrando suas preferências e fornecendo funcionalidades personalizadas.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Como usamos cookies</h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Cookies essenciais:</strong> Necessários para o funcionamento básico da plataforma</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Cookies de preferência:</strong> Armazenam suas configurações e preferências de visualização</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Cookies analíticos:</strong> Nos ajudam a entender como você usa a plataforma para melhorias contínuas</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Gerenciamento de cookies</h2>
              <p className="text-slate-300 leading-relaxed">
                Você pode controlar e gerenciar cookies através das configurações do seu navegador. 
                Note que desabilitar cookies pode afetar a funcionalidade de algumas áreas da plataforma.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">
                Última atualização: Março de 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
