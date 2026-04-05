"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface ToolCard {
  title: string;
  description: string;
  icon: string; // we can use this as a tag prefix if we want
  href: string;
  color: string;
  features: string[];
}

interface SectionGridProps {
  id: string;
  title: string;
  tools: ToolCard[];
  className?: string;
  index?: string;
}

export default function SectionGrid({ id, title, tools, className = "", index = "01" }: SectionGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  let sectionNum = index;
  if (id === "graphics") sectionNum = "01";
  else if (id === "multimidia") sectionNum = "02";
  else if (id === "ia") sectionNum = "03";

  // map IDs to some theme colors
  const secColor = id === "graphics" ? "text-cyanTheme border-cyanTheme bg-cyanTheme" : id === "multimidia" ? "text-magentaTheme border-magentaTheme bg-magentaTheme" : "text-greenTheme border-greenTheme bg-greenTheme";
  const secDir = id === "graphics" ? "ls modules/computacao-grafica/" : id === "multimidia" ? "ls modules/multimidia/" : "ls modules/ia/";
  const tagColor = id === "graphics" ? "text-cyanTheme" : id === "multimidia" ? "text-magentaTheme" : "text-greenTheme";

  return (
    <div id={id} className={`bg-bg4 border-t border-borderDark ${id === "graphics" ? "border-b" : ""} ${className}`} ref={containerRef}>
      <div className="py-20 px-8 max-w-[1100px] mx-auto">
        <div className={`flex items-center gap-3.5 mb-10 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-[11px] text-dim tracking-[1px]">{sectionNum}</span>
          <span className="text-greenTheme font-bold text-[13px]">$</span>
          <span className="text-whiteTheme text-[13px] font-bold tracking-[0.5px]">{secDir}</span>
          <div className="flex-1 h-[1px] bg-borderDark"></div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[1px] bg-borderDark border border-borderDark rounded-lg overflow-hidden">
          {tools.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.href}
              className={`group relative block bg-bg p-[22px_20px] transition-colors duration-150 hover:bg-bg2 no-underline opacity-0 translate-y-3 ${isVisible ? "animate-[reveal_0.5s_ease-out_forwards]" : ""}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 bg-current">
                {/* using a trick with bg-current to inherit from a div inside if needed, or simply map it */}
                <div className={`w-full h-full ${id === "graphics" ? "bg-cyanTheme" : id === "multimidia" ? "bg-magentaTheme" : "bg-greenTheme"}`}></div>
              </div>
              
              <div className={`text-[9px] tracking-[2px] uppercase mb-2.5 inline-flex items-center gap-1.5 ${tagColor}`}>
                <span className="text-dim">//</span> {tool.title}
              </div>
              
              <div className="text-[14px] font-bold text-whiteTheme mb-2 tracking-[0.3px]">
                {tool.title} <span className="ml-1 opacity-50">{tool.icon}</span>
              </div>
              
              <div className="text-[11px] text-fg leading-[1.65] font-light">
                {tool.description}
              </div>
              
              <div className="mt-[14px] flex flex-wrap gap-[5px]">
                {tool.features.slice(0, 4).map((feature, fIdx) => (
                  <span key={fIdx} className="text-[9px] text-dim border border-borderDark px-[7px] py-[2px] rounded-[3px] tracking-[0.5px]">
                    {feature}
                  </span>
                ))}
              </div>
              
              <div className={`absolute top-5 right-[18px] text-[12px] text-border2 transition-all duration-150 group-hover:translate-x-[2px] group-hover:-translate-y-[2px] ${id === "graphics" ? "group-hover:text-cyanTheme" : id === "multimidia" ? "group-hover:text-magentaTheme" : "group-hover:text-greenTheme"}`}>
                ↗
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes reveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
