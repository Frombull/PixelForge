"use client";

import { Plus, Trash2 } from "lucide-react";
import EditableNumberInput from "./EditableNumberInput";
import type {
  Constraint,
  ConstraintRelation,
  ObjectiveMode,
  SolverResult,
} from "./types";

type LinearProgrammingControlsProps = {
  mode: ObjectiveMode;
  onModeChange: (next: ObjectiveMode) => void;
  variableCount: number;
  canDecreaseVariables: boolean;
  canIncreaseVariables: boolean;
  onVariableCountChange: (next: number) => void;
  normalizedObjective: number[];
  onObjectiveCoeffChange: (index: number, value: number) => void;
  normalizedConstraints: Constraint[];
  onConstraintCoeffChange: (id: number, varIndex: number, value: number) => void;
  onConstraintChange: (id: number, patch: Partial<Constraint>) => void;
  onAddConstraint: () => void;
  onRemoveConstraint: (id: number) => void;
  result: SolverResult;
  formatNum: (value: number) => string;
};

export default function LinearProgrammingControls({
  mode,
  onModeChange,
  variableCount,
  canDecreaseVariables,
  canIncreaseVariables,
  onVariableCountChange,
  normalizedObjective,
  onObjectiveCoeffChange,
  normalizedConstraints,
  onConstraintCoeffChange,
  onConstraintChange,
  onAddConstraint,
  onRemoveConstraint,
  result,
  formatNum,
}: LinearProgrammingControlsProps) {
  return (
    <section className="bg-[#0d0d0d] p-4 md:p-5">
      <div className="flex items-baseline gap-4 mb-7 pb-5 border-b border-[#1e1e1e]">
        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
          entrada
        </span>
        <span className="text-[20px] font-normal text-[#ececec] tracking-[-0.01em]">
          Modelo LP Geral
        </span>
      </div>

      <div className="mb-4 bg-[#111] border border-[#1f1f1f] p-3">
        <label className="flex items-center gap-3">
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#575757] uppercase tracking-[0.08em]">
            Número de variáveis
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Diminuir número de variáveis"
              onClick={() => onVariableCountChange(variableCount - 1)}
              disabled={!canDecreaseVariables}
              className={`h-7 w-7 border text-[14px] leading-none transition-colors ${
                canDecreaseVariables
                  ? "border-[#2a2a2a] bg-[#121212] text-[#a0a0a0] hover:text-[#e0e0e0] cursor-pointer"
                  : "border-[#222] bg-[#101010] text-[#4d4d4d] cursor-not-allowed"
              }`}
            >
              -
            </button>

            <EditableNumberInput
              value={variableCount}
              onValueChange={(v) => onVariableCountChange(Math.round(v))}
              className="w-16 bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#e5e5e5] focus:outline-none focus:border-[#4b4b4b]"
            />

            <button
              type="button"
              aria-label="Aumentar número de variáveis"
              onClick={() => onVariableCountChange(variableCount + 1)}
              disabled={!canIncreaseVariables}
              className={`h-7 w-7 border text-[14px] leading-none transition-colors ${
                canIncreaseVariables
                  ? "border-[#2a2a2a] bg-[#121212] text-[#a0a0a0] hover:text-[#e0e0e0] cursor-pointer"
                  : "border-[#222] bg-[#101010] text-[#4d4d4d] cursor-not-allowed"
              }`}
            >
              +
            </button>
          </div>
        </label>
      </div>

      <div className="mb-6">
        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest text-[#555] uppercase mb-3">
          Objetivo
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => onModeChange("max")}
            className={`px-4 py-2 border text-[12px] font-['IBM_Plex_Mono',monospace] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
              mode === "max"
                ? "border-[#76c893] bg-[#14201a] text-[#9be3b2]"
                : "border-[#2b2b2b] bg-[#121212] text-[#676767] hover:text-[#9f9f9f]"
            }`}
          >
            Maximizar
          </button>
          <button
            type="button"
            onClick={() => onModeChange("min")}
            className={`px-4 py-2 border text-[12px] font-['IBM_Plex_Mono',monospace] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
              mode === "min"
                ? "border-[#f0b26b] bg-[#251b11] text-[#f8c588]"
                : "border-[#2b2b2b] bg-[#121212] text-[#676767] hover:text-[#9f9f9f]"
            }`}
          >
            Minimizar
          </button>
        </div>

        <div className="bg-[#111] border border-[#1f1f1f] p-3">
          <div className="text-[13px] text-[#858585] mb-3">
            {mode === "max" ? "Max" : "Min"} Z = c1.x1 + c2.x2 + ... + cn.xn
          </div>

          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="flex gap-2 min-w-max">
              {normalizedObjective.map((coef, idx) => (
                <label key={`obj-${idx}`} className="flex flex-col gap-1 w-19.5 shrink-0">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#575757] uppercase tracking-[0.08em]">
                    c{idx + 1}
                  </span>
                  <EditableNumberInput
                    value={coef}
                    onValueChange={(v) => onObjectiveCoeffChange(idx, v)}
                    className="bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#ddd] focus:outline-none focus:border-[#4b4b4b]"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest text-[#555] uppercase">
            Restrições
          </div>
          <button
            type="button"
            onClick={onAddConstraint}
            className="inline-flex items-center gap-1.5 border border-[#2a2a2a] bg-[#121212] text-[#8a8a8a] px-2.5 py-1.5 text-[10px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] hover:text-[#d0d0d0] transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Nova
          </button>
        </div>

        <div className="space-y-2">
          {normalizedConstraints.map((constraint) => (
            <div key={constraint.id} className="bg-[#111] border border-[#1f1f1f] p-2.5">
              <div className="overflow-x-auto no-scrollbar pb-1 mb-2">
                <div className="flex gap-2 min-w-max">
                  {constraint.coeffs.map((coef, idx) => (
                    <label key={`r-${constraint.id}-${idx}`} className="flex flex-col gap-1 w-19.5 shrink-0">
                      <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#575757] uppercase tracking-[0.08em]">
                        x{idx + 1}
                      </span>
                      <EditableNumberInput
                        value={coef}
                        onValueChange={(v) => onConstraintCoeffChange(constraint.id, idx, v)}
                        className="bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#ddd] focus:outline-none focus:border-[#4b4b4b]"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[95px_1fr_auto] gap-2 items-end">
                <label className="flex flex-col gap-1">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#575757] uppercase tracking-[0.08em]">
                    Sinal
                  </span>
                  <select
                    value={constraint.relation}
                    onChange={(e) =>
                      onConstraintChange(constraint.id, {
                        relation: e.target.value as ConstraintRelation,
                      })
                    }
                    className="bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#ddd] focus:outline-none focus:border-[#4b4b4b] cursor-pointer"
                  >
                    <option value="<=">&lt;=</option>
                    <option value=">=">&gt;=</option>
                    <option value="=">=</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#575757] uppercase tracking-[0.08em]">
                    Lado Direito
                  </span>
                  <EditableNumberInput
                    value={constraint.rhs}
                    onValueChange={(v) =>
                      onConstraintChange(constraint.id, {
                        rhs: v,
                      })
                    }
                    className="bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#ddd] focus:outline-none focus:border-[#4b4b4b]"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onRemoveConstraint(constraint.id)}
                  className="h-8.5 w-8.5 border border-[#2a2a2a] bg-[#121212] text-[#6e6e6e] hover:text-[#e08f8f] hover:border-[#5a2f2f] transition-colors inline-flex items-center justify-center cursor-pointer"
                  title="Remover restricao"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <div className="bg-[#101010] border border-dashed border-[#2b2b2b] p-2.5 opacity-90">
            <div className="flex items-center justify-between mb-2">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#676767] uppercase tracking-[0.08em]">
                Não negatividade
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: variableCount }, (_, idx) => (
                <span
                  key={`nn-${idx}`}
                  className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#7b7b7b] border border-[#2a2a2a] bg-[#131313] px-2 py-1"
                >
                  x{idx + 1} &gt;= 0
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-[#1a1a1a] space-y-2 text-[13px] leading-[1.7] text-[#888]">
        <div className="border border-[#2b2b2b] bg-[#141414] px-3 py-2 text-[#b8b8b8]">
          {result.statusText}
        </div>

        {result.feasible && result.optimal && result.optimalValue != null && (
          <div className="border border-[#274430] bg-[#121c15] px-3 py-2 text-[#a3d7b2]">
            Solução ótima: Z = {formatNum(result.optimalValue)}
          </div>
        )}

        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] uppercase tracking-[0.08em] pt-2">
          Vértices candidatos viáveis: {result.feasibleVertices.length}
        </div>
      </div>
    </section>
  );
}
