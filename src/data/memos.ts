import type { Memo } from "../types";

/**
 * Seed memos. To migrate to a real store later, replace this array with a
 * fetch from the chosen backend; the rest of the app reads memos through the
 * `useMemos()` hook so the UI does not need to change.
 */
export const seedMemos: Memo[] = [
  {
    id: 1,
    title: "first light",
    body: "the morning the kettle whistled before i woke up.",
    createdAt: "2026-01-04",
  },
  {
    id: 2,
    title: "subway notebook",
    body: "a stranger drew the same bird on three different pages.",
    createdAt: "2026-01-12",
  },
  {
    id: 3,
    title: "lemon rind",
    body: "the trick is the zest, not the juice.",
    createdAt: "2026-01-19",
  },
  {
    id: 4,
    title: "argyle socks",
    body: "wore them for a meeting nobody attended.",
    createdAt: "2026-02-02",
  },
  {
    id: 5,
    title: "rain on tin",
    body: "fell asleep counting the gaps between drops.",
    createdAt: "2026-02-14",
  },
  {
    id: 6,
    title: "bookstore on 9th",
    body: "the cat slept on the philosophy shelf again.",
    createdAt: "2026-02-22",
  },
  {
    id: 7,
    title: "ferry at dusk",
    body: "the skyline looked drawn in pencil from this angle.",
    createdAt: "2026-03-03",
  },
  {
    id: 8,
    title: "bicycle bell",
    body: "the kid rang it twice for every block.",
    createdAt: "2026-03-15",
  },
  {
    id: 9,
    title: "long hallway",
    body: "the carpet pattern looked like a rotated keyboard.",
    createdAt: "2026-03-28",
  },
  {
    id: 10,
    title: "thursday tea",
    body: "burnt the leaves and drank it anyway.",
    createdAt: "2026-04-04",
  },
];
