"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type DraggableNumberInputProps = {
  id?: string;
  className?: string;
  disabled?: boolean;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  scrubSensitivity?: number;
  handlePosition?: "left" | "right";
};

function decimalPlaces(n: number) {
  const decimals = String(n).split(".")[1];
  return decimals ? decimals.length : 0;
}

export default function DraggableNumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  scrubSensitivity = 0.3,
  id,
  className,
  disabled,
}: DraggableNumberInputProps) {
  const [internalValue, setInternalValue] = useState<number>(value);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValueRef = useRef(value);
  const numericStep = Math.abs(Number(step) || 1);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handlePointerMoveRef = useRef<(event: PointerEvent) => void>(() => {
    // initialized in effect below
  });

  const handlePointerUpRef = useRef<() => void>(() => {
    // initialized in effect below
  });

  const clampAndQuantize = (next: number) => {
    const precision = decimalPlaces(numericStep);
    let quantized = Math.round(next / numericStep) * numericStep;
    if (typeof min === "number") quantized = Math.max(min, quantized);
    if (typeof max === "number") quantized = Math.min(max, quantized);
    return Number(quantized.toFixed(precision));
  };

  const commit = (next: number) => {
    if (!Number.isFinite(next)) return;
    const normalized = clampAndQuantize(next);
    setInternalValue(normalized);
    onValueChange(normalized);
  };

  useEffect(() => {
    handlePointerMoveRef.current = (event: PointerEvent) => {
      if (!draggingRef.current || disabled) return;
      const delta = event.clientX - startXRef.current;
      commit(startValueRef.current + delta * numericStep * scrubSensitivity);
    };

    handlePointerUpRef.current = () => {
      draggingRef.current = false;
      document.removeEventListener("pointermove", handlePointerMoveRef.current);
      document.removeEventListener("pointerup", handlePointerUpRef.current);
    };

    return () => {
      document.removeEventListener("pointermove", handlePointerMoveRef.current);
      document.removeEventListener("pointerup", handlePointerUpRef.current);
    };
  }, [disabled, numericStep, scrubSensitivity]);

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (disabled || event.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startValueRef.current = internalValue;
    document.addEventListener("pointermove", handlePointerMoveRef.current);
    document.addEventListener("pointerup", handlePointerUpRef.current);
  };

  return (
    <div className="w-full min-w-0">
      <input
        id={id}
        className={`${className ?? ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          disabled
            ? "cursor-not-allowed opacity-40"
            : "cursor-ew-resize hover:text-(--ui-accent) active:cursor-ew-resize"
        }`}
        disabled={disabled}
        max={max}
        min={min}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) return;
          commit(parsed);
        }}
        onPointerDown={handlePointerDown}
        step={numericStep}
        type="number"
        value={internalValue}
      />
    </div>
  );
}
