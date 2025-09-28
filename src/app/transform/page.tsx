"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TransformPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(
      "Erro ao carregar o aplicativo. Verifique se os arquivos estão corretos."
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/80 text-sm">Carregando aplicativo...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-semibold mb-2">
              Erro de Carregamento
            </h2>
            <p className="text-white/80 text-sm mb-4">{error}</p>
            <Link
              href="/"
              className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300"
            >
              Voltar ao Menu
            </Link>
          </div>
        </div>
      )}

      {/* Iframe Container */}
      <div className="w-full h-full">
        <iframe
          src="/static-project/pages/index.html"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Transformações 2D - Canvas Feliz"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      {/* Navigation Buttons - Bottom */}
      <div className="absolute bottom-4 left-4 right-4 z-50 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/90 hover:text-white px-4 py-2 rounded-xl bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/10 transition-all duration-300 text-sm sm:text-base font-medium"
        >
          <span className="text-lg">←</span>
          <span className="hidden sm:inline">Menu Principal</span>
        </Link>

        <Link
          href="/infos/geometric-transformations"
          className="text-white/90 hover:text-white px-4 py-2 rounded-xl bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/10 transition-all duration-300 text-sm sm:text-base font-medium"
        >
          📚 Teoria
        </Link>
      </div>
    </div>
  );
}
