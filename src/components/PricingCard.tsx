"use client";

interface PricingCardProps {
  name: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

export default function PricingCard({
  name,
  price,
  priceSuffix,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-6 rounded-lg border p-8 font-mono transition-colors duration-150 ${
        highlighted
          ? "border-sky-400/60 bg-[var(--pf-bg-raised)]"
          : "border-[var(--pf-border)] bg-[var(--pf-bg-raised)] hover:border-[var(--pf-border-strong)]"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-8 rounded-full bg-sky-400 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
          Recomendado
        </span>
      )}

      <div>
        <h3 className="text-lg font-bold text-[var(--pf-fg-strong)]">{name}</h3>
        <p className="mt-2 text-sm text-[var(--pf-fg-muted)]">{description}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-[var(--pf-fg-strong)]">{price}</span>
        {priceSuffix && (
          <span className="text-sm text-[var(--pf-fg-faint)]">{priceSuffix}</span>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-[var(--pf-fg)]">
            <span aria-hidden="true" className="mt-0.5 text-sky-400">
              +
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={ctaHref}
        target={ctaHref.startsWith("http") ? "_blank" : undefined}
        rel={ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
        className={`mt-auto inline-flex items-center justify-center rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
          highlighted
            ? "border-sky-400 bg-sky-400 text-black hover:bg-sky-300"
            : "border-[var(--pf-border-strong)] text-[var(--pf-fg-strong)] hover:border-sky-400/60 hover:text-sky-400"
        }`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
