"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import "mafs/core.css";
import LinearProgrammingChart from "@/components/otimizacao-linear/LinearProgrammingChart";
import LinearProgrammingControls from "@/components/otimizacao-linear/LinearProgrammingControls";
import type {
  Constraint,
  ObjectiveMode,
  SolverResult,
  Vec2,
} from "@/components/otimizacao-linear/types";

const EPS = 1e-7;
const CHART_HEIGHT = 820;
const MAX_VARIABLES = 8;

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
  `}</style>
);

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
          <LinearProgrammingControls
            mode={mode}
            onModeChange={setMode}
            variableCount={variableCount}
            canDecreaseVariables={canDecreaseVariables}
            canIncreaseVariables={canIncreaseVariables}
            onVariableCountChange={setVariableCountSafe}
            normalizedObjective={normalizedObjective}
            onObjectiveCoeffChange={updateObjectiveAt}
            normalizedConstraints={normalizedConstraints}
            onConstraintCoeffChange={updateConstraintCoeff}
            onConstraintChange={updateConstraint}
            onAddConstraint={addConstraint}
            onRemoveConstraint={removeConstraint}
            result={result}
            formatNum={formatNum}
          />

          <LinearProgrammingChart
            chartHeight={CHART_HEIGHT}
            bounds={bounds}
            constraintSegments={constraintSegments}
            hullPoints={hullPoints}
            objectiveSegment={objectiveSegment}
            projectedPoints={result.projectedPoints}
            optimal2D={optimal2D}
            optimalRingRadius={optimalRingRadius}
            optimalVector={result.optimal}
            formatNum={formatNum}
          />
        </div>
      </main>
    </div>
  );
}
