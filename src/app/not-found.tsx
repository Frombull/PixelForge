import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#13141c] text-white">
      <div className="app-noise pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
      <Header />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
        <h1 className="font-mono text-7xl font-bold leading-none tracking-tighter sm:text-8xl">
          <span className="text-[#f7768e]">4</span>
          <span className="text-neutral-400">0</span>
          <span className="text-[#f7768e]">4</span>
        </h1>

        <p className="mt-5 font-mono text-lg text-[#f7768e]">Página não encontrada.</p>

        <p className="mt-2 max-w-lg text-sm text-neutral-400">
          O link pode estar incorreto ou a página foi movida.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded border border-neutral-800 bg-neutral-900/60 px-8 py-3 font-mono text-sm text-neutral-200 transition-colors hover:border-sky-400/60 hover:bg-neutral-800 hover:text-white"
          >
            Voltar para home
          </Link>
        </div>
      </section>
    </main>
  );
}