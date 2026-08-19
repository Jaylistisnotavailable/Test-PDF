import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { addShape, selectShapesByPage, selectSelectedShapes } from '@/app/store/slices/drawingSlice';
import type { Shape, TextShape } from '@/app/store/slices/drawingSlice';
import { renderShape } from './ShapeRenderer';
import { useHitTest } from './hooks/useHitTest';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AnnotationCanvas() {
  const dispatch = useAppDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const pdfScale = useAppSelector(state => state.pdf.scale);
  const currentPage = useAppSelector(state => state.pdf.currentPage);
  const layers = useAppSelector(state => state.layer.layers);
  const activeLayerId = useAppSelector(state => state.layer.activeLayerId);
  const shapes = useAppSelector(state => selectShapesByPage(state, currentPage));
  const selectedShapes = useAppSelector(selectSelectedShapes);
  // const showDimensions = useAppSelector(state => state.layer.showDimensions);

  const [tempShape, setTempShape] = useState<Shape | null>(null);
  const [textDialog, setTextDialog] = useState<{ x: number; y: number; open: boolean }>({ x: 0, y: 0, open: false });
  const [textInput, setTextInput] = useState('');

  const hitTest = useHitTest(shapes, layers, 5 / pdfScale);

  // 渲染循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameId = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = canvas.clientHeight;
      
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pdfScale * dpr, pdfScale * dpr); // 核心：直接缩放到逻辑坐标系

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // 1. 渲染已有图形 (按图层顺序)
      const visibleLayerIds = layers.filter(l => l.visible).map(l => l.id);
      shapes.forEach(shape => {
        if (visibleLayerIds.includes(shape.layerId)) {
          const isSelected = selectedShapes.some(s => s.id === shape.id);
          renderShape(ctx, shape, isSelected);
        }
      });

      // 2. 渲染临时图形
      if (tempShape) {
        renderShape(ctx, tempShape, false);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [shapes, tempShape, selectedShapes, pdfScale, layers, currentPage]);

  // 处理 TextTool 弹窗
  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      dispatch(addShape({
        type: 'text', x: textDialog.x, y: textDialog.y, text: textInput,
        fontSize: 16, fontFamily: 'sans-serif',
        layerId: activeLayerId, pageIndex: currentPage,
        color: '#000000', strokeWidth: 1, opacity: 1
      } as TextShape));
    }
    setTextDialog({ ...textDialog, open: false });
    setTextInput('');
  }, [dispatch, textInput, textDialog, activeLayerId, currentPage]);

  // 绑定事件
  useCanvasEvents(canvasRef, hitTest, tempShape, setTempShape, (x, y) => {
    setTextDialog({ x, y, open: true });
  });

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-10" 
        style={{ pointerEvents: 'auto' }}
      />
      <Dialog open={textDialog.open} onOpenChange={(open) => setTextDialog({ ...textDialog, open })}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加文字</DialogTitle></DialogHeader>
          <Input value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="请输入文字..." autoFocus />
          <DialogFooter>
            <Button onClick={handleTextSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
