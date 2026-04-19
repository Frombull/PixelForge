"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type ObjectiveMode = "max" | "min";
type ConstraintRelation = "<=" | ">=" | "=";

type Constraint = {
  id: number;
  coeffs: number[];
  relation: ConstraintRelation;
  rhs: number;
};

type SolverResult = {
  feasibleVertices: number[][];
  projectedPoints: { x: number; y: number }[];
  optimal: number[] | null;
  optimalValue: number | null;
  feasible: boolean;
  statusText: string;
};

const EPS = 1e-7;
const CHART_WIDTH = 760;
const CHART_HEIGHT = 520;
const MAX_VARIABLES = 8;

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
  `}</style>
);

const NUMERIC_INPUT_REGEX = /^-?\d*(?:[.,]\d*)?$/;

function normalizeNumericText(raw: string) {
  return raw.replace(",", ".").trim();
}

function EditableNumberInput({
  value,
  onValueChange,
  className,
}: {
  value: number;
  onValueChange: (next: number) => void;
  className: string;
}) {
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

function formatNum(v: number) {
  return Number.isInteger(v)
    ? `${v}`
    : v.toFixed(4).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function dot(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

function passesConstraint(point: number[], c: Constraint) {
  const lhs = dot(c.coeffs, point);
  if (c.relation === "<=") return lhs <= c.rhs + EPS;
  if (c.relation === ">=") return lhs >= c.rhs - EPS;
  return Math.abs(lhs - c.rhs) <= EPS;
}

function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = a.length;
  const aug = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }

    if (Math.abs(aug[pivot][col]) < EPS) return null;

    if (pivot !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivot];
      aug[pivot] = tmp;
    }

    const div = aug[col][col];
    for (let j = col; j <= n; j += 1) aug[col][j] /= div;

    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (Math.abs(factor) < EPS) continue;
      for (let j = col; j <= n; j += 1) {
        aug[r][j] -= factor * aug[col][j];
      }
    }
  }

  return aug.map((row) => row[n]);
}

function chooseCombinations(total: number, k: number): number[][] {
  const result: number[][] = [];
  if (k <= 0 || k > total) return result;

  const current: number[] = [];
  const dfs = (start: number) => {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < total; i += 1) {
      current.push(i);
      dfs(i + 1);
      current.pop();
    }
  };

  dfs(0);
  return result;
}

function dedupePoints(points: number[][]) {
  const map = new Map<string, number[]>();
  for (const p of points) {
    const key = p.map((v) => Math.round(v * 1e6)).join("|");
    if (!map.has(key)) map.set(key, p);
  }
  return Array.from(map.values());
}

function cross2D(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull2D(points: { x: number; y: number }[]) {
  if (points.length <= 2) return [...points];

  const sorted = [...points].sort((p1, p2) =>
    p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x,
  );

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= EPS) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= EPS) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function resizeArray(values: number[], size: number, fallback = 0) {
  if (values.length === size) return [...values];
  if (values.length > size) return values.slice(0, size);
  return [...values, ...Array(size - values.length).fill(fallback)];
}

function solveLP(
  mode: ObjectiveMode,
  objective: number[],
  userConstraints: Constraint[],
): SolverResult {
  const n = objective.length;

  const nonNegativity: Constraint[] = Array.from({ length: n }, (_, idx) => {
    const coeffs = Array(n).fill(0);
    coeffs[idx] = 1;
    return {
      id: -1000 - idx,
      coeffs,
      relation: ">=" as const,
      rhs: 0,
    };
  });

  const allConstraints: Constraint[] = [...userConstraints, ...nonNegativity];

  const equationPool = allConstraints.map((c) => ({ coeffs: c.coeffs, rhs: c.rhs }));

  const candidateVertices: number[][] = [];

  if (equationPool.length >= n) {
    const combos = chooseCombinations(equationPool.length, n);

    for (const combo of combos) {
      const a = combo.map((idx) => equationPool[idx].coeffs);
      const b = combo.map((idx) => equationPool[idx].rhs);
      const sol = solveLinearSystem(a, b);
      if (!sol) continue;
      if (sol.some((v) => !Number.isFinite(v))) continue;

      if (allConstraints.every((c) => passesConstraint(sol, c))) {
        candidateVertices.push(sol);
      }
    }
  }

  const origin = Array(n).fill(0);
  if (allConstraints.every((c) => passesConstraint(origin, c))) {
    candidateVertices.push(origin);
  }

  const feasibleVertices = dedupePoints(candidateVertices);

  if (feasibleVertices.length === 0) {
    return {
      feasibleVertices: [],
      projectedPoints: [],
      optimal: null,
      optimalValue: null,
      feasible: false,
      statusText: "Sistema inviável: nenhuma solução atende todas as restrições.",
    };
  }

  let best = feasibleVertices[0];
  let bestVal = dot(objective, best);

  for (let i = 1; i < feasibleVertices.length; i += 1) {
    const v = dot(objective, feasibleVertices[i]);
    if ((mode === "max" && v > bestVal) || (mode === "min" && v < bestVal)) {
      best = feasibleVertices[i];
      bestVal = v;
    }
  }

  const projectedPoints = feasibleVertices.map((p) => ({ x: p[0] ?? 0, y: p[1] ?? 0 }));

  return {
    feasibleVertices,
    projectedPoints,
    optimal: best,
    optimalValue: bestVal,
    feasible: true,
    statusText:
      "Solução obtida por enumeração de vértices candidatos. Para n > 2.",
  };
}

export default function ProgramacaoLinearPage() {
  const [mode, setMode] = useState<ObjectiveMode>("max");
  const [variableCount, setVariableCount] = useState(3);
  const [objective, setObjective] = useState<number[]>([3, 5, 2]);
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: 1, coeffs: [1, 1, 1], relation: "<=", rhs: 12 },
    { id: 2, coeffs: [2, 1, 0], relation: "<=", rhs: 14 },
    { id: 3, coeffs: [1, 3, 2], relation: "<=", rhs: 20 },
  ]);

  const normalizedObjective = useMemo(
    () => resizeArray(objective, variableCount, 0),
    [objective, variableCount],
  );

  const normalizedConstraints = useMemo(
    () =>
      constraints.map((c) => ({
        ...c,
        coeffs: resizeArray(c.coeffs, variableCount, 0),
      })),
    [constraints, variableCount],
  );

  const result = useMemo(
    () => solveLP(mode, normalizedObjective, normalizedConstraints),
    [mode, normalizedObjective, normalizedConstraints],
  );

  const bounds = useMemo(() => {
    const pts = result.projectedPoints.length > 0 ? result.projectedPoints : [{ x: 0, y: 0 }];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);

    let minX = Math.min(0, ...xs);
    let maxX = Math.max(1, ...xs);
    let minY = Math.min(0, ...ys);
    let maxY = Math.max(1, ...ys);

    if (Math.abs(maxX - minX) < EPS) {
      maxX += 1;
      minX -= 1;
    }
    if (Math.abs(maxY - minY) < EPS) {
      maxY += 1;
      minY -= 1;
    }

    const padX = (maxX - minX) * 0.15;
    const padY = (maxY - minY) * 0.15;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [result.projectedPoints]);

  const margin = { left: 64, right: 26, top: 26, bottom: 58 };
  const plotW = CHART_WIDTH - margin.left - margin.right;
  const plotH = CHART_HEIGHT - margin.top - margin.bottom;

  const sx = (x: number) =>
    margin.left + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
  const sy = (y: number) =>
    margin.top + (1 - (y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;

  const hull = useMemo(() => convexHull2D(result.projectedPoints), [result.projectedPoints]);
  const hullPath =
    hull.length >= 3
      ? hull.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ") + " Z"
      : "";

  const optimal2D = result.optimal
    ? {
        x: result.optimal[0] ?? 0,
        y: result.optimal[1] ?? 0,
      }
    : null;

  const objectiveLine = useMemo(() => {
    if (!optimal2D || result.optimalValue == null) return null;
    const c1 = normalizedObjective[0] ?? 0;
    const c2 = normalizedObjective[1] ?? 0;

    if (Math.abs(c1) < EPS && Math.abs(c2) < EPS) return null;

    if (Math.abs(c2) > EPS) {
      const p1 = { x: bounds.minX, y: (result.optimalValue - c1 * bounds.minX) / c2 };
      const p2 = { x: bounds.maxX, y: (result.optimalValue - c1 * bounds.maxX) / c2 };
      return [p1, p2];
    }

    if (Math.abs(c1) > EPS) {
      const x = result.optimalValue / c1;
      return [
        { x, y: bounds.minY },
        { x, y: bounds.maxY },
      ];
    }

    return null;
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, normalizedObjective, optimal2D, result.optimalValue]);

  function setVariableCountSafe(next: number) {
    const safe = Math.max(2, Math.min(MAX_VARIABLES, next));
    setVariableCount(safe);
    setObjective((prev) => resizeArray(prev, safe, 0));
    setConstraints((prev) =>
      prev.map((c) => ({
        ...c,
        coeffs: resizeArray(c.coeffs, safe, 0),
      })),
    );
  }

  function updateObjectiveAt(index: number, value: number) {
    setObjective((prev) => {
      const next = [...resizeArray(prev, variableCount, 0)];
      next[index] = value;
      return next;
    });
  }

  function updateConstraint(id: number, patch: Partial<Constraint>) {
    setConstraints((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateConstraintCoeff(id: number, varIndex: number, value: number) {
    setConstraints((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const coeffs = resizeArray(c.coeffs, variableCount, 0);
        coeffs[varIndex] = value;
        return { ...c, coeffs };
      }),
    );
  }

  function addConstraint() {
    const nextId = constraints.length ? Math.max(...constraints.map((c) => c.id)) + 1 : 1;
    setConstraints((prev) => [
      ...prev,
      {
        id: nextId,
        coeffs: Array(variableCount).fill(0).map((_, i) => (i === 0 ? 1 : 0)),
        relation: "<=",
        rhs: 10,
      },
    ]);
  }

  function removeConstraint(id: number) {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  }

  const canDecreaseVariables = variableCount > 2;
  const canIncreaseVariables = variableCount < MAX_VARIABLES;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e0e0e0] pb-20 font-['DM_Sans',sans-serif]">
      <FontImport />

      <header className="flex items-end justify-between gap-8 pt-5 px-6 md:px-16 pb-6 border-b border-[#222]">
        <div>
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#555] tracking-[0.15em] uppercase mb-2.5 pl-11 md:pl-12">
            Otimizacao - Programacao Linear
          </div>
          <h1 className="flex items-center gap-3 md:gap-4 text-2xl md:text-4xl font-light tracking-[-0.02em] leading-[1.1] text-[#f0f0f0]">
            <Link
              href="/"
              className="flex items-center text-[#888] no-underline transition-all duration-200 hover:text-white cursor-pointer"
              title="Voltar para a Home"
            >
              <ArrowLeft size={30} strokeWidth={1} />
            </Link>
            <span>
              Salve Yvo :)
            </span>
          </h1>
        </div>

        <div className="font-['IBM_Plex_Mono',monospace] text-[10px] md:text-[11px] text-[#444] text-right leading-[1.8] tracking-[0.08em] uppercase">
          <div>n variaveis - metodo por vertices</div>
          <div>x1..xn &gt;= 0</div>
        </div>
      </header>

      <main className="px-4 md:px-16">
        <div className="flex items-center gap-6 font-['IBM_Plex_Mono',monospace] text-[10px] text-[#444] tracking-[0.2em] uppercase pt-10 pb-4 mb-8 border-b border-[#1a1a1a]">
          01 <span className="text-[#333]">-</span> Modelo, cálculo e projeção
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-0.5 bg-[#1a1a1a]">
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
                    onClick={() => setVariableCountSafe(variableCount - 1)}
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
                    onValueChange={(v) => setVariableCountSafe(Math.round(v))}
                    className="w-16 bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#e5e5e5] focus:outline-none focus:border-[#4b4b4b]"
                  />

                  <button
                    type="button"
                    aria-label="Aumentar número de variáveis"
                    onClick={() => setVariableCountSafe(variableCount + 1)}
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
                  onClick={() => setMode("max")}
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
                  onClick={() => setMode("min")}
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
                        onValueChange={(v) => updateObjectiveAt(idx, v)}
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
                  onClick={addConstraint}
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
                            onValueChange={(v) => updateConstraintCoeff(constraint.id, idx, v)}
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
                            updateConstraint(constraint.id, {
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
                            updateConstraint(constraint.id, {
                              rhs: v,
                            })
                          }
                          className="bg-[#0e0e0e] border border-[#2a2a2a] px-2 py-1 text-[#ddd] focus:outline-none focus:border-[#4b4b4b]"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeConstraint(constraint.id)}
                        className="h-8.5 w-8.5 border border-[#2a2a2a] bg-[#121212] text-[#6e6e6e] hover:text-[#e08f8f] hover:border-[#5a2f2f] transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Remover restricao">
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
                        className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#7b7b7b] border border-[#2a2a2a] bg-[#131313] px-2 py-1">
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

          <section className="bg-[#0d0d0d] p-4 md:p-5 pt-4">
            <div className="flex items-baseline gap-4 mb-6 pb-5 border-b border-[#1e1e1e]">
              <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#555] tracking-[0.18em] uppercase">
                saída
              </span>
              <span className="text-[20px] font-normal text-[#ececec] tracking-[-0.01em]">
                Projeção x1-x2 + vetor ótimo
              </span>
            </div>

            <div className="relative overflow-hidden border border-[#1f1f1f] bg-[#111]">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="relative z-10 w-full h-auto"
                role="img"
                aria-label="Gráfico da programação linear"
              >
                {[...Array(9)].map((_, i) => {
                  const xVal = bounds.minX + ((bounds.maxX - bounds.minX) * i) / 8;
                  const yVal = bounds.minY + ((bounds.maxY - bounds.minY) * i) / 8;
                  const x = sx(xVal);
                  const y = sy(yVal);
                  return (
                    <g key={`grid-${i}`}>
                      <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotH} stroke="#1c1c1c" strokeWidth="1" />
                      <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#1c1c1c" strokeWidth="1" />
                    </g>
                  );
                })}

                <line x1={sx(0)} y1={margin.top} x2={sx(0)} y2={margin.top + plotH} stroke="#4a4a4a" strokeWidth="1.5" />
                <line x1={margin.left} y1={sy(0)} x2={margin.left + plotW} y2={sy(0)} stroke="#4a4a4a" strokeWidth="1.5" />

                {normalizedConstraints.map((c, idx) => {
                  const palette = ["#8fbf8f", "#89a7d8", "#d8a889", "#b68fd2", "#c6cc85", "#8ebfc3"];
                  const stroke = palette[idx % palette.length];

                  const a1 = c.coeffs[0] ?? 0;
                  const a2 = c.coeffs[1] ?? 0;

                  let p1: { x: number; y: number } | null = null;
                  let p2: { x: number; y: number } | null = null;

                  if (Math.abs(a2) > EPS) {
                    p1 = { x: bounds.minX, y: (c.rhs - a1 * bounds.minX) / a2 };
                    p2 = { x: bounds.maxX, y: (c.rhs - a1 * bounds.maxX) / a2 };
                  } else if (Math.abs(a1) > EPS) {
                    const x = c.rhs / a1;
                    p1 = { x, y: bounds.minY };
                    p2 = { x, y: bounds.maxY };
                  }

                  if (!p1 || !p2) return null;

                  return (
                    <line
                      key={`constraint-${c.id}`}
                      x1={sx(p1.x)}
                      y1={sy(p1.y)}
                      x2={sx(p2.x)}
                      y2={sy(p2.y)}
                      stroke={stroke}
                      strokeWidth="2"
                      opacity="0.85"
                    />
                  );
                })}

                {hullPath && (
                  <path d={hullPath} fill="#4a8f7a" fillOpacity="0.23" stroke="#77c0aa" strokeWidth="2" />
                )}

                {objectiveLine && (
                  <line
                    x1={sx(objectiveLine[0].x)}
                    y1={sy(objectiveLine[0].y)}
                    x2={sx(objectiveLine[1].x)}
                    y2={sy(objectiveLine[1].y)}
                    stroke="#f0bf6b"
                    strokeWidth="2"
                    strokeDasharray="9 7"
                    opacity="0.95"
                  />
                )}

                {result.projectedPoints.map((p, idx) => (
                  <g key={`point-${idx}`}>
                    <circle cx={sx(p.x)} cy={sy(p.y)} r="4.2" fill="#9fd0ff" />
                    <text x={sx(p.x) + 8} y={sy(p.y) - 8} fill="#7fa7c9" fontSize="10" fontFamily="IBM Plex Mono">
                      ({formatNum(p.x)}, {formatNum(p.y)})
                    </text>
                  </g>
                ))}

                {optimal2D && (
                  <g>
                    <circle cx={sx(optimal2D.x)} cy={sy(optimal2D.y)} r="7" fill="#f58f8f" />
                    <circle cx={sx(optimal2D.x)} cy={sy(optimal2D.y)} r="13" fill="none" stroke="#f58f8f" opacity="0.55" />
                    <text
                      x={sx(optimal2D.x) + 10}
                      y={sy(optimal2D.y) + 18}
                      fill="#f6b2b2"
                      fontSize="11"
                      fontFamily="IBM Plex Mono"
                    >
                      ponto ideal (proj.)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.06em]">
              <div className="border border-[#22372f] bg-[#101814] text-[#82b59c] px-3 py-2">Regiao viavel (proj.)</div>
              <div className="border border-[#2a2a2a] bg-[#121212] text-[#89a7d8] px-3 py-2">Pontos candidatos</div>
              <div className="border border-[#472d2d] bg-[#1b1313] text-[#d9a0a0] px-3 py-2">Ponto otimo</div>
            </div>

            {result.optimal && (
              <div className="mt-5 pt-5 border-t border-[#1a1a1a] text-[13px] text-[#888] leading-[1.75]">
                <div className="mb-2 text-[#9f9f9f]">Vetor da solucao:</div>
                <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#b5b5b5] break-all">
                  [{result.optimal.map((v) => formatNum(v)).join(", ")}]
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
