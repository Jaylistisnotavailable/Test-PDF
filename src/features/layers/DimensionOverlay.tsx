import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectShapesByPage } from '@/app/store/slices/drawingSlice';
import { renderDimension } from './DimensionRenderer';

export function DimensionOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfScale = useAppSelector(state => state.pdf.scale);
  const currentPage = useAppSelector(state => state.pdf.currentPage);
  const shapes = useAppSelector(state => selectShapesByPage(state, currentPage));
  const showDimensions = useAppSelector(state => state.layer.showDimensions);
  const layers = useAppSelector(state => state.layer.layers);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showDimensions) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameId = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pdfScale * dpr, pdfScale * dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      // 仅渲染可见图层中的图形
      const visibleLayerIds = layers.filter(l => l.visible).map(l => l.id);
      
      shapes.forEach(shape => {
        if (visibleLayerIds.includes(shape.layerId)) {
          renderDimension(ctx, shape, true); 
        }
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [shapes, pdfScale, showDimensions, layers, currentPage]);

  if (!showDimensions) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-20 pointer-events-none" 
    />
  );
}