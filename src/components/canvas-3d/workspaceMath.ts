import { type Canvas3DMode, type SelectedObjectState } from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function matrixNumber(value: number, digits = 3) {
  if (!Number.isFinite(value)) return "0";
  const normalized = Math.abs(value) < 1e-6 ? 0 : value;
  const rounded = Number(normalized.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function matrixToLatex(rows: string[][]) {
  return `\\begin{bmatrix}${rows.map((row) => row.join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

export function getMatrixTitle(mode: Canvas3DMode) {
  if (mode === "translate") return "Matriz de Translação";
  if (mode === "rotate") return "Matriz de Rotação";
  if (mode === "skew") return "Matriz de Skew";
  return "Matriz de Escala";
}

export function buildTransformMatrixLatex(mode: Canvas3DMode, selected: SelectedObjectState | null) {
  const tx = selected?.position.x ?? 0;
  const ty = selected?.position.y ?? 0;
  const tz = selected?.position.z ?? 0;

  const sx = selected?.scale.x ?? 1;
  const sy = selected?.scale.y ?? 1;
  const sz = selected?.scale.z ?? 1;

  const rx = ((selected?.rotation.x ?? 0) * Math.PI) / 180;
  const ry = ((selected?.rotation.y ?? 0) * Math.PI) / 180;
  const rz = ((selected?.rotation.z ?? 0) * Math.PI) / 180;

  const sinX = Math.sin(rx);
  const cosX = Math.cos(rx);
  const sinY = Math.sin(ry);
  const cosY = Math.cos(ry);
  const sinZ = Math.sin(rz);
  const cosZ = Math.cos(rz);

  const r11 = cosZ * cosY;
  const r12 = cosZ * sinY * sinX - sinZ * cosX;
  const r13 = cosZ * sinY * cosX + sinZ * sinX;
  const r21 = sinZ * cosY;
  const r22 = sinZ * sinY * sinX + cosZ * cosX;
  const r23 = sinZ * sinY * cosX - cosZ * sinX;
  const r31 = -sinY;
  const r32 = cosY * sinX;
  const r33 = cosY * cosX;

  const kxy = selected?.skew.xy ?? 0;
  const kxz = selected?.skew.xz ?? 0;
  const kyx = selected?.skew.yx ?? 0;
  const kyz = selected?.skew.yz ?? 0;
  const kzx = selected?.skew.zx ?? 0;
  const kzy = selected?.skew.zy ?? 0;

  if (mode === "translate") {
    return matrixToLatex([
      ["1", "0", "0", matrixNumber(tx)],
      ["0", "1", "0", matrixNumber(ty)],
      ["0", "0", "1", matrixNumber(tz)],
      ["0", "0", "0", "1"],
    ]);
  }

  if (mode === "rotate") {
    return matrixToLatex([
      [matrixNumber(r11), matrixNumber(r12), matrixNumber(r13), "0"],
      [matrixNumber(r21), matrixNumber(r22), matrixNumber(r23), "0"],
      [matrixNumber(r31), matrixNumber(r32), matrixNumber(r33), "0"],
      ["0", "0", "0", "1"],
    ]);
  }

  if (mode === "skew") {
    return matrixToLatex([
      ["1", matrixNumber(kxy), matrixNumber(kxz), "0"],
      [matrixNumber(kyx), "1", matrixNumber(kyz), "0"],
      [matrixNumber(kzx), matrixNumber(kzy), "1", "0"],
      ["0", "0", "0", "1"],
    ]);
  }

  return matrixToLatex([
    [matrixNumber(sx), "0", "0", "0"],
    ["0", matrixNumber(sy), "0", "0"],
    ["0", "0", matrixNumber(sz), "0"],
    ["0", "0", "0", "1"],
  ]);
}
