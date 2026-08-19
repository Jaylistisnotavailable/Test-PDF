import { useEffect,useState } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { updateShape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from './elements/elementTypes';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props{element:StructuralElement|null;open:boolean;onOpenChange:(open:boolean)=>void;}

export function StructuralPropertyDialog({element,open,onOpenChange}:Props){
 const dispatch=useAppDispatch();
 const [draft,setDraft]=useState<Record<string,string>>({});
 useEffect(()=>{if(element){const g:any=element.geometry,p:any=element.properties;const data:any={label:element.label,...p};if(element.type==='column')Object.assign(data,{width:g.width,depth:g.depth,rotation:g.rotation});if(element.type==='beam')Object.assign(data,{width:g.width,depth:g.depth});if(element.type==='wall')Object.assign(data,{thickness:g.thickness});if(element.type==='slab')Object.assign(data,{thickness:p.thickness,level:p.level});if(element.type==='portalFrame')Object.assign(data,{height:g.height,columnWidth:g.columnWidth,columnDepth:g.columnDepth,beamWidth:g.beamWidth,beamDepth:g.beamDepth});setDraft(Object.fromEntries(Object.entries(data).map(([k,v])=>[k,String(v??'')])));}},[element]);
 if(!element)return null;
 const numeric=new Set(['width','depth','rotation','thickness','height','columnWidth','columnDepth','beamWidth','beamDepth']);
 const fields=element.type==='column'?['label','width','depth','rotation','section','material']:element.type==='beam'?['label','width','depth','section','material']:element.type==='wall'?['label','thickness','wallType','material']:element.type==='slab'?['label','thickness','level','material']:['label','height','columnWidth','columnDepth','beamWidth','beamDepth','section','material'];
 const apply=()=>{const g:any={...element.geometry},p:any={...element.properties};for(const k of fields){if(k==='label')continue; if(k in g){const n=Number(draft[k]);if(!Number.isFinite(n)||n<0)return;g[k]=n;}else if(k in p)p[k]=numeric.has(k)?Number(draft[k]):draft[k];}p.label=draft.label||element.label;dispatch(updateShape({id:element.id,changes:{label:p.label,geometry:g,properties:p}}));onOpenChange(false);};
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{element.type} Properties</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">{fields.map(f=><div key={f} className="space-y-1"><label className="text-xs text-muted-foreground capitalize">{f}</label><Input type={numeric.has(f)?'number':'text'} value={draft[f]??''} min={numeric.has(f)?0:undefined} step={numeric.has(f)?'any':undefined} onChange={e=>setDraft(d=>({...d,[f]:e.target.value}))}/></div>)}</div><DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button onClick={apply}>Apply</Button></DialogFooter></DialogContent></Dialog>;
}
