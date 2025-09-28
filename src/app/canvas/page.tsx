"use client";

import { useState } from "react";
import Link from "next/link";

export default function CanvasPage() {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/80 text-sm">
              Carregando Canvas...
            </p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <div className="w-full h-full">
        <iframe
          src="/static-project/pages/transform.html"
          className="w-full h-full border-0"
          title="Transformações 2D - Canvas"
          onLoad={handleIframeLoad}
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
          href="/infos"
          className="text-white/90 hover:text-white px-4 py-2 rounded-xl bg-black/80 hover:bg-black/90 backdrop-blur-md border border-white/10 transition-all duration-300 text-sm sm:text-base font-medium"
        >
          Material Teórico
        </Link>
      </div>
    </div>
  );
}
