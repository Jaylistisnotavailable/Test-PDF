import type { PagePoint } from '@/core/coordinate/coordinateTypes';
import type { StructuralElement } from '../elements/elementTypes';

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

export const distance = (a: PagePoint, b: PagePoint) =>
  Math.hypot(b.x - a.x, b.y - a.y);

export function distanceToSegment(p: PagePoint, a: PagePoint, b: PagePoint): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 0 && dy === 0) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x-a.x)*dx + (p.y-a.y)*dy)/(dx*dx+dy*dy)));
  return distance(p, { x: a.x + t*dx, y: a.y + t*dy });
}

export function rotatePoint(p: PagePoint, center: PagePoint, angleDeg: number): PagePoint {
  const a = angleDeg * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  const x = p.x - center.x, y = p.y - center.y;
  return { x: center.x + x*c - y*s, y: center.y + x*s + y*c };
}

export function polygonBounds(points: PagePoint[]): Bounds {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return points.reduce((b,p)=>({
    minX: Math.min(b.minX,p.x), minY: Math.min(b.minY,p.y),
    maxX: Math.max(b.maxX,p.x), maxY: Math.max(b.maxY,p.y),
  }), { minX: points[0].x, minY: points[0].y, maxX: points[0].x, maxY: points[0].y });
}

export function elementBounds(element: StructuralElement): Bounds {
  switch (element.type) {
    case 'column': {
      const cx = element.geometry.x + element.geometry.width/2;
      const cy = element.geometry.y + element.geometry.depth/2;
      const hw = element.geometry.width/2, hd = element.geometry.depth/2;
      const corners = [
        {x:cx-hw,y:cy-hd},{x:cx+hw,y:cy-hd},{x:cx+hw,y:cy+hd},{x:cx-hw,y:cy+hd}
      ].map(p => rotatePoint(p,{x:cx,y:cy},element.geometry.rotation));
      return polygonBounds(corners);
    }
    case 'beam': {
      const {start,end,width} = element.geometry;
      const a = Math.atan2(end.y-start.y,end.x-start.x);
      const nx = Math.sin(a)*width/2, ny = -Math.cos(a)*width/2;
      return polygonBounds([{x:start.x+nx,y:start.y+ny},{x:start.x-nx,y:start.y-ny},{x:end.x+nx,y:end.y+ny},{x:end.x-nx,y:end.y-ny}]);
    }
    case 'wall': {
      const {start,end,thickness} = element.geometry;
      const a = Math.atan2(end.y-start.y,end.x-start.x);
      const nx = Math.sin(a)*thickness/2, ny = -Math.cos(a)*thickness/2;
      return polygonBounds([{x:start.x+nx,y:start.y+ny},{x:start.x-nx,y:start.y-ny},{x:end.x+nx,y:end.y+ny},{x:end.x-nx,y:end.y-ny}]);
    }
    case 'slab': return polygonBounds(element.geometry.points);
    case 'portalFrame': {
      const g=element.geometry;
      return { minX: Math.min(g.start.x,g.end.x)-g.columnWidth/2,
        minY: Math.min(g.start.y,g.end.y), maxX: Math.max(g.start.x,g.end.x)+g.columnWidth/2,
        maxY: Math.max(g.start.y,g.end.y)+g.height+g.beamDepth };
    }
  }
}

export function pointInPolygon(p: PagePoint, points: PagePoint[]): boolean {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if(((a.y>p.y)!==(b.y>p.y)) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
  }
  return inside;
}

export function translateElement(element: StructuralElement, dx: number, dy: number): StructuralElement {
  switch(element.type) {
    case 'column': return {...element, geometry:{...element.geometry,x:element.geometry.x+dx,y:element.geometry.y+dy}};
    case 'beam': return {...element, geometry:{...element.geometry,start:{x:element.geometry.start.x+dx,y:element.geometry.start.y+dy},end:{x:element.geometry.end.x+dx,y:element.geometry.end.y+dy}}};
    case 'wall': return {...element, geometry:{...element.geometry,start:{x:element.geometry.start.x+dx,y:element.geometry.start.y+dy},end:{x:element.geometry.end.x+dx,y:element.geometry.end.y+dy}}};
    case 'slab': return {...element, geometry:{points:element.geometry.points.map(p=>({x:p.x+dx,y:p.y+dy}))}};
    case 'portalFrame': return {...element, geometry:{...element.geometry,start:{x:element.geometry.start.x+dx,y:element.geometry.start.y+dy},end:{x:element.geometry.end.x+dx,y:element.geometry.end.y+dy}}};
  }
}
