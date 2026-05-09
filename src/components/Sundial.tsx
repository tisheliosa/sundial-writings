import { useMemo } from "react";
import "../styles/sundial.css";

interface SundialProps {
  /** Sun orbit angle in radians. 0 = sun at the right (east), increases counter-clockwise. */
  sunAngle: number;
}

// --- Geometry constants (all in viewBox units) ---
const DIAL_VIEW = 400;
const DIAL_CX = DIAL_VIEW / 2;
// Slight downward bias so the sun has more room above the dial.
const DIAL_CY = DIAL_VIEW / 2 + 30;

const DIAL_R = 110;            // top-disc radius (smaller)
const SIDE_HEIGHT = 20;        // visible height of the cylinder side
const SIDE_FORESHORTEN = 0.42; // vertical squash of the top ellipse vs. its width

const ORBIT_RX = 150;          // sun orbit horizontal radius
const ORBIT_RY = 110;          // sun orbit vertical radius (kept generous so it arcs high)
const SUN_R = 14;              // sun disc radius (smaller)

// Triangular pyramid (tetrahedron) gnomon, centered on the dial.
// Equilateral base lying flat on the top surface with one vertex pointing
// toward the viewer (south). A single apex sits directly above the centroid.
// We see the two front faces (apex + south vertex + each back vertex),
// which meet along the slanted edge from the apex down to the south vertex.
const GNOMON_HEIGHT = 78;      // apex height above the dial top
const GNOMON_BASE_R = 20;      // circumradius of the equilateral base triangle

// --- Flat color palette (no gradients) ---
const COLOR_TOP = "#f1d98a";        // light shade for top surface (also used for the sun)
const COLOR_TOP_BORDER = "#d9a64a"; // darker shade for the rim stroke + radial lines
const COLOR_SIDE = "#7a4f12";       // darker shade for cylinder side
const COLOR_GNOMON_LIGHT = "#d9a64a";
const COLOR_GNOMON_DARK = "#7a4f12";
const COLOR_SHADOW = "rgba(40, 25, 5, 0.55)";

const RADIAL_LINE_COUNT = 60;

/**
 * Flat illustrative sundial.
 *
 * Body = a short cylinder seen from a high angle:
 *   - Light-shaded ELLIPSE on top (foreshortened circle), with a darker
 *     STROKE on the rim (no separate inset border, no side outline).
 *   - Darker SIDE BAND for the cylinder wall (no outline).
 *   - Many closely spaced RADIAL LINES on the top surface.
 *
 * Gnomon = a thin SLANTED triangular prism standing on the top surface.
 * In profile it reads as a right triangle with the hypotenuse rising from
 * the back (north) to a southward-leaning apex — the classic sundial style.
 *
 * Sun = a borderless disc filled with the same color as the dial top,
 * orbiting in an untilted sky layer well above the dial.
 */
