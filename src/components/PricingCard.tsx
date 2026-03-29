"use client";

interface PricingCardProps {
  id: string;
  name: string;
  price: number | string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export default function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
}: PricingCardProps) {
  const formatPrice = () => {
    if (typeof price === "number") {
      return price === 0 ? "Grátis" : `R$ ${price.toFixed(2).replace(".", ",")}`;
    }
    return price;
  };

  return (
    <div
      className={`group relative flex flex-col rounded-xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 ${
        highlighted
          ? "border-sky-400/50 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-transparent shadow-lg shadow-sky-500/20"
          : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/8"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-1 text-sm font-semibold text-black">
          Mais Popular
        </div>
      )}

      <div className="flex flex-col gap-6 p-8">
        <div>
          <h3 className="mb-2 text-2xl font-bold text-white">{name}</h3>
          <p className="text-sm text-slate-300/70">{description}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-transparent bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text">
            {formatPrice()}
          </span>
          {typeof price === "number" && price > 0 && (
            <span className="text-slate-400">/mês</span>
          )}
        </div>

        <ul className="flex flex-col gap-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-slate-200">
              <svg
                className="mt-1 h-5 w-5 flex-shrink-0 text-sky-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          className={`mt-auto rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
            highlighted
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400 hover:shadow-lg hover:shadow-sky-500/30"
              : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          {typeof price === "number" && price === 0 ? "Começar Grátis" : "Escolher Plano"}
        </button>
      </div>
    </div>
  );
}
