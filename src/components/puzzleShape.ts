/**
 * Shared puzzle-piece geometry. The cutout in the page and the draggable
 * piece both render this same path so a perfect overlap is geometrically
 * guaranteed.
 *
 * The path is drawn inside a 200x200 viewBox. It is a square with a
 * "tab" bump on each of the four sides, classic jigsaw style.
 */
export const PUZZLE_VIEWBOX = 200;

// A single closed path: square + 4 tabs (top, right, bottom, left).
// Tab is a half-circle of radius TAB_R centered on each edge midpoint.
export const PUZZLE_PATH_D = [
  // start top-left corner
  "M 30 30",
  // top edge to tab start
  "L 80 30",
  // top tab (bump upward) — arc of radius 20, sweep clockwise
  "A 20 20 0 0 1 120 30",
  // continue top edge
  "L 170 30",
  // right edge to tab start
  "L 170 80",
  // right tab (bump rightward)
  "A 20 20 0 0 1 170 120",
  // continue right edge
  "L 170 170",
  // bottom edge to tab start
  "L 120 170",
  // bottom tab (bump downward)
  "A 20 20 0 0 1 80 170",
  // continue bottom edge
  "L 30 170",
  // left edge to tab start
  "L 30 120",
  // left tab (bump leftward)
  "A 20 20 0 0 1 30 80",
  // close
  "Z",
].join(" ");

/**
 * Approximate hit-test for the piece in its local coordinate space (0..200).
 * The shape is non-rectangular but for cursor detection we use the bounding
 * square — close enough and matches the visual footprint.
 */
export function isInsidePuzzleLocal(x: number, y: number): boolean {
  return x >= 10 && x <= 190 && y >= 10 && y <= 190;
}
