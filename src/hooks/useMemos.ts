import { useMemo } from "react";
import { seedMemos } from "../data/memos";
import type { Memo } from "../types";

/**
 * Single source of truth for memo reads. Today this returns the seed array,
 * but the UI only depends on this hook's shape — swap in a fetch / file load
 * / GitHub Issues client later without touching the components.
 */
export function useMemos(): Memo[] {
  return useMemo(() => seedMemos.slice().sort((a, b) => a.id - b.id), []);
}

export function useMemo_byId(id: number): Memo | undefined {
  const all = useMemos();
  return useMemo(() => all.find((m) => m.id === id), [all, id]);
}
