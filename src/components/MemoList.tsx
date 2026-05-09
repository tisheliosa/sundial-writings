import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Memo } from "../types";
import "../styles/memoList.css";

interface MemoListProps {
  memos: Memo[];
  /** Floating-point scroll position in "notches". 1.0 == one full notch advanced. */
  position: number;
}

const VISIBLE_COUNT = 6;
const ROW_HEIGHT_PX = 50;

/**
 * Combination-lock style infinite vertical list.
 *
 * Renders VISIBLE_COUNT rows (plus a couple of buffer rows above and below
 * to cover the in/out animation). Each row's content is computed from a
 * modular index based on `position`, so the list wraps around forever.
 */
export function MemoList({ memos, position }: MemoListProps) {
  const navigate = useNavigate();
  const n = memos.length;

  // We render rows at slot indices [-1, 0, 1, ..., VISIBLE_COUNT]. Each slot
  // displays the memo at index (floor(position) + slot) mod n, and the whole
  // strip is translated by -(position - floor(position)) * ROW_HEIGHT_PX so
  // the partial-notch motion is visible.
  const baseIndex = Math.floor(position);
  const fractional = position - baseIndex;

  const slots: number[] = [];
  for (let i = -1; i <= VISIBLE_COUNT; i++) {
    slots.push(i);
  }

  return (
    <div className="memo-list" style={{ height: VISIBLE_COUNT * ROW_HEIGHT_PX }}>
      <div
        className="memo-list__strip"
        style={{ transform: `translateY(${-fractional * ROW_HEIGHT_PX}px)` }}
      >
        {slots.map((slot) => {
          const idx = ((baseIndex + slot) % n + n) % n;
          const memo = memos[idx];
          return (
            <MemoRow
              key={`${slot}-${memo.id}`}
              memo={memo}
              onClick={() => navigate(`/memos/${memo.id}`)}
              isCenter={slot === Math.floor(VISIBLE_COUNT / 2)}
            />
          );
        })}
      </div>
      {/* Top and bottom fade masks for the "lock window" feel. */}
      <div className="memo-list__fade memo-list__fade--top" />
      <div className="memo-list__fade memo-list__fade--bottom" />
    </div>
  );
}

interface MemoRowProps {
  memo: Memo;
  onClick: () => void;
  isCenter: boolean;
}

function MemoRow({ memo, onClick, isCenter }: MemoRowProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  // Trigger entrance animation by toggling a class once mounted.
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.classList.add("memo-row--mounted");
  }, []);

  return (
    <button
      ref={ref}
      className={`memo-row ${isCenter ? "memo-row--center" : ""}`}
      style={{ height: ROW_HEIGHT_PX }}
      onClick={onClick}
    >
      <span className="memo-row__title">{memo.title}</span>
    </button>
  );
}
