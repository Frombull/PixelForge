export type ObjectiveMode = "max" | "min";
export type ConstraintRelation = "<=" | ">=" | "=";

export type Constraint = {
  id: number;
  coeffs: number[];
  relation: ConstraintRelation;
  rhs: number;
};

export type SolverResult = {
  feasibleVertices: number[][];
  projectedPoints: { x: number; y: number }[];
  optimal: number[] | null;
  optimalValue: number | null;
  feasible: boolean;
  statusText: string;
};

export type Vec2 = [number, number];

export type ChartBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type ConstraintSegment = {
  id: number;
  idx: number;
  p1: Vec2;
  p2: Vec2;
};
