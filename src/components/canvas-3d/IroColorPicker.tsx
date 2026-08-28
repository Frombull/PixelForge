"use client";

import iro from "@jaames/iro";
import { useEffect, useRef, type CSSProperties } from "react";
import { type ColorInputState } from "./types";
import { clamp } from "./workspaceMath";

type IroColorPickerProps = {
  colorInputs: ColorInputState;
  onUpdateRgbColor: (channel: "r" | "g" | "b", value: number) => void;
  onUpdateHsvColor: (channel: "h" | "s" | "v", value: number) => void;
  onAlphaChange: (alpha: number) => void;
  onSetHexDraft: (hex: string) => void;
  onApplyHex: (hex: string) => void;
  onSetColorFromPicker: (hex: string) => void;
};

type ColorSliderProps = {
  id: string;
  label: string;
  max: number;
  suffix?: string;
  value: number;
  background: string;
  onChange: (value: number) => void;
};

function ColorSlider({
  id,
  label,
  max,
  suffix = "",
  value,
  background,
  onChange,
}: ColorSliderProps) {
  const roundedValue = Math.round(value);

  return (
    <div className="grid grid-cols-[4.5rem_1fr_2.75rem] items-center gap-2">
      <label className="truncate text-[0.68rem] text-(--ui-text)" htmlFor={id} title={label}>
        {label}
      </label>
      <input
        aria-valuetext={`${roundedValue}${suffix}`}
        className="iro-color-slider"
        id={id}
        max={max}
        min={0}
        onChange={(event) => onChange(clamp(Number(event.target.value), 0, max))}
        step={1}
        style={{ "--slider-background": background } as CSSProperties}
        type="range"
        value={roundedValue}
      />
      <output className="rounded-[0.2rem] border border-[#2a2d3e] bg-(--ui-field-bg) px-1.5 py-0.5 text-right text-[0.68rem] tabular-nums text-(--ui-text)" htmlFor={id}>
        {roundedValue}{suffix}
      </output>
    </div>
  );
}

