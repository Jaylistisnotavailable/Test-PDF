import { useCallback } from 'react';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { Layer } from '@/app/store/slices/layerSlice';
import { distance, distanceToSegment, pointInPolygon } from '../geometry/geometryUtils';
import { hitTestStructuralElement } from '../geometry/hitTest';

/**
 * Hit-test all drawable shapes on the current page.
 *
 * Selection priority:
 *
 * 1. Higher zIndex wins.
 * 2. If zIndex is equal, the shape appearing later in the shapes array wins.
 *
 * This gives deterministic "top-most object" behaviour when objects overlap.
 *
 * Important:
 * - Hit testing returns ONLY ONE shape.
 * - Multi-selection is handled by SelectTool using modifier keys.
 * - This function must never return multiple objects for a single mouse point.
 */
export function useHitTest(
  shapes: Shape[],
  layers: Layer[],
  tolerance = 5,
) {
  return useCallback(
    (x: number, y: number): Shape | null => {
      const validLayers = new Map(
        layers
          .filter((layer) => layer.visible && !layer.locked)
          .map((layer) => [layer.id, layer]),
      );

      /**
       * Build the candidate list first instead of immediately returning
       * the first hit.
       *
       * This allows us to apply an explicit zIndex priority when several
       * objects overlap at the same mouse position.
       */
      const candidates: Array<{ shape: Shape; index: number; zIndex: number; layerOrder: number}> = [];

      for (let i = 0; i < shapes.length; i += 1) {
        const shape = shapes[i];
        const layer = validLayers.get(shape.layerId);

        if (!layer) { continue}

        let hit = false;

        if ('geometry' in shape && 'style' in shape) {
          hit = hitTestStructuralElement( shape, { x, y }, tolerance);
        } else {
          switch (shape.type) {
            case 'point':
              hit =
                distance(
                  { x, y },
                  { x: shape.x, y: shape.y },
                ) <=
                shape.radius + tolerance;
              break;

            case 'line':
              hit =
                distanceToSegment(
                  { x, y },
                  {
                    x: shape.points[0],
                    y: shape.points[1],
                  },
                  {
                    x: shape.points[2],
                    y: shape.points[3],
                  },
                ) <= tolerance;
              break;

            case 'polyline':
            case 'measure':
              for (
                let j = 0;
                j < shape.points.length - 2;
                j += 2
              ) {
                const segmentHit =
                  distanceToSegment(
                    { x, y },
                    {
                      x: shape.points[j],
                      y: shape.points[j + 1],
                    },
                    {
                      x: shape.points[j + 2],
                      y: shape.points[j + 3],
                    },
                  ) <= tolerance;

                if (segmentHit) {
                  hit = true;
                  break;
                }
              }
              break;

            case 'polygon':
              hit = pointInPolygon(
                { x, y },
                Array.from(
                  {
                    length: shape.points.length / 2,
                  },
                  (_, j) => ({
                    x: shape.points[j * 2],
                    y: shape.points[j * 2 + 1],
                  }),
                ),
              );
              break;

            case 'rectangle':
              hit =
                x >= shape.x - tolerance &&
                x <= shape.x + shape.width + tolerance &&
                y >= shape.y - tolerance &&
                y <= shape.y + shape.height + tolerance;
              break;

            case 'circle':
              hit =
                distance(
                  { x, y },
                  {
                    x: shape.x,
                    y: shape.y,
                  },
                ) <=
                shape.radius + tolerance;
              break;

            case 'text': {
              const width = shape.text.length * shape.fontSize * 0.6;
              const height = shape.fontSize * 1.2;

              hit =
                x >= shape.x &&
                x <= shape.x + width &&
                y >= shape.y &&
                y <= shape.y + height;

              break;
            }

            default:
              hit = false;
              break;
          }
        }

        if (!hit) {
          continue;
        }

        /**
         * Structural elements have a required zIndex.
         *
         * Legacy shapes have an optional zIndex, so zero is used as the
         * default value.
         */
        const zIndex =
          'zIndex' in shape &&
          typeof shape.zIndex === 'number'
            ? shape.zIndex
            : 0;

        candidates.push({
          shape,
          index: i,
          zIndex,
          layerOrder: layer.order,
        });
      }

      if (candidates.length === 0) {
        return null;
      }

      /**
       * Determine the top-most object.
       *
       * The primary criterion is zIndex.
       *
       * Layer order is used as the secondary criterion. Higher layer order
       * represents a layer placed above lower-order layers.
       *
       * Finally, the original array index is used as a deterministic
       * tie-breaker. Since shapes are appended to the array when created,
       * the later shape is considered visually on top when all other
       * priorities are equal.
       */
      candidates.sort((a, b) => {
        if (a.layerOrder !== b.layerOrder) {
          return b.layerOrder - a.layerOrder;
        }

        if (a.zIndex !== b.zIndex) {
          return b.zIndex - a.zIndex;
        }

        return b.index - a.index;
      });

      /**
       * IMPORTANT:
       *
       * Always return exactly ONE shape.
       *
       * This guarantees that a single click in an overlapping area cannot
       * select two or more objects.
       */
      return candidates[0].shape;
    },
    [shapes, layers, tolerance],
  );
}