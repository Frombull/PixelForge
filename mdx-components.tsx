import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

function YouTube({ id, title = "YouTube video" }: { id: string; title?: string }) {
  return (
    <div className="my-6 aspect-video w-full overflow-hidden rounded-[3px] border border-[#2a2d3e] bg-[#0f1017]">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-[3px] border border-[#2a2d3e] bg-[#0f1017]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center font-mono text-[11px] text-[#414868]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="mt-2 mb-3 font-mono text-[28px] font-bold leading-[1.2] tracking-tight text-[#c0caf5]"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="mt-10 mb-3 font-mono text-[18px] font-bold tracking-wide text-[#c0caf5]"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="mt-6 mb-2 font-mono text-[14px] font-bold tracking-wide text-[#a9b1d6]"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="my-3 font-mono text-[13px] leading-relaxed text-[#a9b1d6]"
        {...props}
      />
    ),
    a: ({ href = "", children, ...rest }) => {
      const isExternal = /^https?:\/\//.test(href);
      const cls =
        "font-mono text-[#7dcfff] underline decoration-[#7dcfff]/30 underline-offset-2 transition-colors hover:decoration-[#7dcfff]";
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noreferrer" className={cls} {...rest}>
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className={cls}>
          {children}
        </Link>
      );
    },
    ul: (props) => (
      <ul
        className="my-3 list-disc space-y-1.5 pl-5 font-mono text-[13px] text-[#a9b1d6] marker:text-[#414868]"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="my-3 list-decimal space-y-1.5 pl-5 font-mono text-[13px] text-[#a9b1d6] marker:text-[#414868]"
        {...props}
      />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="my-4 border-l-2 border-[#7dcfff]/40 bg-[#1a1b26] px-4 py-2 font-mono text-[12px] italic text-[#a9b1d6]"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded-[3px] border border-[#2a2d3e] bg-[#1a1b26] px-1.5 py-0.5 font-mono text-[12px] text-[#bb9af7]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-4 overflow-x-auto rounded-[3px] border border-[#2a2d3e] bg-[#1a1b26] p-4 font-mono text-[12px] text-[#c0caf5]"
        {...props}
      />
    ),
    hr: () => <hr className="my-8 border-t border-[#2a2d3e]" />,
    img: ({ src = "", alt = "" }) => (
      <Figure src={src as string} alt={alt} />
    ),
    YouTube,
    Figure,
    ...components,
  };
}
