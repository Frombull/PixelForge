"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />
      
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#15263b_0%,#09111a_42%,#02060b_100%)] px-4 pt-28 pb-20 md:px-8 md:pt-36">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(92,170,255,0.24),transparent_54%)]" />

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-black leading-tight tracking-[-0.04em] text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-sky-300 bg-clip-text sm:text-5xl lg:text-6xl">
              Política de Privacidade
            </h1>
            <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300" />
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-6 text-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Compromisso com sua privacidade</h2>
              <p className="text-slate-300 leading-relaxed">
                No PixelForge, levamos sua privacidade a sério. Esta política descreve como coletamos, 
                usamos e protegemos suas informações pessoais ao utilizar nossa plataforma educacional.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Informações que coletamos</h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Dados de conta:</strong> Nome, email e informações de perfil quando você se registra</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Dados de uso:</strong> Informações sobre como você interage com a plataforma</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span><strong className="text-white">Dados técnicos:</strong> Endereço IP, tipo de navegador e dispositivo</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Como usamos suas informações</h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>Fornecer e melhorar nossos serviços educacionais</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>Personalizar sua experiência de aprendizado</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>Comunicar atualizações e novos recursos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 mt-1">•</span>
                  <span>Garantir a segurança e integridade da plataforma</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Seus direitos</h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. 
                Para exercer esses direitos, entre em contato conosco através dos canais disponíveis.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Segurança</h2>
              <p className="text-slate-300 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
                contra acesso não autorizado, alteração, divulgação ou destruição.
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
