import { useEffect, useRef, useState } from "react";
import { Sundial } from "../components/Sundial";
import { MemoList } from "../components/MemoList";
import { useMemos } from "../hooks/useMemos";
import "../styles/main.css";

const SCROLL_SENSITIVITY = 1 / 120;     // 1 wheel "click" (~120 deltaY) = 1 notch
const SUN_RADIANS_PER_NOTCH = Math.PI / 14; // each notch nudges the sun a bit

/**
 * Main page.
 *
 *  - Left half: 3D-tilted vector sundial. Sun orbits as the user scrolls.
 *  - Right half: combination-lock list of memo titles. 8 visible at a time.
 *
 * Both pieces share the same `scrollPosition` state (a float in "notches"),
 * so they animate in lockstep.
 */
export function MainPage() {
  const memos = useMemos();
  const [scrollPosition, setScrollPosition] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Wheel handler attached at the page level so scrolling anywhere works.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScrollPosition((p) => p + e.deltaY * SCROLL_SENSITIVITY);
    };
    const el = wrapperRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Sun starts at the east horizon (0 rad) and orbits as we scroll.
  const sunAngle = scrollPosition * SUN_RADIANS_PER_NOTCH;

  return (
    <div ref={wrapperRef} className="main-page">
      <div className="main-page__left">
        <Sundial sunAngle={sunAngle} />
      </div>
      <div className="main-page__right">
        <div className="main-page__hint">scroll</div>
        <MemoList memos={memos} position={scrollPosition} />
      </div>
    </div>
  );
}
