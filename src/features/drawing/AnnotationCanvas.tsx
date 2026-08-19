import { useEffect,useRef,useState,useCallback } from 'react';
import { useAppDispatch,useAppSelector } from '@/app/store/hooks';
import { addShape,selectShapesByPage,selectSelectedShapes,selectShape } from '@/app/store/slices/drawingSlice';
import type { Shape,TextShape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from './elements/elementTypes';
import { renderShape } from './ShapeRenderer';
import { useHitTest } from './hooks/useHitTest';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { StructuralPropertyDialog } from './StructuralPropertyDialog';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AnnotationCanvas(){
 const dispatch=useAppDispatch();const canvasRef=useRef<HTMLCanvasElement>(null);
 const pdfScale=useAppSelector(s=>s.pdf.scale),currentPage=useAppSelector(s=>s.pdf.currentPage);
 const layers=useAppSelector(s=>s.layer.layers),activeLayerId=useAppSelector(s=>s.layer.activeLayerId);
 const shapes=useAppSelector(s=>selectShapesByPage(s,currentPage)),selectedShapes=useAppSelector(selectSelectedShapes);
 const [tempShape,setTempShape]=useState<Shape|null>(null);
 const [snapPoint,setSnapPoint]=useState<{x:number;y:number}|null>(null);const [selectionRect,setSelectionRect]=useState<{x:number;y:number;width:number;height:number}|null>(null);
 const [propertyElement,setPropertyElement]=useState<StructuralElement|null>(null);
 const [textDialog,setTextDialog]=useState({x:0,y:0,open:false});const [textInput,setTextInput]=useState('');
 const hitTest=useHitTest(shapes,layers,5/Math.max(pdfScale,.0001));
 const openProperties=useCallback((shape:Shape|null)=>{if(shape&&'geometry'in shape){dispatch(selectShape({id:shape.id}));setPropertyElement(shape as StructuralElement);}},[dispatch]);

 useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  const frame=requestAnimationFrame(()=>{const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(pdfScale*dpr,0,0,pdfScale*dpr,0,0);ctx.clearRect(0,0,w,h);
   const visible=new Set(layers.filter(l=>l.visible).map(l=>l.id));shapes.forEach(s=>{if(visible.has(s.layerId))renderShape(ctx,s,selectedShapes.some(x=>x.id===s.id));});if(tempShape)renderShape(ctx,tempShape,false);
   if(selectionRect){ctx.save();ctx.strokeStyle='#2563eb';ctx.fillStyle='rgba(37,99,235,.08)';ctx.lineWidth=1/pdfScale;ctx.setLineDash([5/pdfScale,4/pdfScale]);ctx.fillRect(selectionRect.x,selectionRect.y,selectionRect.width,selectionRect.height);ctx.strokeRect(selectionRect.x,selectionRect.y,selectionRect.width,selectionRect.height);ctx.restore();}if(snapPoint){ctx.save();ctx.strokeStyle='#f59e0b';ctx.lineWidth=1/pdfScale;ctx.beginPath();ctx.moveTo(snapPoint.x-7/pdfScale,snapPoint.y);ctx.lineTo(snapPoint.x+7/pdfScale,snapPoint.y);ctx.moveTo(snapPoint.x,snapPoint.y-7/pdfScale);ctx.lineTo(snapPoint.x,snapPoint.y+7/pdfScale);ctx.stroke();ctx.restore();}
  });return()=>cancelAnimationFrame(frame);
 },[shapes,tempShape,selectedShapes,pdfScale,layers,snapPoint,selectionRect]);

 const submitText=useCallback(()=>{if(textInput.trim())dispatch(addShape({type:'text',x:textDialog.x,y:textDialog.y,text:textInput.trim(),fontSize:16,fontFamily:'sans-serif',layerId:activeLayerId,pageIndex:currentPage,color:'#000000',strokeWidth:1,opacity:1,zIndex:0} as Omit<TextShape,'id'|'createdAt'|'updatedAt'>));setTextDialog({x:0,y:0,open:false});setTextInput('');},[dispatch,textInput,textDialog.x,textDialog.y,activeLayerId,currentPage]);
 useCanvasEvents(canvasRef,hitTest,tempShape,setTempShape,(x,y)=>setTextDialog({x,y,open:true}),setSnapPoint,openProperties,setSelectionRect);
 // Property opening is intentionally handled by the canvas double-click at the hook level only when Select is active.
 useEffect(()=>{if(propertyElement){const fresh=shapes.find(s=>s.id===propertyElement.id);if(fresh&&'geometry'in fresh)setPropertyElement(fresh as StructuralElement);}},[shapes,propertyElement]);

 return <><canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" style={{pointerEvents:'auto'}}/>
  <Dialog open={textDialog.open} onOpenChange={open=>setTextDialog(v=>({...v,open}))}><DialogContent><DialogHeader><DialogTitle>Add Text</DialogTitle></DialogHeader><Input value={textInput} onChange={e=>setTextInput(e.target.value)} autoFocus/><DialogFooter><Button onClick={submitText}>OK</Button></DialogFooter></DialogContent></Dialog>
  <StructuralPropertyDialog element={propertyElement} open={!!propertyElement} onOpenChange={open=>{if(!open)setPropertyElement(null)}}/>
 </>;
}
