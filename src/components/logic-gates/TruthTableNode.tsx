"use client";

import { type NodeProps } from "@xyflow/react";
import { TRUTH_TABLE_MAX_INPUTS, type TruthTableData } from "./truthTable";
import { useTruthTable } from "./truthTableContext";

const COL = {
  accent: "#a78bfa",
  border: "#3a3a3a",
  bg: "#1e1e1e",
  bgAlt: "#252525",
  rowHi: "rgba(167, 139, 250, 0.18)",
  textDim: "#6a6a6a",
  textMid: "#8a8a8a",
  text: "#b0b0b0",
  on: "#4ade80",
  off: "#555",
  sep: "#3a3a3a",
};

const cellStyle: React.CSSProperties = {
  padding: "1px 8px",
  textAlign: "center",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.5,
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: COL.textMid,
  fontWeight: 600,
  padding: "5px 8px",
  borderBottom: `1px solid ${COL.sep}`,
};

const separatorCellStyle: React.CSSProperties = {
  ...cellStyle,
  color: COL.textDim,
  padding: "1px 4px",
};

const separatorHeaderStyle: React.CSSProperties = {
  ...headerCellStyle,
  padding: "5px 4px",
  color: COL.textDim,
};

function Message({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "18px 16px",
        color: COL.textDim,
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.08em",
        textTransform: "lowercase",
        textAlign: "center",
        minWidth: 140,
      }}
    >
      {text}
    </div>
  );
}

function Body({
  data,
  currentRow,
}: {
  data: TruthTableData;
  currentRow: number | null;
}) {
  if (data.status === "empty") {
    return <Message text="adicione input / output" />;
  }
  if (data.status === "no-outputs") {
    return <Message text="nenhum OUTPUT" />;
  }
  if (data.status === "overflow") {
    return (
      <Message
        text={`${data.inputCount} inputs — máx ${TRUTH_TABLE_MAX_INPUTS}`}
      />
    );
  }

  const inputCount = data.inputs.length;
  const rows = data.rows ?? [];
  const noInputs = data.status === "no-inputs";

  return (
    <table
      style={{
        borderCollapse: "collapse",
        userSelect: "none",
      }}
    >
      <thead>
        <tr style={{ background: COL.bgAlt }}>
          {data.inputs.map((p) => (
            <th key={`ih-${p.id}`} style={headerCellStyle}>
              {p.label}
            </th>
          ))}
          {inputCount > 0 && data.outputs.length > 0 && (
            <th style={separatorHeaderStyle} aria-hidden>
              │
            </th>
          )}
          {data.outputs.map((p) => (
            <th
              key={`oh-${p.id}`}
              style={{ ...headerCellStyle, color: COL.accent }}
            >
              {p.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((outBits, r) => {
          const highlight = !noInputs && r === currentRow;
          const rowStyle: React.CSSProperties = {
            background: highlight
              ? COL.rowHi
              : r % 2 === 0
              ? "transparent"
              : "rgba(255,255,255,0.015)",
          };
          const inputBits: number[] = [];
          for (let i = 0; i < inputCount; i++) {
            inputBits.push((r >> (inputCount - 1 - i)) & 1);
          }
          return (
            <tr key={r} style={rowStyle}>
              {inputBits.map((b, i) => (
                <td
                  key={`ic-${i}`}
                  style={{
                    ...cellStyle,
                    color: b ? COL.text : COL.textDim,
                  }}
                >
                  {b}
                </td>
              ))}
              {inputCount > 0 && data.outputs.length > 0 && (
                <td style={separatorCellStyle} aria-hidden>
                  │
                </td>
              )}
              {outBits.map((b, i) => (
                <td
                  key={`oc-${i}`}
                  style={{
                    ...cellStyle,
                    color: b ? COL.on : COL.off,
                    fontWeight: b ? 600 : 400,
                  }}
                >
                  {b ? 1 : 0}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function TruthTableNode({ selected }: NodeProps) {
  const { data, currentRow } = useTruthTable();
  const borderColor = selected ? "#888" : COL.accent;

  return (
    <div
      style={{
        background: COL.bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        color: COL.text,
        overflow: "hidden",
        boxShadow: selected
          ? "0 0 0 1px rgba(136,136,136,0.4)"
          : "0 0 14px rgba(167,139,250,0.08)",
        transition: "border-color 0.12s, box-shadow 0.12s",
      }}
    >
      <div
        style={{
          padding: "5px 10px",
          borderBottom: `1px solid ${COL.sep}`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: COL.accent,
          textTransform: "uppercase",
          background: COL.bgAlt,
        }}
      >
        Truth Table
      </div>
      <Body data={data} currentRow={currentRow} />
    </div>
  );
}
