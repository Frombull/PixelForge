"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, Fragment } from "react";

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
  return <span aria-hidden="true" className="h-4 w-px bg-[#3a3a3a]" />;
}

//  Header 
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const desktopLinkBase =
    "group inline-flex items-center px-3 py-1.5 text-neutral-400 whitespace-nowrap transition-colors duration-100 hover:text-neutral-100";
  const mobileLinkBase =
    "group inline-flex items-center px-4 py-3 text-neutral-300 uppercase tracking-[0.06em] text-[11px] transition-colors duration-100 hover:text-neutral-100";
  const bracketBase = "text-[#5a5a5a] transition-opacity duration-100";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`fixed left-0 top-0 w-full z-50 border-b ${
        scrolled
          ? "border-[#303030] bg-[rgb(13,13,13)]/95 backdrop-blur-md"
          : "border-[#242424] bg-[rgb(18,18,18)]/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="relative flex items-center justify-between h-12 lg:h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-lg lg:text-xl group-hover:bg-[#171717] transition-colors duration-100">
              <img src="/images/anvil.svg" alt="logo" className="w-5 h-5 lg:w-6 lg:h-6 opacity-80" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold font-mono text-lg lg:text-xl tracking-tight flex items-baseline gap-1.5">
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
                  className={`${desktopLinkBase} ${pathname === link.href ? "text-white" : ""}`}
                  bracketClassName={bracketBase}
                />
                {/* Separator between secondary links */}
                {i < SECONDARY_LINKS.length - 1 && <Separator />}
              </Fragment>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4 z-10">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              className={`inline-flex h-9 w-9 items-center justify-center border transition-colors duration-100 ${
                mobileMenuOpen
                  ? "border-[#4a4a4a] bg-[#1a1a1a] text-white"
                  : "border-[#2a2a2a] bg-[#101010] text-[#a0a0a0] hover:border-[#3a3a3a] hover:bg-[#171717] hover:text-white"
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
            <nav className="flex flex-col gap-2 font-mono text-sm border border-[#222222] bg-[#0d0d0d] p-3">
              {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  active={link.exactMatch ? pathname === link.href : false}
                  className={`${mobileLinkBase} ${link.exactMatch && pathname === link.href ? "text-white" : ""}`}
                  bracketClassName={bracketBase}
                  onClick={closeMobileMenu}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}