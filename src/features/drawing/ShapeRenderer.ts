import type { Shape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from './elements/elementTypes';
import {
  ELEMENT_COLORS,
  pageUnitsToMm,
} from './elements/elementDefaults';
import { elementBounds } from './geometry/geometryUtils';

function drawSelection(
  ctx: CanvasRenderingContext2D,
  e: StructuralElement,
) {
  const b = elementBounds(e);

  ctx.save();

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);

  ctx.strokeRect(
    b.minX - 5,
    b.minY - 5,
    b.maxX - b.minX + 10,
    b.maxY - b.minY + 10,
  );

  ctx.restore();
}

/**
 * Draw a small centre point / centre mark.
 *
 * The size is kept visually constant on the PDF page,
 * rather than becoming excessively large for small structural
 * members such as 90 x 90 columns.
 */
function drawCenterMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 2.5,
) {
  ctx.save();

  ctx.fillStyle = '#111827';

  ctx.beginPath();
  ctx.arc(x, y, Math.max(size * 0.45, 0.8), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 0.6;

  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);

  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);

  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a simple horizontal dimension.
 *
 * This is intentionally a compact drawing annotation rather than
 * the full Measure tool.
 */
function drawHorizontalDimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  realLength: number,
) {
  const length = Math.abs(x2 - x1);

  if (length < 0.5) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = '#111827';
  ctx.fillStyle = '#111827';
  ctx.lineWidth = 0.65;
  ctx.setLineDash([]);

  // Extension lines
  ctx.beginPath();

  ctx.moveTo(x1, y + 1);
  ctx.lineTo(x1, y - 3);

  ctx.moveTo(x2, y + 1);
  ctx.lineTo(x2, y - 3);

  // Dimension line
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);

  ctx.stroke();

  // Arrow heads
  const arrow = Math.min(2.5, Math.max(1.2, length * 0.12));

  ctx.beginPath();

  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + arrow, y - arrow * 0.55);

  ctx.moveTo(x1, y);
  ctx.lineTo(x1 + arrow, y + arrow * 0.55);

  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - arrow, y - arrow * 0.55);

  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - arrow, y + arrow * 0.55);

  ctx.stroke();

  // Text
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  ctx.fillText(
    `${Math.round(realLength)}`,
    (x1 + x2) / 2,
    y - 1.5,
  );

  ctx.restore();
}

/**
 * Draw a simple vertical dimension.
 */
