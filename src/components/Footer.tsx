"use client";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8 md:gap-6">
          {/* Logo e nome */}
          <div className="flex flex-col items-center md:flex-row md:items-center gap-2 md:gap-3">
            <span className="text-2xl font-bold text-white text-center md:text-left">
              Pixel Forge
            </span>
          </div>

          {/* Links sociais */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4">
            <a
              href="https://github.com/Frombull/PixelForge.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <svg
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.27 5.7.42.36.8 1.09.8 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
              </svg>
              Código-Fonte
            </a>
            <a
              href="https://www.linkedin.com/in/marcoditoro/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <svg
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.026-3.063-1.867-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.603 2.002 3.603 4.604v5.592z" />
              </svg>
              Marco
            </a>
            <a
              href="https://www.linkedin.com/in/vitorgonzaga10/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-2">
              <svg
                width="22"
                height="22"
                fill="currentColor"
                viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.268h-3v-5.604c0-1.337-.026-3.063-1.867-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.381-1.563 2.841-1.563 3.039 0 3.603 2.002 3.603 4.604v5.592z" />
              </svg>
              Vitor
            </a>
          </div>
        </div>

        {/* Copyright e créditos */}
        <div className="mt-8 text-center text-white/40 text-xs">
          Pixel Forge | Desenvolvido por Marco Di Toro com Vitor Torres | Fetin 2025, orientado por Prof. Me. Marcelo Cysneiros
        </div>
      </div>
    </footer>
  );
}
