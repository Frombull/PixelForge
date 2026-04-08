"use client";

import Link from "next/link";

export interface ToolCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  features: string[];
}

interface SectionGridProps {
  id: string;
  title: string;
  tools: ToolCard[];
  className?: string;
}

export default function SectionGrid({ id, title, tools, className = "" }: SectionGridProps) {
  return (
    <section
      id={id}
      className={`py-24 px-6 sm:px-12 bg-black border-t border-neutral-900 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-12 flex items-center gap-4">
          <span className="text-neutral-600 font-mono text-xl sm:text-2xl mt-1">$</span>
          <h2 className="text-2xl sm:text-3xl font-mono text-white tracking-wide">
            ls <span className="text-sky-400">~/modules</span>/{title.toLowerCase().replace(/\s+/g, "-")}
          </h2>
          <div className="flex-1 h-[1px] bg-neutral-800 ml-4 hidden sm:block" />
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {tools.map((tool, index) => (
            <Link
              key={index}
              href={tool.href}
              className="group relative flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-lg p-6 transition-colors duration-300 hover:bg-neutral-800/80 overflow-hidden"
            >
              {/* Tag Header */}
              <div className="flex items-start mb-4">
                <div className="flex items-center gap-2 text-[12px] font-mono text-sky-400 uppercase tracking-widest">
                  <span className="text-neutral-600">//</span>
                  {title}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-[22px] font-bold text-white mb-2 tracking-wide">
                {tool.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-400 font-light leading-relaxed text-xs sm:text-sm mb-6 flex-grow">
                {tool.description}
              </p>

              {/* Features (Pills) */}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {tool.features.map((feature) => (
                  <span
                    key={feature}
                    className="border border-neutral-800 bg-neutral-900/50 text-neutral-400 px-2 py-1 rounded text-[10px] font-mono tracking-wide"
                  >
                    {feature}
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
