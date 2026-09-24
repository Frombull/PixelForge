"use client";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
};

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  className = "",
  "aria-label": ariaLabel,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`pf-slider ${className}`}
      style={{ ["--pf-slider-fill" as string]: `${percent}%` }}
    />
  );
}
