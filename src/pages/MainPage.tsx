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
  // True while the user is actively dragging or while momentum is running.
  // We pass it down so MemoList can disable its CSS transition during these
  // continuous interactions — otherwise the 220ms transition restarts every
  // frame and the text looks shimmery / blurred.
  const [isAnimating, setIsAnimating] = useState(false);
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
    // We allow drags to start anywhere on the page — including on memo-row
    // buttons — and only commit to "this is a drag, not a tap" once the
    // pointer has moved more than DRAG_THRESHOLD_PX vertically. Below the
    // threshold the touch is treated as a tap and the button's click fires
    // normally; above it, we capture the pointer, apply the motion, and
    // swallow the upcoming click so a flick doesn't accidentally open a memo.
    let activePointerId: number | null = null;
    let dragStarted = false;     // crossed the threshold and is now a drag
    let startY = 0;              // y at pointerdown
    let lastY = 0;               // y at the previous applied move
    type Sample = { t: number; y: number };
    const samples: Sample[] = [];
    const DRAG_THRESHOLD_PX = 6;          // movement before we commit to "this is a drag"
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
        // Momentum just stopped; re-enable the smoothing transition.
        setIsAnimating(false);
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
        // No real flick velocity: drag ended with no momentum, re-enable the
        // CSS transition so any subsequent wheel ticks animate smoothly.
        setIsAnimating(false);
        return;
      }
      // Keep CSS transitions off while momentum applies per-frame updates.
      setIsAnimating(true);
      momentumLastTime = performance.now();
      momentumRafId = requestAnimationFrame(tickMomentum);
    };

    const onPointerDown = (e: PointerEvent) => {
      // A new touch immediately stops any momentum from the previous flick.
      // Even if the user is just tapping a row, killing momentum mid-flight
      // is the right call — they wanted to interrupt the motion.
      cancelMomentum();
      activePointerId = e.pointerId;
      dragStarted = false;
      startY = e.clientY;
      lastY = e.clientY;
      samples.length = 0;
      samples.push({ t: performance.now(), y: e.clientY });
      // Note: we deliberately do NOT call setPointerCapture here. Capturing
      // would steal the eventual `click` from any button under the pointer,
      // breaking taps. We capture lazily once the move threshold is crossed.
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointerId) {
        return;
      }

      // Until we cross the drag threshold, leave taps alone.
      if (!dragStarted) {
        if (Math.abs(e.clientY - startY) < DRAG_THRESHOLD_PX) {
          return;
        }
        // Cross the threshold: commit to drag mode.
        dragStarted = true;
        // Disable CSS transitions on the strip so per-frame transform
        // updates apply directly during the drag. Re-enabled when drag
        // ends and any momentum settles.
        setIsAnimating(true);
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // setPointerCapture can throw if the pointer is no longer active.
        }
        // Reset lastY to the threshold-cross point so the first applied
        // delta isn't a sudden jump.
        lastY = e.clientY;
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

      if (!dragStarted) {
        // Never crossed the threshold — let the natural click flow through
        // so memo-row buttons still work.
        samples.length = 0;
        return;
      }

      // It was a real drag/flick. Suppress the upcoming click so a flick on
      // top of a memo row doesn't accidentally navigate. Only the first
      // click after this drag is suppressed (the listener removes itself).
      const swallow = (clickEvent: Event) => {
        clickEvent.stopPropagation();
        clickEvent.preventDefault();
        window.removeEventListener("click", swallow, true);
      };
      window.addEventListener("click", swallow, true);
      // Belt-and-braces: if no click ever fires (e.g., release outside a
      // button), remove the listener after a short window.
      window.setTimeout(() => window.removeEventListener("click", swallow, true), 350);

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
      dragStarted = false;
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
        <MemoList memos={memos} position={scrollPosition} isAnimating={isAnimating} />
      </div>
    </div>
  );
}
