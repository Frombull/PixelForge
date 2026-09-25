import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

function YouTube({ id, title = "YouTube video" }: { id: string; title?: string }) {
  return (
    <div className="my-6 aspect-video w-full overflow-hidden rounded-[3px] border border-[var(--pf-border)] bg-[var(--pf-bg)]">
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
      <div className="overflow-hidden rounded-[3px] border border-[var(--pf-border)] bg-[var(--pf-bg)]">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center font-mono text-[11px] text-[var(--pf-fg-faint)]">
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
        className="mt-2 mb-3 font-sans text-[28px] font-bold leading-[1.2] tracking-tight text-[var(--pf-fg-strong)]"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="mt-10 mb-3 font-sans text-[18px] font-bold tracking-wide text-[var(--pf-fg-strong)]"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="mt-6 mb-2 font-sans text-[14px] font-bold tracking-wide text-[var(--pf-fg)]"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="my-3 font-sans text-[14px] leading-relaxed text-[var(--pf-fg)]"
        {...props}
      />
    ),
    a: ({ href = "", children, ...rest }) => {
      const isExternal = /^https?:\/\//.test(href);
      const cls =
        "font-sans text-[var(--pf-accent)] underline decoration-[var(--pf-accent)]/30 underline-offset-2 transition-colors hover:decoration-[var(--pf-accent)]";
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
        className="my-3 list-disc space-y-1.5 pl-5 font-sans text-[14px] text-[var(--pf-fg)] marker:text-[var(--pf-fg-faint)]"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="my-3 list-decimal space-y-1.5 pl-5 font-sans text-[14px] text-[var(--pf-fg)] marker:text-[var(--pf-fg-faint)]"
        {...props}
      />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="my-4 border-l-2 border-[var(--pf-accent)]/40 bg-[var(--pf-bg-raised)] px-4 py-2 font-sans text-[13px] italic text-[var(--pf-fg)]"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="rounded-[3px] border border-[var(--pf-border)] bg-[var(--pf-code-bg)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--pf-code-fg)]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="my-4 overflow-x-auto rounded-[3px] border border-[var(--pf-border)] bg-[var(--pf-code-bg)] p-4 font-mono text-[12px] text-[var(--pf-fg-strong)]"
        {...props}
      />
    ),
    hr: () => <hr className="my-8 border-t border-[var(--pf-border)]" />,
    img: ({ src = "", alt = "" }) => (
      <Figure src={src as string} alt={alt} />
    ),
    YouTube,
    Figure,
    ...components,
  };
}
