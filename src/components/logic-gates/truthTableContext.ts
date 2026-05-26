"use client";

import { createContext, useContext } from "react";
import type { TruthTableData } from "./truthTable";

export interface TruthTableContextValue {
  data: TruthTableData;
  currentRow: number | null;
}

const EMPTY: TruthTableContextValue = {
  data: {
    inputs: [],
    outputs: [],
    rows: null,
    status: "empty",
    inputCount: 0,
  },
  currentRow: null,
};

const TruthTableContext = createContext<TruthTableContextValue>(EMPTY);

export const TruthTableProvider = TruthTableContext.Provider;

export function useTruthTable(): TruthTableContextValue {
  return useContext(TruthTableContext);
}
