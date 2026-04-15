"use client";

import DraggableNumberInput from "./DraggableNumberInput";
import { clamp } from "./workspaceMath";
import { type ColorInputState, type ColorMode, type SelectedObjectState } from "./types";

type RightSidebarProps = {
  selected: SelectedObjectState | null;
  isTransformOpen: boolean;
  isMaterialOpen: boolean;
  colorMode: ColorMode;
  colorInputs: ColorInputState;
  onToggleTransform: () => void;
  onToggleMaterial: () => void;
  onSetColorMode: (mode: ColorMode) => void;
  onUpdateTransform: (field: string, value: number) => void;
  onResetTransformGroup: (targets: string[]) => void;
  onUpdateRgbColor: (channel: "r" | "g" | "b", value: number) => void;
  onUpdateHsvColor: (channel: "h" | "s" | "v", value: number) => void;
  onAlphaChange: (alpha: number) => void;
  onSetHexDraft: (hex: string) => void;
  onApplyHex: (hex: string) => void;
  onSetColorFromPicker: (hex: string) => void;
};

type TransformField = {
  id: string;
  transformKey: string;
  axisLabel: string;
  value: number;
  step: number;
  min?: number;
};

function CollapsibleHeader({
  title,
  isOpen,
  onClick,
  className,
}: {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <div className={className} onClick={onClick} role="button" tabIndex={0}>
      <svg
        className={`h-[0.9rem] w-[0.9rem] transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <span className="group-title">{title}</span>
    </div>
  );
}

function TransformGroup({
  title,
  fields,
  axisInputClass,
  resetButtonClass,
  onUpdateTransform,
  onReset,
}: {
  title: string;
  fields: TransformField[];
  axisInputClass: string;
  resetButtonClass: string;
  onUpdateTransform: (field: string, value: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div className="mb-[0.3rem] mt-[0.55rem]"><span className="text-[0.68rem] uppercase text-(--ui-text-muted)">{title}</span></div>
      <div className="flex items-stretch gap-[0.35rem]">
        <div className="grid flex-1 grid-cols-3 gap-[0.35rem]">
          {fields.map((field) => (
            <div className="relative flex items-center" key={field.id}>
              <DraggableNumberInput
                className={axisInputClass}
                handlePosition="left"
                id={field.id}
                min={field.min}
                onValueChange={(value) => onUpdateTransform(field.transformKey, value)}
                step={field.step}
                value={field.value}
              />
              <span className="pointer-events-none absolute right-[0.42rem] text-[0.68rem] text-(--ui-accent)">{field.axisLabel}</span>
            </div>
          ))}
        </div>
        <button className={`${resetButtonClass} min-w-4 w-auto px-[0.45rem] text-[0.68rem]`} onClick={onReset} type="button">
          R
        </button>
      </div>
    </>
  );
}

export default function RightSidebar({
  selected,
  isTransformOpen,
  isMaterialOpen,
  colorMode,
  colorInputs,
  onToggleTransform,
  onToggleMaterial,
  onSetColorMode,
  onUpdateTransform,
  onResetTransformGroup,
  onUpdateRgbColor,
  onUpdateHsvColor,
  onAlphaChange,
  onSetHexDraft,
  onApplyHex,
  onSetColorFromPicker,
}: RightSidebarProps) {
  const panelHeaderClass = "mb-[0.55rem] p-0 text-xs uppercase tracking-[0.08em] text-(--ui-accent)";
  const panelButtonActiveClass = "!bg-(--ui-accent-active-bg)";
  const resetButtonClass = "h-[1.4rem] w-[1.4rem] rounded-[0.35rem] text-(--ui-text) transition-colors hover:border-(--ui-accent) hover:text-(--ui-accent)";
  const inspectorHeaderClass = "mb-[0.55rem] flex cursor-pointer items-center gap-[0.45rem] rounded-[0.2rem] bg-(--ui-collapse-bg) px-2 py-1 text-xs text-(--ui-accent)";
  const scalarInputClass = "w-full min-w-0 rounded-[0.35rem] border border-[#2a2d3e] bg-(--ui-field-bg) px-[0.35rem] py-[0.2rem] text-[0.72rem] text-(--ui-text)";
  const axisInputClass = `${scalarInputClass} pr-[1.6rem]`;

  if (!selected) {
    return (
      <aside id="sidebar-right" className="w-80 shrink-0 border-l border-[#2a2d3e] p-2 max-lg:hidden">
        <div className={`${panelHeaderClass} text-center`}>
          <span className="inline-block text-center">Inspetor</span>
        </div>
        <div className="mt-[0.65rem] flex min-h-40 flex-col items-center justify-center gap-[0.35rem] p-0 text-center text-[0.78rem] text-(--ui-text-muted)" id="inspector-empty">
          <div className="text-2xl">◻</div>
          <div>Selecione um objeto para editar suas propriedades</div>
        </div>
      </aside>
    );
  }

  return (
    <aside id="sidebar-right" className="w-80 shrink-0 border-l border-[#2a2d3e] p-2 max-lg:hidden">
      <div className={`${panelHeaderClass} text-center`}>
        <span className="inline-block text-center">Inspetor</span>
      </div>

      <div id="inspector-panel">
        <div className="border-b border-[#2a2d3e]">
          <CollapsibleHeader title="Transform" isOpen={isTransformOpen} onClick={onToggleTransform} className={inspectorHeaderClass} />

          <div className={isTransformOpen ? "p-0" : "hidden p-0"} id="transform-content">
            <TransformGroup
              title="Position"
              fields={[
                { id: "pos-x", transformKey: "pos-x", axisLabel: "X", value: selected.position.x, step: 0.1 },
                { id: "pos-y", transformKey: "pos-y", axisLabel: "Y", value: selected.position.y, step: 0.1 },
                { id: "pos-z", transformKey: "pos-z", axisLabel: "Z", value: selected.position.z, step: 0.1 },
              ]}
              axisInputClass={axisInputClass}
              resetButtonClass={resetButtonClass}
              onUpdateTransform={onUpdateTransform}
              onReset={() => onResetTransformGroup(["pos-x", "pos-y", "pos-z"])}
            />

            <TransformGroup
              title="Rotation"
              fields={[
                { id: "rot-x", transformKey: "rot-x", axisLabel: "X", value: selected.rotation.x, step: 1 },
                { id: "rot-y", transformKey: "rot-y", axisLabel: "Y", value: selected.rotation.y, step: 1 },
                { id: "rot-z", transformKey: "rot-z", axisLabel: "Z", value: selected.rotation.z, step: 1 },
              ]}
              axisInputClass={axisInputClass}
              resetButtonClass={resetButtonClass}
              onUpdateTransform={onUpdateTransform}
              onReset={() => onResetTransformGroup(["rot-x", "rot-y", "rot-z"])}
            />

            <TransformGroup
              title="Scale"
              fields={[
                { id: "scale-x", transformKey: "scale-x", axisLabel: "X", value: selected.scale.x, step: 0.1, min: 0.1 },
                { id: "scale-y", transformKey: "scale-y", axisLabel: "Y", value: selected.scale.y, step: 0.1, min: 0.1 },
                { id: "scale-z", transformKey: "scale-z", axisLabel: "Z", value: selected.scale.z, step: 0.1, min: 0.1 },
              ]}
              axisInputClass={axisInputClass}
              resetButtonClass={resetButtonClass}
              onUpdateTransform={onUpdateTransform}
              onReset={() => onResetTransformGroup(["scale-x", "scale-y", "scale-z"])}
            />

            <TransformGroup
              title="Skew"
              fields={[
                { id: "skew-xy", transformKey: "skew-xy", axisLabel: "XY", value: selected.skew.xy, step: 0.1 },
                { id: "skew-xz", transformKey: "skew-xz", axisLabel: "XZ", value: selected.skew.xz, step: 0.1 },
                { id: "skew-yx", transformKey: "skew-yx", axisLabel: "YX", value: selected.skew.yx, step: 0.1 },
                { id: "skew-yz", transformKey: "skew-yz", axisLabel: "YZ", value: selected.skew.yz, step: 0.1 },
                { id: "skew-zx", transformKey: "skew-zx", axisLabel: "ZX", value: selected.skew.zx, step: 0.1 },
                { id: "skew-zy", transformKey: "skew-zy", axisLabel: "ZY", value: selected.skew.zy, step: 0.1 },
              ]}
              axisInputClass={axisInputClass}
              resetButtonClass={resetButtonClass}
              onUpdateTransform={onUpdateTransform}
              onReset={() => onResetTransformGroup(["skew-xy", "skew-xz", "skew-yx", "skew-yz", "skew-zx", "skew-zy"])}
            />
          </div>
        </div>

        <div className="mt-3 border-b border-[#2a2d3e] py-[0.7rem]">
          <CollapsibleHeader title="Material" isOpen={isMaterialOpen} onClick={onToggleMaterial} className={inspectorHeaderClass} />

          <div className={isMaterialOpen ? "p-0" : "hidden p-0"} id="material-content">
            <div className="mb-[0.45rem] flex gap-[0.3rem]">
              <button
                className={`flex-1 rounded-[0.35rem] border border-[#2a2d3e] py-1 text-[0.72rem] text-(--ui-text) ${
                  colorMode === "rgb" ? panelButtonActiveClass : ""
                }`}
                onClick={() => onSetColorMode("rgb")}
                type="button"
              >
                RGB
              </button>
              <button
                className={`flex-1 rounded-[0.35rem] border border-[#2a2d3e] py-1 text-[0.72rem] text-(--ui-text) ${
                  colorMode === "hsv" ? panelButtonActiveClass : ""
                }`}
                onClick={() => onSetColorMode("hsv")}
                type="button"
              >
                HSV
              </button>
            </div>

            {colorMode === "rgb" ? (
              <div className="grid grid-cols-3 gap-[0.35rem]" id="rgb-inputs">
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-r">R</label><DraggableNumberInput className={scalarInputClass} id="color-r" max={255} min={0} onValueChange={(value) => onUpdateRgbColor("r", value)} step={1} value={colorInputs.r} /></div>
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-g">G</label><DraggableNumberInput className={scalarInputClass} id="color-g" max={255} min={0} onValueChange={(value) => onUpdateRgbColor("g", value)} step={1} value={colorInputs.g} /></div>
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-b">B</label><DraggableNumberInput className={scalarInputClass} id="color-b" max={255} min={0} onValueChange={(value) => onUpdateRgbColor("b", value)} step={1} value={colorInputs.b} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[0.35rem]" id="hsv-inputs">
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-h">H</label><DraggableNumberInput className={scalarInputClass} id="color-h" max={360} min={0} onValueChange={(value) => onUpdateHsvColor("h", value)} step={1} value={colorInputs.h} /></div>
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-s">S</label><DraggableNumberInput className={scalarInputClass} id="color-s" max={100} min={0} onValueChange={(value) => onUpdateHsvColor("s", value)} step={1} value={colorInputs.s} /></div>
                <div className="relative flex items-center"><label className="min-w-3 text-[0.68rem] text-(--ui-accent)" htmlFor="color-v">V</label><DraggableNumberInput className={scalarInputClass} id="color-v" max={100} min={0} onValueChange={(value) => onUpdateHsvColor("v", value)} step={1} value={colorInputs.v} /></div>
              </div>
            )}

            <div className="mt-[0.55rem] flex items-center gap-[0.45rem] text-[0.72rem]">
              <span className="text-(--ui-text-muted)">Alpha</span>
              <input
                className="flex-1 accent-(--ui-accent)"
                id="color-alpha"
                max="100"
                min="0"
                onChange={(event) => onAlphaChange(clamp(Number(event.target.value), 0, 100))}
                step="1"
                type="range"
                value={String(colorInputs.alpha)}
              />
              <span id="alpha-value">{`${colorInputs.alpha}%`}</span>
            </div>

            <div className="mt-[0.55rem] flex items-center gap-[0.45rem] text-[0.72rem]">
              <span className="text-(--ui-text-muted)">Hex</span>
              <input
                aria-label="Color picker"
                id="color-picker"
                type="color"
                className="h-7 w-7 p-0 border-none bg-transparent"
                value={colorInputs.hex}
                onChange={(event) => onSetColorFromPicker(String(event.target.value || "#ffffff"))}
              />

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
        </div>
      </div>
    </aside>
  );
}
