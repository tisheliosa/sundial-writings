/**
 * Shared puzzle-piece geometry. The cutout in the page and the draggable
 * piece both render this same path so a perfect overlap is geometrically
 * guaranteed.
 *
 * The path is drawn inside a 200x200 viewBox. The base square is from
 * (30,30) to (170,170). Two sides have OUTWARD tabs (knobs) and two sides
 * have INWARD blanks (sockets) — like a real jigsaw piece.
 *
 * Convention used here:
 *   - top edge:    OUTWARD tab (juts up)
 *   - right edge:  OUTWARD tab (juts right)
 *   - bottom edge: INWARD  blank (cuts up into the piece)
 *   - left edge:   INWARD  blank (cuts right into the piece)
 *
 * The tab/blank radius is intentionally large so the silhouette reads as a
 * jigsaw piece at any size.
 */
export const PUZZLE_VIEWBOX = 200;

const TAB_R = 28;             // radius of each tab/blank — bigger = more "jutted"
const SQ_MIN = 30;            // square min coord
const SQ_MAX = 170;           // square max coord
const MID = (SQ_MIN + SQ_MAX) / 2; // 100

// Helpers to make the path readable.
const m = MID;

// SVG arc command: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
// sweep-flag = 1 means clockwise in SVG's y-down coord system.
//
// For an OUTWARD tab on the top edge we go from (m - TAB_R, SQ_MIN) up and
// over to (m + TAB_R, SQ_MIN) — sweep 1 = clockwise = bulging UP.
// For an INWARD blank on the bottom edge we go from (m + TAB_R, SQ_MAX) over
// to (m - TAB_R, SQ_MAX) — sweep 1 = clockwise = bulging UP into the piece.

export const PUZZLE_PATH_D = [
  // start at top-left corner
  `M ${SQ_MIN} ${SQ_MIN}`,

  // --- TOP edge: outward tab pointing UP ---
  `L ${m - TAB_R} ${SQ_MIN}`,
  `A ${TAB_R} ${TAB_R} 0 0 1 ${m + TAB_R} ${SQ_MIN}`,
  `L ${SQ_MAX} ${SQ_MIN}`,

  // --- RIGHT edge: outward tab pointing RIGHT ---
  `L ${SQ_MAX} ${m - TAB_R}`,
  `A ${TAB_R} ${TAB_R} 0 0 1 ${SQ_MAX} ${m + TAB_R}`,
  `L ${SQ_MAX} ${SQ_MAX}`,

  // --- BOTTOM edge: inward blank cutting UP into the piece ---
  // Walking right-to-left along the bottom; sweep 0 makes the arc bulge UP.
  `L ${m + TAB_R} ${SQ_MAX}`,
  `A ${TAB_R} ${TAB_R} 0 0 0 ${m - TAB_R} ${SQ_MAX}`,
  `L ${SQ_MIN} ${SQ_MAX}`,

  // --- LEFT edge: inward blank cutting RIGHT into the piece ---
  // Walking bottom-to-top along the left; sweep 0 makes the arc bulge RIGHT.
  `L ${SQ_MIN} ${m + TAB_R}`,
  `A ${TAB_R} ${TAB_R} 0 0 0 ${SQ_MIN} ${m - TAB_R}`,
  `L ${SQ_MIN} ${SQ_MIN}`,

  "Z",
].join(" ");

/**
 * Approximate hit-test for the piece in its local 0..200 coordinate space.
 *
 * The shape now has both knobs (outside the base square on top/right) and
 * blanks (cutting INTO the base square on bottom/left). For cursor detection
 * we use a generous bounding region that covers the knobs but is fine over
 * the blanks too — for a sleek, forgiving feel.
 */
export function isInsidePuzzleLocal(x: number, y: number): boolean {
  // Bounding box that includes the protruding tabs.
  return x >= SQ_MIN - TAB_R && x <= SQ_MAX + TAB_R && y >= SQ_MIN - TAB_R && y <= SQ_MAX + TAB_R;
}
