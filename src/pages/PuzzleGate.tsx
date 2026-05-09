import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PUZZLE_PATH_D, PUZZLE_VIEWBOX, isInsidePuzzleLocal } from "../components/puzzleShape";
import "../styles/puzzle.css";

/**
 * Puzzle gate.
 *
 *  - Page is pure black.
 *  - A WHITE cutout shaped like a puzzle piece sits at the screen center.
 *  - A BLACK puzzle piece (same shape) is placed in the bottom-right corner.
 *    It is invisible against the black background by design — the only signal
 *    is the cursor changing to a pointer when hovering it.
 *  - User drags the piece. While being dragged, the piece passes over the
 *    white cutout, where it becomes visible (black on white).
 *  - When dropped within tolerance of the cutout's center, navigate to the
 *    main page.
 */

const PIECE_SIZE_PX = 160;            // rendered size of the puzzle piece
const CUTOUT_SIZE_PX = 200;           // rendered size of the white cutout
const DROP_TOLERANCE_PX = 35;         // distance from cutout center that counts as a fit

export function PuzzleGate() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const cutoutRef = useRef<HTMLDivElement | null>(null);
  const pieceRef = useRef<HTMLDivElement | null>(null);

  // Piece position is the TOP-LEFT corner in viewport pixels.
  const [piecePos, setPiecePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveringPiece, setHoveringPiece] = useState(false);
  const [solved, setSolved] = useState(false);

  // Offset from the piece's top-left to the cursor at drag start, so the
  // piece doesn't snap its corner to the cursor on grab.
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Place the piece in the bottom-right on first mount + on resize.
  useEffect(() => {
    const place = () => {
      const margin = 24;
      setPiecePos({
        x: window.innerWidth - PIECE_SIZE_PX - margin,
        y: window.innerHeight - PIECE_SIZE_PX - margin,
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // Helper: is a viewport point inside the piece's hit region?
  const pointHitsPiece = useCallback(
    (clientX: number, clientY: number): boolean => {
      const localX = ((clientX - piecePos.x) / PIECE_SIZE_PX) * PUZZLE_VIEWBOX;
      const localY = ((clientY - piecePos.y) / PIECE_SIZE_PX) * PUZZLE_VIEWBOX;
      return isInsidePuzzleLocal(localX, localY);
    },
    [piecePos.x, piecePos.y]
  );

  // Track pointer over the piece for the cursor-change affordance. Only
  // applies to mouse pointers — touch has no hover state, and we don't want
  // tap-to-grab to be revealed by a stray hover indicator.
  useEffect(() => {
    if (solved) {
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (isDragging || e.pointerType !== "mouse") {
        return;
      }
      setHoveringPiece(pointHitsPiece(e.clientX, e.clientY));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [isDragging, pointHitsPiece, solved]);

  // Drag handlers. Pointer events unify mouse + touch + pen, so the same
  // logic works on both desktop and mobile. On touch the user "discovers"
  // the piece by tapping around — if a tap lands inside the piece's hit
  // region, the drag starts immediately and follows the finger.
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMove = (e: PointerEvent) => {
      setPiecePos({
        x: e.clientX - dragOffsetRef.current.dx,
        y: e.clientY - dragOffsetRef.current.dy,
      });
    };

    const onUp = () => {
      setIsDragging(false);
      // Check fit: distance between piece center and cutout center.
      const cutoutEl = cutoutRef.current;
      if (!cutoutEl) {
        return;
      }
      const cutoutRect = cutoutEl.getBoundingClientRect();
      const cutoutCx = cutoutRect.left + cutoutRect.width / 2;
      const cutoutCy = cutoutRect.top + cutoutRect.height / 2;

      // Use the LATEST piece position via state update closure-safe read.
      setPiecePos((current) => {
        const pieceCx = current.x + PIECE_SIZE_PX / 2;
        const pieceCy = current.y + PIECE_SIZE_PX / 2;
        const dx = pieceCx - cutoutCx;
        const dy = pieceCy - cutoutCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= DROP_TOLERANCE_PX) {
          // Snap exactly into place (cutout is larger than piece, so center it).
          const snappedX = cutoutCx - PIECE_SIZE_PX / 2;
          const snappedY = cutoutCy - PIECE_SIZE_PX / 2;
          setSolved(true);
          // Brief delay so the user sees the snap before navigating.
          window.setTimeout(() => navigate("/whatisthetime"), 650);
          return { x: snappedX, y: snappedY };
        }
        return current;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging, navigate]);

  // Tap/click anywhere on the page: if it's inside the piece's hit region,
  // begin a drag. This is what enables the touch "tap-around to find" UX.
  const onWrapperPointerDown = (e: React.PointerEvent) => {
    if (solved) {
      return;
    }
    if (!pointHitsPiece(e.clientX, e.clientY)) {
      return;
    }
    dragOffsetRef.current = {
      dx: e.clientX - piecePos.x,
      dy: e.clientY - piecePos.y,
    };
    setIsDragging(true);
    e.preventDefault();
  };

  return (
    <div
      ref={wrapperRef}
      className={`puzzle-gate ${hoveringPiece || isDragging ? "puzzle-gate--hover-piece" : ""}`}
      onPointerDown={onWrapperPointerDown}
    >
      {/* The WHITE cutout in the middle — visually a white puzzle silhouette on black. */}
      <div ref={cutoutRef} className="puzzle-cutout" style={{ width: CUTOUT_SIZE_PX, height: CUTOUT_SIZE_PX }}>
        <svg viewBox={`0 0 ${PUZZLE_VIEWBOX} ${PUZZLE_VIEWBOX}`} width="100%" height="100%" aria-hidden="true">
          <path d={PUZZLE_PATH_D} fill="#ffffff" />
        </svg>
      </div>

      {/* The BLACK draggable piece. Invisible against black; visible over white.
          Pointer events on the wrapper handle hit-testing and drag start so
          the same logic works for both mouse clicks and touch taps. */}
      <div
        ref={pieceRef}
        className="puzzle-piece"
        style={{
          width: PIECE_SIZE_PX,
          height: PIECE_SIZE_PX,
          transform: `translate(${piecePos.x}px, ${piecePos.y}px)`,
        }}
        aria-hidden="true"
      >
        <svg viewBox={`0 0 ${PUZZLE_VIEWBOX} ${PUZZLE_VIEWBOX}`} width="100%" height="100%">
          <path d={PUZZLE_PATH_D} fill="#000000" />
        </svg>
      </div>

      {solved && <div className="puzzle-flash" />}
    </div>
  );
}
