"use client";

import Link from "next/link";

export interface ToolCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
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
  return (
    <section
      id={id}
      className={`relative isolate overflow-hidden py-16 px-6 sm:px-12 bg-transparent ${className}`}>

      <div className="relative z-10 max-w-7xl mx-auto">
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
              className="group relative flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-[1px] p-6 transition-colors duration-100 hover:bg-neutral-900/80 overflow-hidden"
            >
              {tool.previewImage && (
                <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-[1px] h-44 sm:h-40 bg-neutral-950/40 border-b border-neutral-800">
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
              <h3 className="text-[20px] font-bold text-white mb-2 tracking-wide font-mono">
                {tool.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-400 font-light leading-relaxed text-[14px] mb-6 flex-grow font-mono">
                {tool.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-neutral-900 bg-neutral-900/50 text-neutral-400 px-2 py-1 rounded-[1px] text-[10px] font-mono tracking-wide"
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
