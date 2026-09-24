"use client";

import dynamic from "next/dynamic";

// Canvas uses browser APIs — disable SSR
const PolygonEditor = dynamic(
  () => import("@/components/canvas-2d/PolygonEditor"),
  { ssr: false }
);

export default function Canvas2DPage() {
  return <PolygonEditor />;
}
