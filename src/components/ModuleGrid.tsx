"use client";

import { useState, useRef, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import Link from "next/link";

export interface ToolCard {
  title: string;
  description: string;
  href: string;
  tags: string[];
  previewImage?: string;
}

interface ModuleGridProps {
  id: string;
  title: string;
  modules: ToolCard[];
  className?: string;
}

export default function ModuleGrid({ id, title, modules: tools, className = "" }: ModuleGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Render animation exactly once
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative isolate overflow-hidden py-16 px-6 sm:px-12 bg-transparent ${className}`}>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 flex items-center gap-4">
          <span className="text-[var(--pf-fg-faint)] font-mono text-xl sm:text-2xl mt-1">$</span>
          <h2 className="text-2xl sm:text-3xl font-mono text-[var(--pf-fg-strong)] tracking-wide flex items-center whitespace-pre h-[36px] sm:h-[40px]">
            <span>ls ~/modules/</span>
            {isVisible && (
              <span className="text-sky-400">
                <TypeAnimation
                  sequence={[title.toLowerCase().replace(/\s+/g, "-")]}
                  wrapper="span"
                  speed={50}
                  cursor={false}
                  repeat={0}
                />
              </span>
            )}
          </h2>
          <div className="flex-1 h-[1px] bg-[var(--pf-border)] ml-4 hidden sm:block" />
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tools.map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className="group relative flex flex-col bg-[var(--pf-bg-raised)]/40 border border-[var(--pf-border)] rounded-[1px] p-6 transition-colors duration-100 hover:bg-[var(--pf-bg-raised)]/80 overflow-hidden"
            >
              {tool.previewImage && (
                <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[1px] h-44 sm:h-40 bg-[var(--pf-bg)]/40 border-b border-[var(--pf-border)]">
                  <img
                    src={tool.previewImage}
                    alt={`${tool.title} preview`}
                    className="w-full h-full object-cover"
                    style={{
                      WebkitMaskImage:
                        "radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
                      maskImage:
                        "radial-gradient(circle at center, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="text-[20px] font-bold text-[var(--pf-fg-strong)] mb-2 tracking-wide font-mono">
                {tool.title}
              </h3>

              {/* Description */}
              <p className="text-[var(--pf-fg-muted)] font-light leading-relaxed text-[14px] mb-6 flex-grow font-mono">
                {tool.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[var(--pf-border)] bg-[var(--pf-bg-raised)]/50 text-[var(--pf-fg-muted)] px-2 py-1 rounded-[1px] text-[10px] font-mono tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
