"use client";

import { usePathname } from "next/navigation";

/**
 * Wrapper around the main content area in the /infos layout.
 * When the user is on an individual info page (e.g. /infos/animations),
 * the content background gets a slightly different tint to distinguish
 * it from the hub index.
 */
export default function InfosContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isArticle = /^\/infos\/.+/.test(pathname);

  return (
    <div
      className="flex-1 min-w-0 flex flex-col items-center px-6 lg:px-10 transition-colors"
      style={
        isArticle
          ? { background: "rgba(20, 22, 31, 0.7)" }
          : undefined
      }
    >
      <div className="w-full max-w-6xl lg:-translate-x-[110px]">
        {children}
      </div>
    </div>
  );
}