export function Sundial({ sunAngle }: SundialProps) {
  const topRy = DIAL_R * SIDE_FORESHORTEN;

  // --- Sun position. The orbit is an ellipse centered on the dial; we lift
  // it upward so the sun arcs through the sky well above the cylinder. ---
  const sunOrbitCY = DIAL_CY - 30;
  const sunX = DIAL_CX + Math.cos(sunAngle) * ORBIT_RX;
  const sunY = sunOrbitCY - Math.sin(sunAngle) * ORBIT_RY;
  const altitudeSin = Math.sin(sunAngle);
  const isDay = altitudeSin > 0.05;

  // --- Cylinder side band path (no stroke; the rim stroke on the top
  // ellipse provides the only outline on this part of the body). ---
  const sidePath = useMemo(() => {
    const left = DIAL_CX - DIAL_R - 1;
    const right = DIAL_CX + DIAL_R + 1;
    const topY = DIAL_CY;
    const botY = DIAL_CY + SIDE_HEIGHT;
    return [
      `M ${left} ${topY}`,
      `A ${DIAL_R} ${topRy} 0 0 0 ${right} ${topY}`, // front (lower) arc of top ellipse
      `L ${right} ${botY}`,
      `A ${DIAL_R} ${topRy} 0 0 1 ${left} ${botY}`,  // mirrored arc at the bottom
      "Z",
    ].join(" ");
  }, [topRy]);

  // --- Engraved radial lines on the top surface ---
  const radialLines = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; key: number }[] = [];
    const innerR = 10;
    const outerR = DIAL_R - 3;
    for (let i = 0; i < RADIAL_LINE_COUNT; i++) {
      const a = (i / RADIAL_LINE_COUNT) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      out.push({
        x1: DIAL_CX + cosA * innerR,
        y1: DIAL_CY + sinA * innerR * SIDE_FORESHORTEN,
        x2: DIAL_CX + cosA * outerR,
        y2: DIAL_CY + sinA * outerR * SIDE_FORESHORTEN,
        key: i,
      });
    }
    return out;
  }, []);

  // --- Gnomon (triangular pyramid, centered on the dial) ---
  // Equilateral base triangle with one vertex pointing south (toward the
  // viewer); single apex straight above the centroid (which is the dial
  // center). The two front faces share the slanted front edge from the
  // apex down to the south vertex.
  //
  // Base vertex positions in the dial plane (Y foreshortened):
  //   south: angle 90°  -> ( 0,  +R )
  //   back-left:  210°  -> (-R*cos30, -R*sin30)
  //   back-right: 330°  -> (+R*cos30, -R*sin30)
  const baseSouth = {
    x: DIAL_CX,
    y: DIAL_CY + GNOMON_BASE_R * SIDE_FORESHORTEN,
  };
  const baseBackLeft = {
    x: DIAL_CX - GNOMON_BASE_R * Math.cos(Math.PI / 6),
    y: DIAL_CY - GNOMON_BASE_R * Math.sin(Math.PI / 6) * SIDE_FORESHORTEN,
  };
  const baseBackRight = {
    x: DIAL_CX + GNOMON_BASE_R * Math.cos(Math.PI / 6),
    y: DIAL_CY - GNOMON_BASE_R * Math.sin(Math.PI / 6) * SIDE_FORESHORTEN,
  };

  // Apex sits straight above the base centroid (the dial center).
  const apex = { x: DIAL_CX, y: DIAL_CY - GNOMON_HEIGHT };

  // Front-left face: south base vertex -> back-left base vertex -> apex.
  // Front-right face: south base vertex -> back-right base vertex -> apex.
  // The shared front edge runs from baseSouth up to apex.
  const gnomonFrontLeftFace = [
    `${baseSouth.x},${baseSouth.y}`,
    `${baseBackLeft.x},${baseBackLeft.y}`,
    `${apex.x},${apex.y}`,
  ].join(" ");

  const gnomonFrontRightFace = [
    `${baseSouth.x},${baseSouth.y}`,
    `${baseBackRight.x},${baseBackRight.y}`,
    `${apex.x},${apex.y}`,
  ].join(" ");

  // --- Shadow ---
  // The cast shadow of a convex solid (here, a triangular pyramid) on a
  // plane is the convex hull of (a) its base footprint projected onto the
  // plane and (b) its apex projected onto the plane along the sun ray.
  // We compute the 4 candidate points (3 base vertices + projected apex)
  // and take their convex hull so the silhouette always cleanly contains
  // the full base regardless of which direction the sun is in.
  const shadowPath = useMemo(() => {
    if (!isDay) {
      return null;
    }
    const dirX = -Math.cos(sunAngle);
    const dirY = Math.sin(sunAngle);
    const length = Math.min(DIAL_R * 0.85, GNOMON_HEIGHT / Math.max(altitudeSin, 0.18));
    const tipX = DIAL_CX + dirX * length;
    const tipY = DIAL_CY + dirY * length * SIDE_FORESHORTEN;

    const points: { x: number; y: number }[] = [
      baseSouth,
      baseBackLeft,
      baseBackRight,
      { x: tipX, y: tipY },
    ];
    const hull = convexHull(points);
    return (
      hull
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ") + " Z"
    );
  }, [
    sunAngle,
    isDay,
    altitudeSin,
    baseBackLeft.x,
    baseBackLeft.y,
    baseBackRight.x,
    baseBackRight.y,
    baseSouth.x,
    baseSouth.y,
  ]);

  return (
    <div className="sundial">
      <svg viewBox={`0 0 ${DIAL_VIEW} ${DIAL_VIEW}`} width="100%" height="100%">
        {/* --- Cylinder side band (no outline) --- */}
        <path d={sidePath} fill={COLOR_SIDE} />

        {/* --- Top surface (light disc) with a darker rim stroke --- */}
        <ellipse
          cx={DIAL_CX}
          cy={DIAL_CY}
          rx={DIAL_R}
          ry={topRy}
          fill={COLOR_TOP}
          stroke={COLOR_TOP_BORDER}
          strokeWidth={2}
        />

        {/* --- Engraved radial lines on the top surface --- */}
        <g opacity={0.85}>
          {radialLines.map((l) => (
            <line
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={COLOR_TOP_BORDER}
              strokeWidth={0.6}
            />
          ))}
        </g>

        {/* --- Shadow first so the gnomon paints on top --- */}
        {shadowPath && <path d={shadowPath} fill={COLOR_SHADOW} />}

        {/* --- Gnomon (triangular pyramid: two front faces, no outlines) --- */}
        <polygon points={gnomonFrontLeftFace} fill={COLOR_GNOMON_DARK} />
        <polygon points={gnomonFrontRightFace} fill={COLOR_GNOMON_LIGHT} />
      </svg>

      {/* --- Sun layer: borderless disc, same color as the dial top --- */}
      <svg
        className="sundial__sky"
        viewBox={`0 0 ${DIAL_VIEW} ${DIAL_VIEW}`}
        width="100%"
        height="100%"
      >
        <circle
          cx={sunX}
          cy={sunY}
          r={SUN_R}
          fill={COLOR_TOP}
          opacity={isDay ? 1 : 0.3}
        />
      </svg>
    </div>
  );
}

/**
 * Andrew's monotone chain — returns the convex hull of the given 2D points
 * in counter-clockwise order. Stable for 4+ points; for fewer it returns
 * the input unchanged.
 *
 * (Used to compute the silhouette of the pyramid's cast shadow as the hull
 * of its base footprint plus the projected apex.)
 */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) {
    return points.slice();
  }
  const sorted = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
