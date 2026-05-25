"use client";

import { createContext, useContext } from "react";
import type { CustomGateDef } from "./customGates";

const CustomGatesContext = createContext<CustomGateDef[]>([]);

export const CustomGatesProvider = CustomGatesContext.Provider;

export function useCustomGates(): CustomGateDef[] {
  return useContext(CustomGatesContext);
}
