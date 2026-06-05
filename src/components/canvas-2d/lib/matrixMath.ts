import type { Tool, Shape } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return "0";
  const v = Math.abs(value) < 1e-9 ? 0 : value;
  const rounded = Number(v.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function matrix(rows: string[][]): string {
  return `\\begin{bmatrix}${rows.map((r) => r.join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

// ─── Title ────────────────────────────────────────────────────────────────────

export function getMatrixTitle(tool: Tool): string {
  if (tool === "TRANSLATE") return "Matriz de Translação";
  if (tool === "ROTATE")    return "Matriz de Rotação";
  if (tool === "SCALE")     return "Matriz de Escala";
  if (tool === "SHEAR")     return "Matriz de Cisalhamento";
  return "";
}

// ─── Build LaTeX ──────────────────────────────────────────────────────────────

/**
 * Builds the LaTeX string for the 3×3 homogeneous 2D transformation matrix
 * corresponding to the active tool.
 *
 * The full combined transform applied per vertex is:
 *   T · R · M   where M = | scaleX  shearX |
 *                          | shearY  scaleY |
 *
 * Each tool shows only its own slice of that combined matrix.
 */
export function buildTransformMatrixLatex(tool: Tool, shape: Shape | null): string {
  const tx  = shape ? shape.x         : 0;
  const ty  = shape ? shape.y         : 0;
  const sx  = shape ? shape.scaleX    : 1;
  const sy  = shape ? shape.scaleY    : 1;
  const shx = shape ? (shape.shearX ?? 0) : 0;
  const shy = shape ? (shape.shearY ?? 0) : 0;
  const rot = shape ? shape.rotation  : 0;

  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  switch (tool) {
    case "TRANSLATE":
      return matrix([
        ["1", "0", n(tx)],
        ["0", "1", n(ty)],
        ["0", "0", "1"],
      ]);

    case "ROTATE":
      return matrix([
        [n(cos), n(-sin), "0"],
        [n(sin), n(cos),  "0"],
        ["0",    "0",     "1"],
      ]);

    case "SCALE":
      // Linear transform part (scale + shear) — before rotation
      return matrix([
        [n(sx),  n(shx), "0"],
        [n(shy), n(sy),  "0"],
        ["0",    "0",    "1"],
      ]);

    case "SHEAR":
      return matrix([
        ["1",    n(shx), "0"],
        [n(shy), "1",    "0"],
        ["0",    "0",    "1"],
      ]);

    default:
      return "";
  }
}
