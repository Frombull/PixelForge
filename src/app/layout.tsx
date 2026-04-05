import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixel Forge",
  description:
    "Uma plataforma para aprender e experimentar conceitos de computação gráfica e multimídia e IA de maneira e interativa.",
  icons: {
    icon: "./images/anvil.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={jetbrainsMono.className}>{children}</body>
    </html>
  );
}
