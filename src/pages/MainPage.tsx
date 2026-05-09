import { useEffect, useRef, useState } from "react";
import { Sundial } from "../components/Sundial";
import { MemoList } from "../components/MemoList";
import { useMemos } from "../hooks/useMemos";
import "../styles/main.css";

const SCROLL_SENSITIVITY = 1 / 120;     // 1 wheel "click" (~120 deltaY) = 1 notch
// Touch/pointer drag sensitivity: this many pixels of vertical movement = 1 notch.
// Roughly the height of one memo row so dragging by a row advances by a row.
const TOUCH_PIXELS_PER_NOTCH = 64;
// Negative so the sun orbits the OPPOSITE direction as the user scrolls down.
const SUN_RADIANS_PER_NOTCH = Math.PI / 14;

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

  // Wheel handler (desktop) attached at the page level so scrolling anywhere
  // works. Pointer-drag handler (touch + mouse-drag) is added alongside so
  // mobile devices, which don't fire wheel events, can still advance the
  // carousel by dragging vertically. After a flick, momentum carries the
  // carousel forward with exponentially decaying velocity.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // A new wheel input cancels any active momentum so the user feels in
      // control immediately.
      cancelMomentum();
      setScrollPosition((p) => p + e.deltaY * SCROLL_SENSITIVITY);
    };

    // --- Pointer drag with momentum ---
    // While dragging, we sample the pointer's Y and time at each move event
    // and keep the most recent samples in a small ring. On release, we
    // estimate velocity (notches per second) from the samples spanning the
    // last ~80 ms and start a momentum animation that decays exponentially.
    let activePointerId: number | null = null;
    let lastY = 0;
    type Sample = { t: number; y: number };
    const samples: Sample[] = [];
    const SAMPLE_WINDOW_MS = 80;          // velocity is averaged over the last N ms of movement
    const MOMENTUM_DECAY_PER_SEC = 4.5;    // higher = momentum dies off faster
    const MOMENTUM_MIN_VELOCITY = 0.01;    // notches/sec — stop animating below this
    const MOMENTUM_MAX_VELOCITY = 30;      // notches/sec cap so a fast flick doesn't spin forever

    let momentumRafId: number | null = null;
    let momentumLastTime = 0;
    let momentumVelocity = 0; // notches per second; sign matches scroll-position delta direction

    const cancelMomentum = () => {
      if (momentumRafId !== null) {
        cancelAnimationFrame(momentumRafId);
        momentumRafId = null;
      }
      momentumVelocity = 0;
    };

    const tickMomentum = (now: number) => {
      const dt = (now - momentumLastTime) / 1000; // seconds
      momentumLastTime = now;
      // Exponential decay: v(t) = v0 * exp(-k * t).
      momentumVelocity *= Math.exp(-MOMENTUM_DECAY_PER_SEC * dt);
      // Apply velocity to scroll position.
      setScrollPosition((p) => p + momentumVelocity * dt);
      if (Math.abs(momentumVelocity) < MOMENTUM_MIN_VELOCITY) {
        momentumRafId = null;
        momentumVelocity = 0;
        return;
      }
      momentumRafId = requestAnimationFrame(tickMomentum);
    };

    const startMomentum = (initialVelocity: number) => {
      cancelMomentum();
      momentumVelocity = Math.max(
        -MOMENTUM_MAX_VELOCITY,
        Math.min(MOMENTUM_MAX_VELOCITY, initialVelocity),
      );
      if (Math.abs(momentumVelocity) < MOMENTUM_MIN_VELOCITY) {
        momentumVelocity = 0;
        return;
      }
      momentumLastTime = performance.now();
      momentumRafId = requestAnimationFrame(tickMomentum);
    };

    const onPointerDown = (e: PointerEvent) => {
      // Ignore drags starting on a button or link (e.g., memo row taps).
      const target = e.target as HTMLElement | null;
      if (target && target.closest("button, a")) {
        return;
      }
      // A new touch immediately stops any momentum from the previous flick.
      cancelMomentum();
      activePointerId = e.pointerId;
      lastY = e.clientY;
      samples.length = 0;
      samples.push({ t: performance.now(), y: e.clientY });
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) {
        return;
      }
      const deltaY = e.clientY - lastY;
      lastY = e.clientY;
      // Drag up (deltaY < 0) -> advance forward, so subtract.
      setScrollPosition((p) => p - deltaY / TOUCH_PIXELS_PER_NOTCH);

      // Record a sample, then drop any older than the velocity window so the
      // ring stays small and the velocity reflects only the recent flick.
      const now = performance.now();
      samples.push({ t: now, y: e.clientY });
      while (samples.length > 1 && now - samples[0].t > SAMPLE_WINDOW_MS) {
        samples.shift();
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) {
        return;
      }
      activePointerId = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // releasePointerCapture can throw if the capture was already lost.
      }

      // Estimate end-of-drag velocity from the samples in the recent window.
      // Velocity (px/sec) -> divide by TOUCH_PIXELS_PER_NOTCH to get notches/sec.
      // Sign is flipped to match the "drag up advances" mapping above.
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (dt > 0) {
          const pxPerSec = (last.y - first.y) / dt;
          const notchesPerSec = -pxPerSec / TOUCH_PIXELS_PER_NOTCH;
          startMomentum(notchesPerSec);
        }
      }
      samples.length = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      cancelMomentum();
    };
  }, []);

  // Sun starts at the east horizon (0 rad) and orbits as we scroll.
  const sunAngle = scrollPosition * SUN_RADIANS_PER_NOTCH;

  return (
    <div ref={wrapperRef} className="main-page">
      <div className="main-page__left">
        <Sundial sunAngle={sunAngle} />
      </div>
      <div className="main-page__right">
        <MemoList memos={memos} position={scrollPosition} />
      </div>
    </div>
  );
}
