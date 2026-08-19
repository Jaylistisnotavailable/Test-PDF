import React from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setActiveTool, ToolType } from '@/app/store/slices/drawingSlice';
import { 
  MousePointer2, CircleDot, Minus, Share2, Pentagon, Square, 
  Circle, Type, Ruler, Eraser 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolDef {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 className="w-4 h-4" />, shortcut: 'V' },
  { id: 'point', label: 'Point', icon: <CircleDot className="w-4 h-4" />, shortcut: 'P' },
  { id: 'line', label: 'Line', icon: <Minus className="w-4 h-4" />, shortcut: 'L' },
  { id: 'polyline', label: 'Polyline', icon: <Share2 className="w-4 h-4" />, shortcut: 'Shift+L' },
  { id: 'polygon', label: 'Polygon', icon: <Pentagon className="w-4 h-4" />, shortcut: 'G' },
  { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: <Circle className="w-4 h-4" />, shortcut: 'C' },
  { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
  { id: 'measure', label: 'Measure', icon: <Ruler className="w-4 h-4" />, shortcut: 'M' },
  { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
];

export function EditorToolbar() {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector((s) => s.drawing.activeTool);

  return (
    <div className="h-11 flex items-center gap-1 px-2 bg-editor-toolbar border-b border-border shrink-0">
      {TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => dispatch(setActiveTool(tool.id))}
              className={cn(
                "w-9 h-9 rounded flex items-center justify-center transition-colors",
                activeTool === tool.id
                  ? "bg-editor-active text-accent"
                  : "text-muted-foreground hover:bg-editor-hover hover:text-foreground"
              )}
            >
              {tool.icon}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs flex items-center gap-2">
            <span>{tool.label}</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{tool.shortcut}</kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}