import { useEffect,RefObject } from 'react';
import { useAppDispatch,useAppSelector } from '@/app/store/hooks';
import { store } from '@/app/store';
import { addShape,updateShape,selectShape,clearSelection,deleteSelected,beginHistoryTransaction,endHistoryTransaction,copySelected,pasteClipboard,setActiveTool,undo,redo } from '@/app/store/slices/drawingSlice';
import type { Shape } from '@/app/store/slices/drawingSlice';
import { BaseTool,ToolContext } from '../tools/BaseTool';
import { SelectTool } from '../tools/SelectTool';
import { PointTool } from '../tools/PointTool';
import { LineTool } from '../tools/LineTool';
import { PolylineTool } from '../tools/PolylineTool';
import { PolygonTool } from '../tools/PolygonTool';
import { RectangleTool } from '../tools/RectangleTool';
import { CircleTool } from '../tools/CircleTool';
import { TextTool } from '../tools/TextTool';
import { MeasureTool } from '../tools/MeasureTool';
import { EraserTool } from '../tools/EraserTool';
import { ColumnTool } from '../tools/ColumnTool';
import { BeamTool } from '../tools/BeamTool';
import { WallTool } from '../tools/WallTool';
import { SlabTool } from '../tools/SlabTool';
import { PortalFrameTool } from '../tools/PortalFrameTool';
import { findSnapPoint } from '../snapping/snapEngine';

const toolInstances:Record<string,BaseTool>={
 select:new SelectTool(),column:new ColumnTool(),beam:new BeamTool(),wall:new WallTool(),slab:new SlabTool(),portalFrame:new PortalFrameTool(),
 point:new PointTool(),line:new LineTool(),polyline:new PolylineTool(),polygon:new PolygonTool(),rectangle:new RectangleTool(),circle:new CircleTool(),text:new TextTool(),measure:new MeasureTool(),eraser:new EraserTool()
};

export function useCanvasEvents(canvasRef:RefObject<HTMLCanvasElement>,hitTest:(x:number,y:number)=>Shape|null,tempShape:Shape|null,setTempShape:(s:Shape|null)=>void,showTextDialog:(x:number,y:number)=>void,setSnapPoint:(p:{x:number;y:number}|null)=>void,openProperties?:(shape:Shape|null)=>void,setSelectionRect?:(r:{x:number;y:number;width:number;height:number}|null)=>void){
 const dispatch=useAppDispatch();
 const activeTool=useAppSelector(s=>s.drawing.activeTool);
 const pdfScale=useAppSelector(s=>s.pdf.scale);

 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const coords=(e:MouseEvent)=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/Math.max(pdfScale,.0001),y:(e.clientY-r.top)/Math.max(pdfScale,.0001)}};
  const getCtx=():ToolContext=>({
   dispatch,getState:store.getState,pdfScale,tempShape,setTempShape,hitTest,showTextDialog,
   addShape:(s)=>dispatch(addShape(s)),updateShape:(id,c)=>dispatch(updateShape({id,changes:c})),
   selectShape:(id,m)=>dispatch(selectShape({id,multiSelect:m})),clearSelection:()=>dispatch(clearSelection()),deleteSelected:()=>dispatch(deleteSelected()),
   beginHistory:()=>dispatch(beginHistoryTransaction()),endHistory:()=>dispatch(endHistoryTransaction())
  });
  const tool=toolInstances[activeTool]??toolInstances.select;canvas.style.cursor=tool.cursor;let selectionStart:{x:number;y:number}|null=null;
  const handleMouseDown=(e:MouseEvent)=>{const p=coords(e);if(activeTool==='select'&&!hitTest(p.x,p.y))selectionStart=p;const state=store.getState();const structural=['column','beam','wall','slab','portalFrame'].includes(activeTool);const snapped=structural?findSnapPoint(p,state.drawing.shapes.filter((s:any)=>s.pageIndex===state.pdf.currentPage&&'geometry'in s),pdfScale,{enabled:state.ui.snapEnabled,gridSize:state.ui.gridSize,types:state.ui.snapTypes})?.point??p:p;setSnapPoint(null);tool.onMouseDown({x:snapped.x,y:snapped.y,rawEvent:e},getCtx());};
  const handleMouseMove=(e:MouseEvent)=>{const p=coords(e);if(selectionStart){setSelectionRect?.({x:Math.min(selectionStart.x,p.x),y:Math.min(selectionStart.y,p.y),width:Math.abs(p.x-selectionStart.x),height:Math.abs(p.y-selectionStart.y)});}const state=store.getState();const structural=['column','beam','wall','slab','portalFrame'].includes(activeTool);const snap=structural?findSnapPoint(p,state.drawing.shapes.filter((s:any)=>s.pageIndex===state.pdf.currentPage&&'geometry'in s),pdfScale,{enabled:state.ui.snapEnabled,gridSize:state.ui.gridSize,types:state.ui.snapTypes}):null;setSnapPoint(snap?.point??null);const use=snap?.point??p;tool.onMouseMove({x:use.x,y:use.y,rawEvent:e},getCtx());};
  const handleMouseUp=(e:MouseEvent)=>{const p=coords(e);selectionStart=null;setSelectionRect?.(null);tool.onMouseUp({x:p.x,y:p.y,rawEvent:e},getCtx());if(activeTool!=='beam'&&activeTool!=='wall'&&activeTool!=='portalFrame')setSnapPoint(null);};
  const handleDbl=(e:MouseEvent)=>{const p=coords(e);if(activeTool==='select'){openProperties?.(hitTest(p.x,p.y));return;}tool.onDblClick?.({x:p.x,y:p.y,rawEvent:e},getCtx());};
  const isTyping=(target:EventTarget|null)=>{const el=target as HTMLElement|null;return !!el&&(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||!!el.closest('[contenteditable="true"]'));};
  const key=(e:KeyboardEvent)=>{
   if(isTyping(e.target))return;
   if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();dispatch(deleteSelected());return;}
   const k=e.key.toLowerCase();
   if((e.ctrlKey||e.metaKey)&&k==='c'){e.preventDefault();dispatch(copySelected());return;}
   if((e.ctrlKey||e.metaKey)&&k==='v'){e.preventDefault();dispatch(pasteClipboard());return;}
   if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();dispatch(e.shiftKey?redo():undo());return;}
   if(!e.ctrlKey&&!e.metaKey&&!e.altKey){
    const map:Record<string,any>={v:'select',c:'column',b:'beam',w:'wall',s:'slab',p:'portalFrame',m:'measure'};
    if(map[k]){e.preventDefault();dispatch(setActiveTool(map[k]));return;}
   }
   tool.onKeyDown?.(e,getCtx());
  };
  canvas.addEventListener('mousedown',handleMouseDown);canvas.addEventListener('mousemove',handleMouseMove);canvas.addEventListener('mouseup',handleMouseUp);canvas.addEventListener('dblclick',handleDbl);window.addEventListener('keydown',key);
  return()=>{canvas.removeEventListener('mousedown',handleMouseDown);canvas.removeEventListener('mousemove',handleMouseMove);canvas.removeEventListener('mouseup',handleMouseUp);canvas.removeEventListener('dblclick',handleDbl);window.removeEventListener('keydown',key);};
 },[activeTool,pdfScale,dispatch,hitTest,tempShape,setTempShape,showTextDialog,canvasRef,setSnapPoint,openProperties,setSelectionRect]);
}
