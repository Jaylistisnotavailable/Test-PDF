import { useCallback } from 'react';
import type { Shape } from '@/app/store/slices/drawingSlice';
import type { Layer } from '@/app/store/slices/layerSlice';
import { distance, distanceToSegment, pointInPolygon } from '../geometry/geometryUtils';
import { hitTestStructuralElement } from '../geometry/hitTest';

export function useHitTest(shapes:Shape[],layers:Layer[],tolerance=5){
 return useCallback((x:number,y:number):Shape|null=>{
  const valid=new Set(layers.filter(l=>l.visible&&!l.locked).map(l=>l.id));
  for(let i=shapes.length-1;i>=0;i--){
   const s=shapes[i];if(!valid.has(s.layerId))continue;
   if('geometry' in s && 'style' in s){if(hitTestStructuralElement(s as any,{x,y},tolerance))return s;continue;}
   let hit=false;
   switch(s.type){
    case 'point':hit=distance({x,y},{x:s.x,y:s.y})<=s.radius+tolerance;break;
    case 'line':hit=distanceToSegment({x,y},{x:s.points[0],y:s.points[1]},{x:s.points[2],y:s.points[3]})<=tolerance;break;
    case 'polyline':
    case 'measure':for(let j=0;j<s.points.length-2;j+=2)if(distanceToSegment({x,y},{x:s.points[j],y:s.points[j+1]},{x:s.points[j+2],y:s.points[j+3]})<=tolerance){hit=true;break;}break;
    case 'polygon':hit=pointInPolygon({x,y},Array.from({length:s.points.length/2},(_,j)=>({x:s.points[j*2],y:s.points[j*2+1]})));break;
    case 'rectangle':hit=x>=s.x-tolerance&&x<=s.x+s.width+tolerance&&y>=s.y-tolerance&&y<=s.y+s.height+tolerance;break;
    case 'circle':hit=distance({x,y},{x:s.x,y:s.y})<=s.radius+tolerance;break;
    case 'text':{const w=s.text.length*s.fontSize*.6,h=s.fontSize*1.2;hit=x>=s.x&&x<=s.x+w&&y>=s.y&&y<=s.y+h;break;}
   }
   if(hit)return s;
  }return null;
 },[shapes,layers,tolerance]);
}
