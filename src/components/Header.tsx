"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, Fragment } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

//  Types
interface NavLinkDef {
  href: string;
  label: string;
  /** If true, active state is derived from pathname instead of scroll/hash */
  exactMatch?: boolean;
}

interface NavLinkProps extends NavLinkDef {
  className: string;
  bracketClassName: string;
  active?: boolean;
  onClick?: () => void;
}

//  Navigation config
const PRIMARY_LINKS: NavLinkDef[] = [
  { href: "/#graphics", label: "computação gráfica" },
  { href: "/#multimidia", label: "multimídia" },
  { href: "/#ia", label: "inteligência computacional" },
];

const SECONDARY_LINKS: NavLinkDef[] = [
  { href: "/infos", label: "material teórico", exactMatch: true },
  { href: "/pricing", label: "preços", exactMatch: true },
];

//  NavLink component
function NavLink({ href, label, className, bracketClassName, active = false, onClick }: NavLinkProps) {
  const bracketVisibility = active
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100";

  return (
    <Link href={href} className={className} onClick={onClick}>
      <span aria-hidden="true" className={`${bracketClassName} mr-1.5 ${bracketVisibility}`}>[</span>
      <span>{label}</span>
      <span aria-hidden="true" className={`${bracketClassName} ml-1.5 ${bracketVisibility}`}>]</span>
    </Link>
  );
}

// Separator
function Separator() {
  return <span aria-hidden="true" className="h-4 w-px bg-(--pf-border-strong)" />;
}

// Header 
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const desktopLinkBase =
    "group inline-flex items-center px-3 py-1.5 text-(--pf-fg-muted) whitespace-nowrap transition-colors duration-100 hover:text-(--pf-fg-strong)";
  const mobileLinkBase =
    "group inline-flex items-center px-4 py-3 text-(--pf-fg-muted) uppercase tracking-[0.06em] text-[11px] transition-colors duration-100 hover:text-(--pf-fg-strong)";
  const bracketBase = "text-(--pf-fg-faint) transition-opacity duration-100";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`fixed left-0 top-0 w-full z-50 border-b border-(--pf-border) bg-(--pf-bg)/95 ${
        scrolled ? "backdrop-blur-md" : "backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="relative flex items-center justify-between h-12 lg:h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 group shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-lg lg:text-xl duration-100">
              <img src="/images/PixelForge_Logo_V2.png" alt="logo" className="w-5 h-5 lg:w-8 lg:h-8" />
            </div>
            <div className="hidden sm:block">
              <div className="text-(--pf-fg-strong) font-bold font-mono text-lg lg:text-xl tracking-tight flex items-baseline gap-1.5">
                <span>PixelForge</span>
                <span className="text-sky-400 font-normal">3D</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-1.5 font-mono text-sm mx-auto whitespace-nowrap">
            {PRIMARY_LINKS.map((link) => (
              <NavLink
                key={link.href}
                {...link}
                className={desktopLinkBase}
                bracketClassName={bracketBase}
              />
            ))}

            <Separator />

            {SECONDARY_LINKS.map((link, i) => (
              <Fragment key={link.href}>
                <NavLink
                  {...link}
                  active={pathname === link.href}
                  className={`${desktopLinkBase} ${pathname === link.href ? "text-(--pf-fg-strong)" : ""}`}
                  bracketClassName={bracketBase}
                />
                {/* Separator between secondary links */}
                {i < SECONDARY_LINKS.length - 1 && <Separator />}
              </Fragment>
            ))}
          </nav>

          {/* Theme toggle (desktop) */}
          <button
            onClick={toggleTheme}
            className="hidden lg:flex items-center justify-center w-8 h-8 shrink-0 text-(--pf-fg-muted) hover:text-(--pf-fg-strong) border border-(--pf-border) hover:border-sky-400/60 rounded transition-colors"
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4 z-10">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              className={`inline-flex h-9 w-9 items-center justify-center border transition-colors duration-100 ${
                mobileMenuOpen
                  ? "border-(--pf-border-strong) bg-(--pf-bg-raised) text-(--pf-fg-strong)"
                  : "border-(--pf-border) bg-(--pf-bg-raised)/60 text-(--pf-fg-muted) hover:border-(--pf-border-strong) hover:bg-(--pf-bg-raised) hover:text-(--pf-fg-strong)"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-1 pb-3">
            <nav className="flex flex-col gap-2 font-mono text-sm border border-(--pf-border-strong) bg-(--pf-bg-raised) p-3">
              {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  active={link.exactMatch ? pathname === link.href : false}
                  className={`${mobileLinkBase} ${link.exactMatch && pathname === link.href ? "text-(--pf-fg-strong)" : ""}`}
                  bracketClassName={bracketBase}
                  onClick={closeMobileMenu}
                />
              ))}
              <button
                onClick={() => { toggleTheme(); closeMobileMenu(); }}
                className="group inline-flex items-center gap-2 px-4 py-3 text-(--pf-fg-muted) uppercase tracking-[0.06em] text-[11px] transition-colors duration-100 hover:text-(--pf-fg-strong)"
              >
                {theme === "dark" ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
                <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}