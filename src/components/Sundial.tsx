import { useMemo } from "react";
import "../styles/sundial.css";

interface SundialProps {
  /** Sun orbit angle in radians. 0 = sun at the right (east), increases counter-clockwise. */
  sunAngle: number;
}

const DIAL_VIEW = 400;          // SVG viewBox dimension
const DIAL_CX = DIAL_VIEW / 2;
const DIAL_CY = DIAL_VIEW / 2;
const DIAL_R = 150;              // dial face radius
const ORBIT_R = 175;             // sun orbit radius (sits just outside the dial)
const SUN_R = 22;                // sun visual radius
const GNOMON_HEIGHT = 70;        // logical height of the gnomon (used for shadow length)

/**
 * Vector-styled sundial in faked 3D.
 *
 * The whole dial (face + hour ticks + gnomon shadow) lives in one SVG that is
 * tilted via CSS `transform: perspective(...) rotateX(...)` to give the
 * appearance of a top-down dial. The sun is rendered in a separate, untilted
 * SVG layered above so it reads as a circle "in the sky" orbiting the dial.
 *
 * Shadow physics (simplified): the shadow points in the OPPOSITE direction
 * from the sun's azimuth, with length proportional to (1 / sin(altitude)).
 * Because we model the sun as orbiting in a vertical plane, altitude == the
 * sin of the angle above the horizon. We clamp so it never explodes.
 */
export function Sundial({ sunAngle }: SundialProps) {
  // Sun position in the screen plane (untilted layer).
  const sunX = DIAL_CX + Math.cos(sunAngle) * ORBIT_R;
  const sunY = DIAL_CY - Math.sin(sunAngle) * ORBIT_R;

  // Altitude (height above horizon line). Negative = below the horizon (night).
  const altitudeSin = Math.sin(sunAngle);
  const isDay = altitudeSin > 0.05;

  // Shadow vector on the dial face. Points away from the sun horizontally
  // (opposite azimuth) with length scaled by 1 / sin(altitude).
  const shadowPath = useMemo(() => {
    if (!isDay) {
      return null;
    }
    // Azimuth on the dial == direction from gnomon base to sun's projection.
    const dirX = -Math.cos(sunAngle);
    const dirY = Math.sin(sunAngle); // shadow goes "away" — but on screen y is inverted; this gives a pleasant arc
    const length = Math.min(DIAL_R * 0.9, GNOMON_HEIGHT / Math.max(altitudeSin, 0.15));
    const tipX = DIAL_CX + dirX * length;
    const tipY = DIAL_CY + dirY * length * 0.6; // 0.6 = vertical foreshortening from the tilt
    // Shadow as a slim triangle from the gnomon base to the tip.
    const baseHalfW = 6;
    return [
      `M ${DIAL_CX - baseHalfW} ${DIAL_CY}`,
      `L ${DIAL_CX + baseHalfW} ${DIAL_CY}`,
      `L ${tipX} ${tipY}`,
      "Z",
    ].join(" ");
  }, [sunAngle, isDay, altitudeSin]);

  // Hour tick marks (12 of them, like a clock).
  const ticks = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; key: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x1 = DIAL_CX + Math.cos(a) * (DIAL_R - 14);
      const y1 = DIAL_CY + Math.sin(a) * (DIAL_R - 14);
      const x2 = DIAL_CX + Math.cos(a) * DIAL_R;
      const y2 = DIAL_CY + Math.sin(a) * DIAL_R;
      out.push({ x1, y1, x2, y2, key: i });
    }
    return out;
  }, []);

  return (
    <div className="sundial">
      {/* Tilted dial face layer. */}
      <div className="sundial__dial-tilt">
        <svg viewBox={`0 0 ${DIAL_VIEW} ${DIAL_VIEW}`} width="100%" height="100%">
          {/* Outer ring */}
          <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_R} fill="#fff7d6" stroke="#d9b441" strokeWidth={4} />
          {/* Inner ring */}
          <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_R - 22} fill="none" stroke="#d9b441" strokeWidth={1.5} />
          {/* Hour ticks */}
          {ticks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#7a5a14"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
          {/* Shadow */}
          {shadowPath && <path d={shadowPath} fill="rgba(40, 28, 6, 0.55)" />}
          {/* Gnomon base */}
          <circle cx={DIAL_CX} cy={DIAL_CY} r={6} fill="#7a5a14" />
        </svg>
      </div>

      {/* Untilted gnomon: a vertical triangle sticking up out of the dial center. */}
      <div className="sundial__gnomon">
        <svg viewBox="0 0 40 80" width="100%" height="100%">
          <polygon points="20,0 32,72 8,72" fill="#b8881f" stroke="#7a5a14" strokeWidth={1.5} />
        </svg>
      </div>

      {/* Sun layer (untilted, so it stays a perfect circle "in the sky"). */}
      <div className="sundial__sky">
        <svg viewBox={`0 0 ${DIAL_VIEW} ${DIAL_VIEW}`} width="100%" height="100%">
          <defs>
            <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff2a8" />
              <stop offset="60%" stopColor="#f4c430" />
              <stop offset="100%" stopColor="#e3a000" />
            </radialGradient>
          </defs>
          <circle
            cx={sunX}
            cy={sunY}
            r={SUN_R}
            fill="url(#sun-grad)"
            opacity={isDay ? 1 : 0.25}
          />
        </svg>
      </div>
    </div>
  );
}
