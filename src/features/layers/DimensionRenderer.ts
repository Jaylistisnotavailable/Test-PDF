import type { Shape, MeasureShape } from '@/app/store/slices/drawingSlice';

export function renderDimension(ctx: CanvasRenderingContext2D, shape: Shape, showAutoDims: boolean) {
  ctx.save();
  // 获取当前缩放比例，用于保持 1px 视觉宽度和固定字号
  const invScale = 1 / ctx.getTransform().a;
  ctx.lineWidth = 1 * invScale;
  ctx.font = `${12 * invScale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (shape.type === 'measure') {
    const [x1, y1, x2, y2] = shape.points;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) { ctx.restore(); return; }
    
    const angle = Math.atan2(dy, dx);
    // 引线长度 (垂直于尺寸线)
    const perpX = -Math.sin(angle) * 10 * invScale; 
    const perpY = Math.cos(angle) * 10 * invScale;

    ctx.strokeStyle = shape.color;
    
    // 1. 绘制两端引线
    ctx.beginPath();
    ctx.moveTo(x1 - perpX, y1 - perpY); ctx.lineTo(x1 + perpX, y1 + perpY);
    ctx.moveTo(x2 - perpX, y2 - perpY); ctx.lineTo(x2 + perpX, y2 + perpY);
    ctx.stroke();

    // 2. 绘制主尺寸线
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 3. 绘制两端箭头
    const headLen = 8 * invScale;
    const drawArrowHead = (x: number, y: number, ang: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLen * Math.cos(ang - Math.PI / 6), y - headLen * Math.sin(ang - Math.PI / 6));
      ctx.moveTo(x, y);
      ctx.lineTo(x - headLen * Math.cos(ang + Math.PI / 6), y - headLen * Math.sin(ang + Math.PI / 6));
      ctx.stroke();
    };
    drawArrowHead(x1, y1, angle);
    drawArrowHead(x2, y2, angle + Math.PI);

    // 4. 绘制文字与白色半透明背景框
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = `${shape.realLength} ${shape.unit}`;
    const metrics = ctx.measureText(text);
    const textW = metrics.width + 8 * invScale;
    const textH = 16 * invScale;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(midX - textW / 2, midY - textH / 2, textW, textH);
    
    ctx.fillStyle = shape.color;
    ctx.fillText(text, midX, midY);
  } 
  else if (showAutoDims) {
    // 自动标注矩形的宽高
    if (shape.type === 'rectangle') {
      const { x, y, width, height, color } = shape;
      drawAutoDim(ctx, x, y + height + 15 * invScale, x + width, y + height + 15 * invScale, `${width.toFixed(0)}`, invScale, color);
      drawAutoDim(ctx, x - 15 * invScale, y, x - 15 * invScale, y + height, `${height.toFixed(0)}`, invScale, color, true);
    } 
    // 自动标注圆形的半径
    else if (shape.type === 'circle') {
      const { x, y, radius, color } = shape;
      const ang = -Math.PI / 4;
      const ex = x + radius * Math.cos(ang);
      const ey = y + radius * Math.sin(ang);
      
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(ex, ey);
      ctx.lineTo(ex + 20 * invScale, ey); // 水平引出线
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.fillText(`R${radius.toFixed(0)}`, ex + 22 * invScale, ey);
    }
  }
  ctx.restore();
}

function drawAutoDim(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, text: string, invScale: number, color: string, isVertical = false) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const metrics = ctx.measureText(text);
  const textW = metrics.width + 4 * invScale;
  const textH = 12 * invScale;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(midX - textW / 2, midY - textH / 2, textW, textH);
  
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, midX, midY);
}