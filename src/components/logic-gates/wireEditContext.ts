import { createContext } from "react";

// Callback que o WireEdge dispara quando termina de arrastar o segmento do meio.
// O editor injeta um commit que empurra o snapshot atual pro histórico (undo/redo).
export type WireCommit = (label?: string) => void;

export const WireCommitContext = createContext<WireCommit | null>(null);
