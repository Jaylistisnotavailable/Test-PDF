import { BaseTool,CanvasEvent,ToolContext } from './BaseTool';
import { elementBounds } from '../geometry/geometryUtils';
import { translateStructuralElement } from '../geometry/transform';

export class SelectTool extends BaseTool{
 cursor='default';
 private dragStart:{x:number;y:number}|null=null;
 private initial=new Map<string,any>();
 private windowStart:{x:number;y:number}|null=null;

 onMouseDown(e:CanvasEvent,ctx:ToolContext){
  const shape=ctx.hitTest(e.x,e.y);
  const multi=e.rawEvent.shiftKey||e.rawEvent.ctrlKey||e.rawEvent.metaKey;
  if(shape){
   const already=ctx.getState().drawing.selectedShapeIds.includes(shape.id);
   if(multi&&already){ctx.selectShape(shape.id,true);this.dragStart=null;this.initial.clear();return;}
   if(!multi)ctx.selectShape(shape.id,false);else ctx.selectShape(shape.id,true);
   const selectedIds=multi?new Set([...ctx.getState().drawing.selectedShapeIds,shape.id]):new Set([shape.id]);
   this.initial.clear();
   for(const s of ctx.getState().drawing.shapes){
    if(selectedIds.has(s.id))this.initial.set(s.id,JSON.parse(JSON.stringify(s)));
   }
   this.dragStart={x:e.x,y:e.y};ctx.beginHistory();
  }else{
   ctx.clearSelection();this.windowStart={x:e.x,y:e.y};
  }
 }
 onMouseMove(e:CanvasEvent,ctx:ToolContext){
  if(this.dragStart){
   const dx=e.x-this.dragStart.x,dy=e.y-this.dragStart.y;
   for(const [id,s] of this.initial){
    const next='geometry' in s?translateStructuralElement(s,dx,dy):this.translateLegacy(s,dx,dy);
    ctx.updateShape(id,next as any);
   }
  }
 }
 onMouseUp(e:CanvasEvent,ctx:ToolContext){
  if(this.dragStart){this.dragStart=null;this.initial.clear();ctx.endHistory();return;}
  if(this.windowStart){
   const a=this.windowStart,b={x:e.x,y:e.y};const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y);
   const ids=ctx.getState().drawing.shapes.filter(s=>s.pageIndex===ctx.getState().pdf.currentPage).filter(s=>{
    const r='geometry'in s?elementBounds(s):this.legacyBounds(s as any);
    return r.maxX>=minX&&r.minX<=maxX&&r.maxY>=minY&&r.minY<=maxY;
   }).map(s=>s.id);
   if(ids.length)ctx.dispatch({type:'drawing/selectShapes',payload:ids});this.windowStart=null;
  }
 }
 onKeyDown(e:KeyboardEvent,ctx:ToolContext){
  if(e.key==='Escape'){this.dragStart=null;this.windowStart=null;this.initial.clear();ctx.endHistory();}
  if(e.key==='Delete'||e.key==='Backspace')ctx.deleteSelected();
 }
 private translateLegacy(s:any,dx:number,dy:number){
  const c={...s};
  if('x'in c)c.x+=dx;if('y'in c)c.y+=dy;
  if('points'in c)c.points=c.points.map((v:number,i:number)=>v+(i%2?dy:dx));
  return c;
 }
 private legacyBounds(s:any){if('x'in s&&'width'in s)return{minX:s.x,minY:s.y,maxX:s.x+s.width,maxY:s.y+s.height};if('points'in s){const xs=s.points.filter((_:number,i:number)=>i%2===0),ys=s.points.filter((_:number,i:number)=>i%2===1);return{minX:Math.min(...xs),minY:Math.min(...ys),maxX:Math.max(...xs),maxY:Math.max(...ys)}}return{x:s.x,y:s.y,minX:s.x-5,minY:s.y-5,maxX:s.x+5,maxY:s.y+5};}
}