export default function IroColorPicker({
  colorInputs,
  onUpdateRgbColor,
  onUpdateHsvColor,
  onAlphaChange,
  onSetHexDraft,
  onApplyHex,
  onSetColorFromPicker,
}: IroColorPickerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<iro.ColorPicker | null>(null);
  const onPickerChangeRef = useRef(onSetColorFromPicker);
  const isValidHex = /^#[0-9A-F]{6}$/i.test(colorInputs.hex);
  const previewHex = isValidHex ? colorInputs.hex : "transparent";

  useEffect(() => {
    onPickerChangeRef.current = onSetColorFromPicker;
  }, [onSetColorFromPicker]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const picker = iro.ColorPicker(mount, {
      width: 196,
      color: colorInputs.hex,
      borderWidth: 1,
      borderColor: "#b7b8c0",
      handleRadius: 7,
      padding: 3,
      wheelAngle: 0,
      wheelDirection: "anticlockwise",
      wheelLightness: true,
      layout: [{ component: iro.ui.Wheel }],
    });

    const handleInputChange = (color: iro.Color) => {
      onPickerChangeRef.current(color.hexString);
    };

    picker.on("input:change", handleInputChange);
    pickerRef.current = picker;

    return () => {
      picker.off("input:change", handleInputChange);
      pickerRef.current = null;
      mount.replaceChildren();
    };
    // The picker is mounted once; later color changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker || !isValidHex) return;

    if (picker.color.hexString.toLowerCase() !== colorInputs.hex.toLowerCase()) {
      picker.color.hexString = colorInputs.hex;
    }
  }, [colorInputs.hex, isValidHex]);

  const hueGradient = "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
  const saturationGradient = `linear-gradient(to right, hsl(${colorInputs.h}, 0%, 50%), hsl(${colorInputs.h}, 100%, 50%))`;
  const valueGradient = `linear-gradient(to right, #000000, hsl(${colorInputs.h}, ${colorInputs.s}%, 50%))`;
  const redGradient = `linear-gradient(to right, rgb(0, ${colorInputs.g}, ${colorInputs.b}), rgb(255, ${colorInputs.g}, ${colorInputs.b}))`;
  const greenGradient = `linear-gradient(to right, rgb(${colorInputs.r}, 0, ${colorInputs.b}), rgb(${colorInputs.r}, 255, ${colorInputs.b}))`;
  const blueGradient = `linear-gradient(to right, rgb(${colorInputs.r}, ${colorInputs.g}, 0), rgb(${colorInputs.r}, ${colorInputs.g}, 255))`;
  const alphaGradient = `linear-gradient(to right, rgba(${colorInputs.r}, ${colorInputs.g}, ${colorInputs.b}, 0), rgb(${colorInputs.r}, ${colorInputs.g}, ${colorInputs.b}))`;
  const scalarInputClass = "w-full min-w-0 rounded-[0.35rem] border border-[#2a2d3e] bg-(--ui-field-bg) px-[0.35rem] py-[0.3rem] text-[0.72rem] text-(--ui-text)";

  return (
    <div id="iro-color-picker">
      <div
        aria-label="Seletor circular de cor"
        className="flex justify-center py-1"
        ref={mountRef}
        role="group"
      />

      <div className="mt-3 border-t border-[#2a2d3e] pt-2">
        <div className="mb-1.5 text-[0.65rem] uppercase tracking-[0.08em] text-(--ui-accent)">HSV</div>
        <div className="space-y-1.5">
          <ColorSlider id="color-h" label="Ângulo (H)" max={360} suffix="°" value={colorInputs.h} background={hueGradient} onChange={(value) => onUpdateHsvColor("h", value)} />
          <ColorSlider id="color-s" label="Saturação" max={100} suffix="%" value={colorInputs.s} background={saturationGradient} onChange={(value) => onUpdateHsvColor("s", value)} />
          <ColorSlider id="color-v" label="Brilho (V)" max={100} suffix="%" value={colorInputs.v} background={valueGradient} onChange={(value) => onUpdateHsvColor("v", value)} />
        </div>
      </div>

      <div className="mt-2 border-t border-[#2a2d3e] pt-2">
        <div className="mb-1.5 text-[0.65rem] uppercase tracking-[0.08em] text-(--ui-accent)">RGB</div>
        <div className="space-y-1.5">
          <ColorSlider id="color-r" label="Vermelho" max={255} value={colorInputs.r} background={redGradient} onChange={(value) => onUpdateRgbColor("r", value)} />
          <ColorSlider id="color-g" label="Verde" max={255} value={colorInputs.g} background={greenGradient} onChange={(value) => onUpdateRgbColor("g", value)} />
          <ColorSlider id="color-b" label="Azul" max={255} value={colorInputs.b} background={blueGradient} onChange={(value) => onUpdateRgbColor("b", value)} />
        </div>
      </div>

      <div className="mt-2 border-t border-[#2a2d3e] pt-2">
        <ColorSlider id="color-alpha" label="Alpha" max={100} suffix="%" value={colorInputs.alpha} background={alphaGradient} onChange={onAlphaChange} />
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-[#2a2d3e] pt-2 text-[0.72rem]">
        <span
          aria-hidden="true"
          className="h-7 w-7 shrink-0 rounded-[0.2rem] border border-[#2a2d3e]"
          style={{ backgroundColor: previewHex }}
        />
        <label className="text-(--ui-text)" htmlFor="color-hex">Hex</label>
        <input
          className={scalarInputClass}
          id="color-hex"
          maxLength={7}
          onBlur={(event) => onApplyHex(event.target.value)}
          onChange={(event) => onSetHexDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onApplyHex((event.target as HTMLInputElement).value);
            }
          }}
          placeholder="#ffffff"
          type="text"
          value={colorInputs.hex}
        />
      </div>
    </div>
  );
}
