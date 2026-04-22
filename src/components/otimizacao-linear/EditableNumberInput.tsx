"use client";

import { useEffect, useState } from "react";

const NUMERIC_INPUT_REGEX = /^-?\d*(?:[.,]\d*)?$/;

function normalizeNumericText(raw: string) {
  return raw.replace(",", ".").trim();
}

type EditableNumberInputProps = {
  value: number;
  onValueChange: (next: number) => void;
  className: string;
};

export default function EditableNumberInput({
  value,
  onValueChange,
  className,
}: EditableNumberInputProps) {
  const [text, setText] = useState(() => `${value}`);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(`${value}`);
    }
  }, [value, isFocused]);

  const tryCommit = (raw: string) => {
    const normalized = normalizeNumericText(raw);
    if (
      normalized === "" ||
      normalized === "-" ||
      normalized === "." ||
      normalized === "-."
    ) {
      return false;
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return false;
    onValueChange(parsed);
    return true;
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => setIsFocused(true)}
      onChange={(e) => {
        const raw = e.target.value;
        if (!NUMERIC_INPUT_REGEX.test(raw)) return;
        setText(raw);
        tryCommit(raw);
      }}
      onBlur={() => {
        setIsFocused(false);
        if (!tryCommit(text)) {
          setText(`${value}`);
          return;
        }
        setText(normalizeNumericText(text));
      }}
      className={className}
    />
  );
}
