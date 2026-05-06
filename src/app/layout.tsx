import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = localFont({
  src: [
    { path: "../../public/fonts/JetBrainsMono[wght].ttf", weight: "100 800", style: "normal" },
    { path: "../../public/fonts/JetBrainsMono-Italic[wght].ttf", weight: "100 800", style: "italic" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel Forge",
  description:
    "Uma plataforma para aprender e experimentar conceitos de computação gráfica e multimídia e IA de maneira interativa.",
  icons: {
    icon: "./images/PixelForge_Logo_V2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
