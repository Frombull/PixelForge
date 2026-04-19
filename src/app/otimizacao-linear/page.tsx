"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Circle, Coordinates, Line, Mafs, Point, Polygon, Text } from "mafs";
import "mafs/core.css";

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
const CHART_HEIGHT = 520;
const MAX_VARIABLES = 8;
type Vec2 = [number, number];

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

export default function OtimizacaoLinearPage() {
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

  const hullPoints = useMemo<Vec2[]>(
    () => convexHull2D(result.projectedPoints).map((p) => [p.x, p.y]),
    [result.projectedPoints],
  );

  const optimal2D = result.optimal
    ? {
        x: result.optimal[0] ?? 0,
        y: result.optimal[1] ?? 0,
      }
    : null;

  const objectiveSegment = useMemo<[Vec2, Vec2] | null>(() => {
    if (!optimal2D || result.optimalValue == null) return null;
    const c1 = normalizedObjective[0] ?? 0;
    const c2 = normalizedObjective[1] ?? 0;

    if (Math.abs(c1) < EPS && Math.abs(c2) < EPS) return null;

    if (Math.abs(c2) > EPS) {
      const y1 = (result.optimalValue - c1 * bounds.minX) / c2;
      const y2 = (result.optimalValue - c1 * bounds.maxX) / c2;
      return [
        [bounds.minX, y1],
        [bounds.maxX, y2],
      ];
    }

    if (Math.abs(c1) > EPS) {
      const x = result.optimalValue / c1;
      return [
        [x, bounds.minY],
        [x, bounds.maxY],
      ];
    }

    return null;
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, normalizedObjective, optimal2D, result.optimalValue]);

  const constraintSegments = useMemo(
    () =>
      normalizedConstraints
        .map((c, idx) => {
          const a1 = c.coeffs[0] ?? 0;
          const a2 = c.coeffs[1] ?? 0;

          if (Math.abs(a2) > EPS) {
            const p1: Vec2 = [bounds.minX, (c.rhs - a1 * bounds.minX) / a2];
            const p2: Vec2 = [bounds.maxX, (c.rhs - a1 * bounds.maxX) / a2];
            return { id: c.id, idx, p1, p2 };
          }

          if (Math.abs(a1) > EPS) {
            const x = c.rhs / a1;
            const p1: Vec2 = [x, bounds.minY];
            const p2: Vec2 = [x, bounds.maxY];
            return { id: c.id, idx, p1, p2 };
          }

          return null;
        })
        .filter((v): v is { id: number; idx: number; p1: Vec2; p2: Vec2 } => v != null),
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, normalizedConstraints],
  );

  const optimalRingRadius = useMemo(() => {
    const spanX = bounds.maxX - bounds.minX;
    const spanY = bounds.maxY - bounds.minY;
    return Math.max(0.28, Math.max(spanX, spanY) * 0.025);
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY]);

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
            Otimização - Otimização Linear
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
          <div>n variáveis - método por vértices</div>
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

              <div
                className="relative z-10 w-full"
                role="img"
                aria-label="Gráfico da otimização linear interativo"
              >
                <Mafs
                  height={CHART_HEIGHT}
                  pan
                  zoom={{ min: 0.45, max: 7 }}
                  preserveAspectRatio="contain"
                  viewBox={{
                    x: [bounds.minX, bounds.maxX],
                    y: [bounds.minY, bounds.maxY],
                    padding: 0.6,
                  }}
                >
                  <Coordinates.Cartesian
                    xAxis={{ axis: true, lines: 5 }}
                    yAxis={{ axis: true, lines: 5 }}
                    subdivisions={2}
                  />

                  {constraintSegments.map((segment) => {
                    const palette = ["#8fbf8f", "#89a7d8", "#d8a889", "#b68fd2", "#c6cc85", "#8ebfc3"];
                    const stroke = palette[segment.idx % palette.length];

                    return (
                      <Line.Segment
                        key={`constraint-${segment.id}`}
                        point1={segment.p1}
                        point2={segment.p2}
                        color={stroke}
                        weight={2}
                        opacity={0.88}
                      />
                    );
                  })}

                  {hullPoints.length >= 3 && (
                    <Polygon
                      points={hullPoints}
                      color="#77c0aa"
                      weight={2}
                      fillOpacity={0.22}
                      strokeOpacity={0.95}
                    />
                  )}

                  {objectiveSegment && (
                    <Line.Segment
                      point1={objectiveSegment[0]}
                      point2={objectiveSegment[1]}
                      color="#f0bf6b"
                      weight={2.2}
                      style="dashed"
                      opacity={0.95}
                    />
                  )}

                  {result.projectedPoints.map((p, idx) => (
                    <Point
                      key={`point-${idx}`}
                      x={p.x}
                      y={p.y}
                      color="#9fd0ff"
                      svgCircleProps={{ r: 4.2 }}
                    />
                  ))}

                  {optimal2D && (
                    <>
                      <Point x={optimal2D.x} y={optimal2D.y} color="#f58f8f" svgCircleProps={{ r: 7 }} />
                      <Circle
                        center={[optimal2D.x, optimal2D.y]}
                        radius={optimalRingRadius}
                        color="#f58f8f"
                        fillOpacity={0}
                        strokeOpacity={0.55}
                        weight={2}
                      />
                      <Text
                        x={optimal2D.x}
                        y={optimal2D.y}
                        color="#f6b2b2"
                        attach="ne"
                        attachDistance={16}
                        size={11}
                      >
                        ponto ideal (proj.)
                      </Text>
                    </>
                  )}
                </Mafs>
              </div>

              <div className="pointer-events-none absolute bottom-2 right-3 z-20 font-['IBM_Plex_Mono',monospace] text-[10px] tracking-[0.08em] uppercase text-[#7a7a7a]">
                Arraste para pan · scroll para zoom
              </div>
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
