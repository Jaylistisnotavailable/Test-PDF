import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setStrokeColor, setStrokeWidth, deleteSelected } from '@/app/store/slices/drawingSlice';
import { Trash2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#1F2937", "#6B7280"];

export function ContextToolbar() {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector((s) => s.drawing.selectedShapeIds);
  const strokeColor = useAppSelector((s) => s.drawing.currentStrokeColor);
  const strokeWidth = useAppSelector((s) => s.drawing.currentStrokeWidth);
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (selectedIds.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-editor-panel shadow-sm">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Stroke:</span>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-editor-hover"
          title="Change Color"
        >
          <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: strokeColor }} />
        </button>
        {showColorPicker && (
          <div className="absolute top-full mt-2 left-0 flex flex-wrap gap-1 p-2 rounded-lg border border-border bg-editor-panel shadow-md z-40">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { dispatch(setStrokeColor(color)); setShowColorPicker(false); }}
                className={cn("w-5 h-5 rounded-full border-2", strokeColor === color ? "border-foreground scale-110" : "border-transparent")}
                style={{ background: color }}
              />
            ))}
            <label className="w-5 h-5 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent">
              <input type="color" value={strokeColor} onChange={(e) => dispatch(setStrokeColor(e.target.value))} className="opacity-0 absolute" />
              <Palette className="w-3 h-3 text-muted-foreground" />
            </label>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Width:</span>
        {[1, 2, 3, 5].map((w) => (
          <button
            key={w}
            onClick={() => dispatch(setStrokeWidth(w))}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-colors",
              strokeWidth === w ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-editor-hover"
            )}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-border" />

      <button
        onClick={() => dispatch(deleteSelected())}
        className="w-7 h-7 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
        title="Delete Selected (Delete)"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}