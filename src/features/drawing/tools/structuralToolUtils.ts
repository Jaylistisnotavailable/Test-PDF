import type { ToolContext } from './BaseTool';
import type { StructuralElementType } from '../elements/elementTypes';
import { DEFAULT_ELEMENT_STYLE, STRUCTURAL_DEFAULTS, prefixForType } from '../elements/elementDefaults';

export function makeBase(ctx:ToolContext,type:StructuralElementType,geometry:any){
  const s=ctx.getState().drawing;
  const root=ctx.getState();
  return {
    id:'temp',type,pageIndex:root.pdf.currentPage,layerId:root.layer.activeLayerId,
    geometry,properties:{} as any,
    style:{...DEFAULT_ELEMENT_STYLE,color:s.currentStrokeColor,strokeWidth:s.currentStrokeWidth,opacity:s.currentOpacity,fillColor:s.currentFillColor},
    label:'',createdAt:'',updatedAt:'',zIndex:0,
  } as any;
}
export function structuralDefaults(type:StructuralElementType){return STRUCTURAL_DEFAULTS[type];}
export function ensureLabel(ctx:ToolContext,type:StructuralElementType){
  const state=ctx.getState();
  const prefix=prefixForType(type);
  const used=state.drawing.shapes.filter((s:any)=>s.type===type).map((s:any)=>s.label as string);
  let i=1;while(used.includes(`${prefix}-${String(i).padStart(3,'0')}`))i++;
  return `${prefix}-${String(i).padStart(3,'0')}`;
}
