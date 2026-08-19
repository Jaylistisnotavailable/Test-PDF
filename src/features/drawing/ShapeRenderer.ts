import type { Shape } from '@/app/store/slices/drawingSlice';
import { drawArrow, drawSelectionBox } from './utils/canvasHelpers';
import { getBounds } from './utils/geometry';

export function renderShape(ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) {
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
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.fill();
      // 十字丝
      ctx.beginPath();
      ctx.moveTo(shape.x - shape.radius * 1.5, shape.y);
      ctx.lineTo(shape.x + shape.radius * 1.5, shape.y);
      ctx.moveTo(shape.x, shape.y - shape.radius * 1.5);
      ctx.lineTo(shape.x, shape.y + shape.radius * 1.5);
      ctx.stroke();
      break;

    case 'line':
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      ctx.lineTo(shape.points[2], shape.points[3]);
      ctx.stroke();
      break;

    case 'polyline':
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      for (let i = 2; i < shape.points.length; i += 2) {
        ctx.lineTo(shape.points[i], shape.points[i + 1]);
      }
      ctx.stroke();
      break;

    case 'polygon':
      ctx.beginPath();
      ctx.moveTo(shape.points[0], shape.points[1]);
      for (let i = 2; i < shape.points.length; i += 2) {
        ctx.lineTo(shape.points[i], shape.points[i + 1]);
      }
      ctx.closePath();
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor;
        ctx.globalAlpha = shape.fillOpacity ?? shape.opacity;
        ctx.fill();
        ctx.globalAlpha = shape.opacity;
      }
      ctx.stroke();
      break;

    case 'rectangle':
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor;
        ctx.globalAlpha = shape.fillOpacity ?? shape.opacity;
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.globalAlpha = shape.opacity;
      }
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor;
        ctx.globalAlpha = shape.fillOpacity ?? shape.opacity;
        ctx.fill();
        ctx.globalAlpha = shape.opacity;
      }
      ctx.stroke();
      break;

    case 'text':
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.fillText(shape.text, shape.x, shape.y);
      break;

    case 'measure':
      const [x1, y1, x2, y2] = shape.points;
      ctx.beginPath();
      drawArrow(ctx, x1, y1, x2, y2, 10);
      drawArrow(ctx, x2, y2, x1, y1, 10);
      ctx.stroke();
      
      // 标注文字
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const text = `${shape.realLength} ${shape.unit}`;
      ctx.font = '12px sans-serif';
      ctx.fillStyle = shape.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, midX, midY - 5);
      break;
  }

  if (isSelected) {
    let bounds;
    if ('x' in shape && 'width' in shape) {
      bounds = { minX: shape.x, minY: shape.y, maxX: shape.x + shape.width, maxY: shape.y + shape.height };
    } else if ('points' in shape) {
      bounds = getBounds(shape.points);
    } else if ('x' in shape && 'radius' in shape) {
      bounds = { minX: shape.x - shape.radius, minY: shape.y - shape.radius, maxX: shape.x + shape.radius, maxY: shape.y + shape.radius };
    } else {
      bounds = { minX: shape.x - 10, minY: shape.y - 10, maxX: shape.x + 10, maxY: shape.y + 10 };
    }
    drawSelectionBox(ctx, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
  }

  ctx.restore();
}