function drawVerticalDimension(
  ctx: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  realLength: number,
) {
  const length = Math.abs(y2 - y1);

  if (length < 0.5) {
    return;
  }

  ctx.save();

  ctx.strokeStyle = '#111827';
  ctx.fillStyle = '#111827';
  ctx.lineWidth = 0.65;
  ctx.setLineDash([]);

  ctx.beginPath();

  // Extension lines
  ctx.moveTo(x + 1, y1);
  ctx.lineTo(x + 4, y1);

  ctx.moveTo(x + 1, y2);
  ctx.lineTo(x + 4, y2);

  // Dimension line
  ctx.moveTo(x + 3, y1);
  ctx.lineTo(x + 3, y2);

  ctx.stroke();

  const arrow = Math.min(2.5, Math.max(1.2, length * 0.12));

  ctx.beginPath();

  ctx.moveTo(x + 3, y1);
  ctx.lineTo(x + 3 - arrow * 0.55, y1 + arrow);

  ctx.moveTo(x + 3, y1);
  ctx.lineTo(x + 3 + arrow * 0.55, y1 + arrow);

  ctx.moveTo(x + 3, y2);
  ctx.lineTo(x + 3 - arrow * 0.55, y2 - arrow);

  ctx.moveTo(x + 3, y2);
  ctx.lineTo(x + 3 + arrow * 0.55, y2 - arrow);

  ctx.stroke();

  // Rotated dimension text
  ctx.translate(x + 8, (y1 + y2) / 2);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  ctx.fillText(
    `${Math.round(realLength)}`,
    0,
    0,
  );

  ctx.restore();
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  e: Extract<StructuralElement, { type: 'column' }>,
) {
  const g = e.geometry;

  const centerX = g.x + g.width / 2;
  const centerY = g.y + g.depth / 2;

  ctx.save();

  ctx.globalAlpha = e.style.opacity;
  ctx.strokeStyle = ELEMENT_COLORS.column;
  ctx.lineWidth = Math.max(0.75, e.style.strokeWidth);
  ctx.lineJoin = 'miter';

  ctx.translate(centerX, centerY);
  ctx.rotate((g.rotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  // Column fill
  if (
    e.style.fillColor &&
    e.style.fillColor !== 'transparent'
  ) {
    ctx.fillStyle = e.style.fillColor;
    ctx.globalAlpha =
      e.style.fillOpacity ?? e.style.opacity;

    ctx.fillRect(
      g.x,
      g.y,
      g.width,
      g.depth,
    );

    ctx.globalAlpha = e.style.opacity;
  }

  // Outer 90 x 90 rectangle
  ctx.strokeRect(
    g.x,
    g.y,
    g.width,
    g.depth,
  );

  // Centre point and centre cross
  drawCenterMark(
    ctx,
    centerX,
    centerY,
    Math.max(2.5, Math.min(g.width, g.depth) * 0.8),
  );

  // Dimension labels.
  //
  // Because the geometry is PDF page coordinates, convert
  // it back to the real engineering dimension.
  const realWidth = pageUnitsToMm(g.width);
  const realDepth = pageUnitsToMm(g.depth);

  drawHorizontalDimension(
    ctx,
    g.x,
    g.x + g.width,
    g.y - 6,
    realWidth,
  );

  drawVerticalDimension(
    ctx,
    g.x + g.width + 4,
    g.y,
    g.y + g.depth,
    realDepth,
  );

  ctx.restore();
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  e: Extract<StructuralElement, { type: 'beam' }>,
) {
  const g = e.geometry;

  ctx.save();

  ctx.globalAlpha = e.style.opacity;

  /**
   * Beam is intentionally represented by a single line.
   *
   * This is different from the wall representation and avoids
   * visually confusing a beam with a 190 mm wall.
   */
  ctx.strokeStyle = ELEMENT_COLORS.beam;

  // Keep beam visually thin regardless of its real 90 mm width.
  ctx.lineWidth = Math.max(1.0, e.style.strokeWidth);

  ctx.lineCap = 'butt';

  ctx.beginPath();
  ctx.moveTo(g.start.x, g.start.y);
  ctx.lineTo(g.end.x, g.end.y);
  ctx.stroke();

  ctx.restore();
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  e: Extract<StructuralElement, { type: 'wall' }>,
) {
  const g = e.geometry;

  const angle = Math.atan2(
    g.end.y - g.start.y,
    g.end.x - g.start.x,
  );

  const nx = Math.sin(angle) * g.thickness / 2;
  const ny = -Math.cos(angle) * g.thickness / 2;

  ctx.save();

  ctx.globalAlpha = e.style.opacity;

  ctx.strokeStyle = ELEMENT_COLORS.wall;

  ctx.lineWidth = Math.max(
    0.8,
    e.style.strokeWidth,
  );

  ctx.lineJoin = 'miter';

  // Wall outer rectangle
  ctx.beginPath();

  ctx.moveTo(
    g.start.x + nx,
    g.start.y + ny,
  );

  ctx.lineTo(
    g.end.x + nx,
    g.end.y + ny,
  );

  ctx.lineTo(
    g.end.x - nx,
    g.end.y - ny,
  );

  ctx.lineTo(
    g.start.x - nx,
    g.start.y - ny,
  );

  ctx.closePath();

  if (
    e.style.fillColor &&
    e.style.fillColor !== 'transparent'
  ) {
    ctx.fillStyle = e.style.fillColor;
    ctx.globalAlpha =
      e.style.fillOpacity ?? e.style.opacity;

    ctx.fill();

    ctx.globalAlpha = e.style.opacity;
  }

  ctx.stroke();

  /**
   * Wall centreline.
   *
   * The centreline makes a structural wall visually distinct
   * from a beam while preserving the actual 190 mm wall width.
   */
  ctx.strokeStyle = ELEMENT_COLORS.wallCenterline;
  ctx.lineWidth = 0.65;
  ctx.setLineDash([3, 2]);

  ctx.beginPath();
  ctx.moveTo(g.start.x, g.start.y);
  ctx.lineTo(g.end.x, g.end.y);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.restore();
}

function drawSlab(
  ctx: CanvasRenderingContext2D,
  e: Extract<StructuralElement, { type: 'slab' }>,
) {
  const pts = e.geometry.points;

  if (!pts.length) {
    return;
  }

  ctx.save();

  ctx.globalAlpha = e.style.opacity;
  ctx.strokeStyle = e.style.color;
  ctx.lineWidth = e.style.strokeWidth;

  ctx.beginPath();

  ctx.moveTo(
    pts[0].x,
    pts[0].y,
  );

  pts.slice(1).forEach((p) => {
    ctx.lineTo(p.x, p.y);
  });

  ctx.closePath();

  if (
    e.style.fillColor &&
    e.style.fillColor !== 'transparent'
  ) {
    ctx.fillStyle = e.style.fillColor;

    ctx.globalAlpha =
      e.style.fillOpacity ?? e.style.opacity;

    ctx.fill();

    ctx.globalAlpha = e.style.opacity;
  }

  ctx.stroke();

  ctx.restore();
}

function drawPortalFrame(
  ctx: CanvasRenderingContext2D,
  e: Extract<StructuralElement, { type: 'portalFrame' }>,
) {
  const g = e.geometry;

  /**
   * In plan view the portal frame is represented as:
   *
   *   [COLUMN] ───────── [COLUMN]
   *
   * The two columns use the normal column representation.
   * The connecting member uses a separate colour.
   *
   * We deliberately do NOT draw the old vertical "elevation"
   * representation here because this canvas represents an
   * architectural floor plan.
   */

  ctx.save();

  ctx.globalAlpha = e.style.opacity;

  const columnWidth = g.columnWidth;
  const columnDepth = g.columnDepth;

  /**
   * Draw one column centred at a point.
   */
  const drawPortalColumn = (
    x: number,
    y: number,
  ) => {
    const left = x - columnWidth / 2;
    const top = y - columnDepth / 2;

    ctx.strokeStyle = ELEMENT_COLORS.portalColumn;

    ctx.lineWidth = Math.max(
      0.75,
      e.style.strokeWidth,
    );

    ctx.lineJoin = 'miter';

    if (
      e.style.fillColor &&
      e.style.fillColor !== 'transparent'
    ) {
      ctx.fillStyle = e.style.fillColor;

      ctx.globalAlpha =
        e.style.fillOpacity ?? e.style.opacity;

      ctx.fillRect(
        left,
        top,
        columnWidth,
        columnDepth,
      );

      ctx.globalAlpha = e.style.opacity;
    }

    ctx.strokeRect(
      left,
      top,
      columnWidth,
      columnDepth,
    );

    drawCenterMark(
      ctx,
      x,
      y,
      Math.max(
        2.5,
        Math.min(columnWidth, columnDepth) * 0.8,
      ),
    );
  };

  drawPortalColumn(
    g.start.x,
    g.start.y,
  );

  drawPortalColumn(
    g.end.x,
    g.end.y,
  );

  /**
   * Portal connecting beam.
   *
   * Deliberately different colour from the columns.
   */
  ctx.strokeStyle = ELEMENT_COLORS.portalBeam;

  ctx.lineWidth = Math.max(
    1.0,
    e.style.strokeWidth,
  );

  ctx.lineCap = 'butt';

  ctx.beginPath();

  ctx.moveTo(
    g.start.x,
    g.start.y,
  );

  ctx.lineTo(
    g.end.x,
    g.end.y,
  );

  ctx.stroke();

  ctx.restore();
}

function drawStructural(
  ctx: CanvasRenderingContext2D,
  e: StructuralElement,
  selected: boolean,
) {
  switch (e.type) {
    case 'column':
      drawColumn(ctx, e);
      break;

    case 'beam':
      drawBeam(ctx, e);
      break;

    case 'wall':
      drawWall(ctx, e);
      break;

    case 'slab':
      drawSlab(ctx, e);
      break;

    case 'portalFrame':
      drawPortalFrame(ctx, e);
      break;
  }

  if (selected) {
    drawSelection(ctx, e);
  }
}

export function renderShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  isSelected: boolean,
) {
  /**
   * Structural elements use the new structural renderer.
   */
  if (
    'geometry' in shape &&
    'style' in shape
  ) {
    drawStructural(
      ctx,
      shape as StructuralElement,
      isSelected,
    );

    return;
  }

  /**
   * Legacy drawing elements.
   */
  ctx.save();

  ctx.globalAlpha = shape.opacity;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (shape.type) {
    case 'point':
      ctx.fillStyle = shape.color;

      ctx.beginPath();
      ctx.arc(
        shape.x,
        shape.y,
        shape.radius,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      break;

    case 'line':
      ctx.beginPath();

      ctx.moveTo(
        shape.points[0],
        shape.points[1],
      );

      ctx.lineTo(
        shape.points[2],
        shape.points[3],
      );

      ctx.stroke();
      break;

    case 'polyline':
      ctx.beginPath();

      ctx.moveTo(
        shape.points[0],
        shape.points[1],
      );

      for (
        let i = 2;
        i < shape.points.length;
        i += 2
      ) {
        ctx.lineTo(
          shape.points[i],
          shape.points[i + 1],
        );
      }

      ctx.stroke();
      break;

    case 'polygon':
      ctx.beginPath();

      ctx.moveTo(
        shape.points[0],
        shape.points[1],
      );

      for (
        let i = 2;
        i < shape.points.length;
        i += 2
      ) {
        ctx.lineTo(
          shape.points[i],
          shape.points[i + 1],
        );
      }

      ctx.closePath();

      if (
        shape.fillColor &&
        shape.fillColor !== 'transparent'
      ) {
        ctx.fillStyle = shape.fillColor;
        ctx.fill();
      }

      ctx.stroke();
      break;

    case 'rectangle':
      ctx.strokeRect(
        shape.x,
        shape.y,
        shape.width,
        shape.height,
      );
      break;

    case 'circle':
      ctx.beginPath();

      ctx.arc(
        shape.x,
        shape.y,
        shape.radius,
        0,
        Math.PI * 2,
      );

      ctx.stroke();
      break;

    case 'text':
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
      ctx.textBaseline = 'top';

      ctx.fillText(
        shape.text,
        shape.x,
        shape.y,
      );
      break;

    case 'measure': {
      const [
        x1,
        y1,
        x2,
        y2,
      ] = shape.points;

      ctx.beginPath();

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      ctx.stroke();

      ctx.font = '12px sans-serif';

      ctx.fillText(
        `${shape.realLength} ${shape.unit}`,
        (x1 + x2) / 2,
        (y1 + y2) / 2,
      );

      break;
    }
  }

  /**
   * Selection box for legacy shapes.
   */
  if (
    isSelected &&
    !('geometry' in shape)
  ) {
    ctx.save();

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);

    let bounds: {
      x: number;
      y: number;
      w: number;
      h: number;
    };

    if (
      'x' in shape &&
      'width' in shape
    ) {
      bounds = {
        x: shape.x,
        y: shape.y,
        w: shape.width,
        h: shape.height,
      };
    } else if ('points' in shape) {
      const xs = shape.points.filter(
        (_, i) => i % 2 === 0,
      );

      const ys = shape.points.filter(
        (_, i) => i % 2 === 1,
      );

      bounds = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...xs) - Math.min(...xs),
        h: Math.max(...ys) - Math.min(...ys),
      };
    } else {
      bounds = {
        x: shape.x - 5,
        y: shape.y - 5,
        w: 10,
        h: 10,
      };
    }

    ctx.strokeRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.w + 10,
      bounds.h + 10,
    );

    ctx.restore();
  }

  ctx.restore();
}