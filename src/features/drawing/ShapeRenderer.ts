import type { Shape } from '@/app/store/slices/drawingSlice';
import type { StructuralElement } from './elements/elementTypes';
import { elementBounds, rotatePoint } from './geometry/geometryUtils';

function selection(ctx:CanvasRenderingContext2D,e:StructuralElement){
  const b=elementBounds(e);
  ctx.save();ctx.strokeStyle='#2563eb';ctx.lineWidth=1;ctx.setLineDash([5,4]);
  ctx.strokeRect(b.minX-5,b.minY-5,b.maxX-b.minX+10,b.maxY-b.minY+10);ctx.restore();
}
function drawStructural(ctx:CanvasRenderingContext2D,e:StructuralElement,selected:boolean){
  ctx.save();ctx.globalAlpha=e.style.opacity;ctx.strokeStyle=e.style.color;ctx.lineWidth=e.style.strokeWidth;ctx.lineJoin='round';ctx.lineCap='round';
  const fill=e.style.fillColor&&e.style.fillColor!=='transparent';
  if(fill)ctx.fillStyle=e.style.fillColor!;
  switch(e.type){
    case 'column':{
      const g=e.geometry,c={x:g.x+g.width/2,y:g.y+g.depth/2};
      ctx.translate(c.x,c.y);ctx.rotate(g.rotation*Math.PI/180);ctx.translate(-c.x,-c.y);
      if(fill){ctx.globalAlpha=e.style.fillOpacity??e.style.opacity;ctx.fillRect(g.x,g.y,g.width,g.depth);ctx.globalAlpha=e.style.opacity;}
      ctx.strokeRect(g.x,g.y,g.width,g.depth);break;
    }
    case 'beam':{
      const g=e.geometry,a=Math.atan2(g.end.y-g.start.y,g.end.x-g.start.x),nx=Math.sin(a)*g.width/2,ny=-Math.cos(a)*g.width/2;
      ctx.beginPath();ctx.moveTo(g.start.x+nx,g.start.y+ny);ctx.lineTo(g.end.x+nx,g.end.y+ny);ctx.lineTo(g.end.x-nx,g.end.y-ny);ctx.lineTo(g.start.x-nx,g.start.y-ny);ctx.closePath();
      if(fill){ctx.globalAlpha=e.style.fillOpacity??e.style.opacity;ctx.fill();ctx.globalAlpha=e.style.opacity;}ctx.stroke();break;
    }
    case 'wall':{
      const g=e.geometry,a=Math.atan2(g.end.y-g.start.y,g.end.x-g.start.x),nx=Math.sin(a)*g.thickness/2,ny=-Math.cos(a)*g.thickness/2;
      ctx.beginPath();ctx.moveTo(g.start.x+nx,g.start.y+ny);ctx.lineTo(g.end.x+nx,g.end.y+ny);ctx.lineTo(g.end.x-nx,g.end.y-ny);ctx.lineTo(g.start.x-nx,g.start.y-ny);ctx.closePath();
      if(fill){ctx.globalAlpha=e.style.fillOpacity??e.style.opacity;ctx.fill();ctx.globalAlpha=e.style.opacity;}ctx.stroke();break;
    }
    case 'slab':{
      const pts=e.geometry.points;if(!pts.length)break;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      if(fill){ctx.globalAlpha=e.style.fillOpacity??e.style.opacity;ctx.fill();ctx.globalAlpha=e.style.opacity;}ctx.stroke();break;
    }
    case 'portalFrame':{
      const g=e.geometry;const lt={x:g.start.x,y:g.start.y+g.height},rt={x:g.end.x,y:g.end.y+g.height};
      ctx.lineWidth=g.columnWidth;ctx.beginPath();ctx.moveTo(g.start.x,g.start.y);ctx.lineTo(lt.x,lt.y);ctx.moveTo(g.end.x,g.end.y);ctx.lineTo(rt.x,rt.y);ctx.stroke();
      ctx.lineWidth=g.beamDepth;ctx.beginPath();ctx.moveTo(lt.x,lt.y);ctx.lineTo(rt.x,rt.y);ctx.stroke();break;
    }
  }
  ctx.restore();if(selected)selection(ctx,e);
}

export function renderShape(ctx:CanvasRenderingContext2D,shape:Shape,isSelected:boolean){
  if('geometry' in shape && 'style' in shape){drawStructural(ctx,shape as StructuralElement,isSelected);return;}
  ctx.save();ctx.globalAlpha=shape.opacity;ctx.strokeStyle=shape.color;ctx.lineWidth=shape.strokeWidth;ctx.lineJoin='round';ctx.lineCap='round';
  switch(shape.type){
    case 'point':ctx.fillStyle=shape.color;ctx.beginPath();ctx.arc(shape.x,shape.y,shape.radius,0,Math.PI*2);ctx.fill();break;
    case 'line':ctx.beginPath();ctx.moveTo(shape.points[0],shape.points[1]);ctx.lineTo(shape.points[2],shape.points[3]);ctx.stroke();break;
    case 'polyline':ctx.beginPath();ctx.moveTo(shape.points[0],shape.points[1]);for(let i=2;i<shape.points.length;i+=2)ctx.lineTo(shape.points[i],shape.points[i+1]);ctx.stroke();break;
    case 'polygon':ctx.beginPath();ctx.moveTo(shape.points[0],shape.points[1]);for(let i=2;i<shape.points.length;i+=2)ctx.lineTo(shape.points[i],shape.points[i+1]);ctx.closePath();if(shape.fillColor&&shape.fillColor!=='transparent'){ctx.fillStyle=shape.fillColor;ctx.fill();}ctx.stroke();break;
    case 'rectangle':ctx.strokeRect(shape.x,shape.y,shape.width,shape.height);break;
    case 'circle':ctx.beginPath();ctx.arc(shape.x,shape.y,shape.radius,0,Math.PI*2);ctx.stroke();break;
    case 'text':ctx.fillStyle=shape.color;ctx.font=`${shape.fontSize}px ${shape.fontFamily}`;ctx.textBaseline='top';ctx.fillText(shape.text,shape.x,shape.y);break;
    case 'measure':{const[x1,y1,x2,y2]=shape.points;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.font='12px sans-serif';ctx.fillText(`${shape.realLength} ${shape.unit}`,(x1+x2)/2,(y1+y2)/2);break;}
  }
  if(isSelected && !('geometry' in shape)){ctx.strokeStyle='#2563eb';ctx.setLineDash([5,4]);const b='x'in shape&&'width'in shape?{x:shape.x,y:shape.y,w:shape.width,h:shape.height}:('points'in shape?{x:Math.min(...shape.points.filter((_,i)=>i%2===0)),y:Math.min(...shape.points.filter((_,i)=>i%2===1)),w:Math.max(...shape.points.filter((_,i)=>i%2===0))-Math.min(...shape.points.filter((_,i)=>i%2===0)),h:Math.max(...shape.points.filter((_,i)=>i%2===1))-Math.min(...shape.points.filter((_,i)=>i%2===1))}:{x:shape.x-5,y:shape.y-5,w:10,h:10});ctx.strokeRect(b.x-5,b.y-5,b.w+10,b.h+10);}
  ctx.restore();
}
