/**
 * Geometry utility functions for 2D structural elements.
 *
 * Provides computational geometry helpers including:
 * - Distance and projection calculations (point-to-point, point-to-segment)
 * - 2D point transformations (rotation, translation)
 * - Bounding box (AABB) computation for points and structural elements
 * - Hit testing / point-in-polygon containment
 */

import type { PagePoint } from '@/core/coordinate/coordinateTypes';
import type { StructuralElement } from '../elements/elementTypes';

/**
 * Represents an axis-aligned 2D bounding box (AABB).
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculates the Euclidean distance between two 2D points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns The distance between point `a` and point `b`
 */
export const distance = (a: PagePoint, b: PagePoint): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Calculates the shortest distance from a point `p` to a line segment defined by endpoints `a` and `b`.
 *
 * Projects point `p` onto the line segment `ab`, clamping the projection factor `t` to [0, 1]
 * to ensure the closest point lies within the segment.
 *
 * @param p - The target point
 * @param a - Start point of the line segment
 * @param b - End point of the line segment
 * @returns Shortest distance from `p` to segment `ab`
 */
export function distanceToSegment(p: PagePoint, a: PagePoint, b: PagePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  // If the segment has zero length (a and b coincide), return distance to point a
  if (dx === 0 && dy === 0) return distance(p, a);

  // Calculate the projection factor t of point p onto line segment ab
  // t = ((p - a) . (b - a)) / |b - a|^2
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));

  // Closest point on the segment
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/**
 * Rotates a 2D point around a specified center point by a given angle in degrees.
 *
 * @param p - The point to rotate
 * @param center - The center point of rotation
 * @param angleDeg - Rotation angle in degrees (clockwise in a standard screen coordinate system where Y points down)
 * @returns The rotated point
 */
export function rotatePoint(p: PagePoint, center: PagePoint, angleDeg: number): PagePoint {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = p.x - center.x;
  const y = p.y - center.y;

  return {
    x: center.x + x * c - y * s,
    y: center.y + x * s + y * c,
  };
}

/**
 * Calculates the axis-aligned bounding box (AABB) enclosing a set of 2D points.
 *
 * @param points - Array of points to enclose
 * @returns The bounding box spanning all points, or {0, 0, 0, 0} if points array is empty
 */
export function polygonBounds(points: PagePoint[]): Bounds {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  return points.reduce(
    (b, p) => ({
      minX: Math.min(b.minX, p.x),
      minY: Math.min(b.minY, p.y),
      maxX: Math.max(b.maxX, p.x),
      maxY: Math.max(b.maxY, p.y),
    }),
    { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y },
  );
}

/**
 * Computes the axis-aligned bounding box (AABB) for any structural element.
 *
 * Handles different geometry shapes and transformations per element type:
 * - `column`: Rectangular box centered at `(x + width/2, y + depth/2)` with rotation applied.
 * - `beam`: Oriented rectangle formed by offsetting normal vectors along the centerline segment with half-width.
 * - `wall`: Oriented rectangle formed by offsetting normal vectors along the centerline segment with half-thickness.
 * - `slab`: Polygon enclosing all vertex points.
 * - `portalFrame`: Bounding box spanning column positions, column widths, height, and beam depth.
 *
 * @param element - The structural element
 * @returns The bounding box enclosing the element
 */
