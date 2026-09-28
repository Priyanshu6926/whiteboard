/**
 * Cubic Bezier Curve Animation Engine (VIZ-01)
 *
 * Implements parametric B(t) pathing and ergonomic control point generation
 * for natural agent cursor movement across the infinite whiteboard canvas.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface BezierCurve {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  p3: Point2D;
}

/**
 * Calculates point on a cubic Bezier curve at parameter t in [0, 1].
 * B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
 */
export function calculateCubicBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): Point2D {
  const clampedT = Math.max(0, Math.min(1, t));
  const oneMinusT = 1 - clampedT;
  const oneMinusT2 = oneMinusT * oneMinusT;
  const oneMinusT3 = oneMinusT2 * oneMinusT;
  const t2 = clampedT * clampedT;
  const t3 = t2 * clampedT;

  const x =
    oneMinusT3 * p0.x +
    3 * oneMinusT2 * clampedT * p1.x +
    3 * oneMinusT * t2 * p2.x +
    t3 * p3.x;

  const y =
    oneMinusT3 * p0.y +
    3 * oneMinusT2 * clampedT * p1.y +
    3 * oneMinusT * t2 * p2.y +
    t3 * p3.y;

  return { x, y };
}

/**
 * Calculates the first derivative B'(t) to determine instantaneous trajectory angle.
 */
export function calculateTangentAngle(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number
): number {
  const clampedT = Math.max(0, Math.min(1, t));
  const oneMinusT = 1 - clampedT;

  const dx =
    3 * oneMinusT * oneMinusT * (p1.x - p0.x) +
    6 * oneMinusT * clampedT * (p2.x - p1.x) +
    3 * clampedT * clampedT * (p3.x - p2.x);

  const dy =
    3 * oneMinusT * oneMinusT * (p1.y - p0.y) +
    6 * oneMinusT * clampedT * (p2.y - p1.y) +
    3 * clampedT * clampedT * (p3.y - p2.y);

  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Generates an ergonomic arc control point pair for a smooth, natural curve
 * displaced perpendicularly to the chord connecting start and end.
 */
export function generateControlPoints(
  start: Point2D,
  end: Point2D,
  curvature = 0.25
): BezierCurve {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // If start and end are practically identical, fallback to linear points
  if (dist < 1) {
    return {
      p0: { ...start },
      p1: { ...start },
      p2: { ...end },
      p3: { ...end },
    };
  }

  // Normal unit vector perpendicular to trajectory
  const nx = -dy / dist;
  const ny = dx / dist;

  // Arc displacement offset proportional to travel distance
  const offset = Math.min(220, Math.max(40, dist * curvature));

  // Alternating curvature direction based on horizontal movement
  const direction = dx >= 0 ? 1 : -1;

  const p1: Point2D = {
    x: start.x + dx * 0.28 + nx * offset * direction,
    y: start.y + dy * 0.28 + ny * offset * direction,
  };

  const p2: Point2D = {
    x: start.x + dx * 0.72 + nx * offset * 0.7 * direction,
    y: start.y + dy * 0.72 + ny * offset * 0.7 * direction,
  };

  return {
    p0: { ...start },
    p1,
    p2,
    p3: { ...end },
  };
}

/**
 * Standard cubic ease-out timing curve (fast start, silky deceleration).
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Quad ease-in-out timing curve.
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
