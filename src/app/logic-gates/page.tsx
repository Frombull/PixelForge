"use client";

import dynamic from "next/dynamic";

const LogicGatesEditor = dynamic(
  () => import("@/components/logic-gates/LogicGatesEditor"),
  { ssr: false }
);

export default function LogicGatesPage() {
  return <LogicGatesEditor />;
}