export function elementBounds(element: StructuralElement): Bounds {
  switch (element.type) {
    case 'node': {
      return {
        minX: element.geometry.x,
        minY: element.geometry.y,
        maxX: element.geometry.x,
        maxY: element.geometry.y,
      };
    }
    case 'column': {
      // Calculate column center and half dimensions
      const cx = element.geometry.x + element.geometry.width / 2;
      const cy = element.geometry.y + element.geometry.depth / 2;
      const hw = element.geometry.width / 2;
      const hd = element.geometry.depth / 2;

      // Unrotated corner points, then rotated around center
      const corners = [
        { x: cx - hw, y: cy - hd },
        { x: cx + hw, y: cy - hd },
        { x: cx + hw, y: cy + hd },
        { x: cx - hw, y: cy + hd },
      ].map((p) => rotatePoint(p, { x: cx, y: cy }, element.geometry.rotation));

      return polygonBounds(corners);
    }
    case 'beam': {
      const { start, end, width } = element.geometry;
      const safewidth = Math.max(width || 1, 1); // Avoid zero-width beams for bounding box calculations
      // Angle of the beam centerline
      const a = Math.atan2(end.y - start.y, end.x - start.x);
      // Perpendicular normal offset vector (scaled to half-width)
      const nx = (Math.sin(a) * safewidth) / 2;
      const ny = (-Math.cos(a) * safewidth) / 2;

      // 4 corners of the beam rectangle
      return polygonBounds([
        { x: start.x + nx, y: start.y + ny },
        { x: start.x - nx, y: start.y - ny },
        { x: end.x + nx, y: end.y + ny },
        { x: end.x - nx, y: end.y - ny },
      ]);
    }
    case 'wall': {
      const { start, end, thickness } = element.geometry;
      const safethickness = Math.max(thickness || 1, 1); // Avoid zero-thickness walls for bounding box calculations
      // Angle of the wall centerline
      const a = Math.atan2(end.y - start.y, end.x - start.x);
      // Perpendicular normal offset vector (scaled to half-thickness)
      const nx = (Math.sin(a) * safethickness) / 2;
      const ny = (-Math.cos(a) * safethickness) / 2;

      // 4 corners of the wall rectangle
      return polygonBounds([
        { x: start.x + nx, y: start.y + ny },
        { x: start.x - nx, y: start.y - ny },
        { x: end.x + nx, y: end.y + ny },
        { x: end.x - nx, y: end.y - ny },
      ]);
    }
    case 'slab':
      return polygonBounds(element.geometry.points);

    case 'portalFrame': {
      const g = element.geometry;
      return {
        minX: Math.min(g.start.x, g.end.x) - g.columnWidth / 2,
        minY: Math.min(g.start.y, g.end.y),
        maxX: Math.max(g.start.x, g.end.x) + g.columnWidth / 2,
        maxY: Math.max(g.start.y, g.end.y) + g.height + g.beamDepth,
      };
    }
  default:
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

/**
 * Determines whether a point lies inside a 2D polygon using the Ray-Casting algorithm
 * (even-odd rule / Jordan curve theorem).
 *
 * Casts a horizontal ray from point `p` to +infinity and counts intersections with polygon edges.
 * An odd number of intersections indicates the point is inside.
 *
 * @param p - The query point
 * @param points - Array of polygon vertices in order
 * @returns `true` if the point is inside the polygon, `false` otherwise
 */
export function pointInPolygon(p: PagePoint, points: PagePoint[]): boolean {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];

    // Check if the horizontal ray through p intersects the edge (a, b)
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Translates a structural element's geometry by a given 2D displacement (dx, dy).
 *
 * Returns a new element instance with updated geometry coordinates (immutable).
 *
 * @param element - The original structural element
 * @param dx - Translation distance along the X axis
 * @param dy - Translation distance along the Y axis
 * @returns A new structural element with updated position
 */
export function translateElement(element: StructuralElement, dx: number, dy: number): StructuralElement {
  switch (element.type) {
    case 'node':
      return {
        ...element,
        geometry: {
          x: element.geometry.x + dx,
          y: element.geometry.y + dy,
        },
      };
    case 'column':
      return {
        ...element,
        geometry: {
          ...element.geometry,
          x: element.geometry.x + dx,
          y: element.geometry.y + dy,
        },
      };
    case 'beam':
      return {
        ...element,
        geometry: {
          ...element.geometry,
          start: { x: element.geometry.start.x + dx, y: element.geometry.start.y + dy },
          end: { x: element.geometry.end.x + dx, y: element.geometry.end.y + dy },
        },
      };
    case 'wall':
      return {
        ...element,
        geometry: {
          ...element.geometry,
          start: { x: element.geometry.start.x + dx, y: element.geometry.start.y + dy },
          end: { x: element.geometry.end.x + dx, y: element.geometry.end.y + dy },
        },
      };
    case 'slab':
      return {
        ...element,
        geometry: {
          points: element.geometry.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        },
      };
    case 'portalFrame':
      return {
        ...element,
        geometry: {
          ...element.geometry,
          start: { x: element.geometry.start.x + dx, y: element.geometry.start.y + dy },
          end: { x: element.geometry.end.x + dx, y: element.geometry.end.y + dy },
        },
      };
  
  default:
    return element;
  }
}

