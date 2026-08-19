import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectShape, clearSelection, deleteShape, updateShape, addShape } from '@/app/store/slices/drawingSlice';
import { ChevronRight, ChevronDown, Eye } from 'lucide-react';
import { 
  CircleDot, Minus, Share2, Pentagon, Square, Circle, Type, Ruler, Folder
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { Input } from '@/components/ui/input';
import type { TreeNodeData } from './types';
// import type { Shape } from '@/app/store/slices/drawingSlice';

const shapeIcons: Record<string, any> = {
  point: CircleDot, line: Minus, polyline: Share2, polygon: Pentagon,
  rectangle: Square, circle: Circle, text: Type, measure: Ruler
};

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  focusedId: string | null;
  onExpandToggle: (id: string) => void;
}

export function TreeNode({ node, depth, focusedId, onExpandToggle }: TreeNodeProps) {
  const dispatch = useAppDispatch();
  const selectedIds = useAppSelector(state => state.drawing.selectedShapeIds);
  const layers = useAppSelector(state => state.layer.layers);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedIds.includes(node.id);
  const isFocused = focusedId === node.id;
  const isLayer = node.type === 'layer';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLayer) {
      onExpandToggle(node.id);
      return;
    }
    
    const isMulti = e.ctrlKey || e.metaKey;
    dispatch(selectShape({ id: node.id, multiSelect: isMulti }));
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLayer) {
      setIsEditing(true);
      setEditValue(node.shapeData?.label || '');
    }
  };

  const handleRenameSubmit = () => {
    if (node.shapeData && editValue.trim() !== (node.shapeData.label || '')) {
      dispatch(updateShape({ id: node.id, changes: { label: editValue.trim() } }));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') handleRenameSubmit();
      if (e.key === 'Escape') setIsEditing(false);
    }
  };

  // 右键菜单操作
  const handleDelete = () => dispatch(deleteShape(node.id));
  const handleCopy = () => {
    if (node.shapeData) {
      const { id, createdAt, updatedAt, ...rest } = node.shapeData;
      dispatch(addShape(rest as any));
    }
  };
  const handleMoveToLayer = (layerId: string) => {
    dispatch(updateShape({ id: node.id, changes: { layerId } }));
  };
  const handleToggleLock = () => {
    // 注意：锁定是图层属性，这里简化为修改 shape 的 metadata 或提示用户去图层面板
    // 为了演示，我们修改 shape 的 opacity 为 0.5 模拟锁定
    if (node.shapeData) {
       dispatch(updateShape({ id: node.id, changes: { opacity: node.shapeData.opacity === 0.5 ? 1 : 0.5 } }));
    }
  };

  // 置顶/置底 (通过修改 createdAt 实现排序变化)
  const handleMoveTop = () => {
    if(node.shapeData) dispatch(updateShape({ id: node.id, changes: { createdAt: new Date(Date.now() + 1000).toISOString() } }));
  };
  const handleMoveBottom = () => {
    if(node.shapeData) dispatch(updateShape({ id: node.id, changes: { createdAt: new Date(0).toISOString() } }));
  };

  const Icon = isLayer ? Folder : (shapeIcons[node.shapeType || ''] || Square);
  const isExpanded = node.isExpanded;

  const content = (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 text-xs cursor-pointer rounded-sm transition-colors ${
        isSelected ? 'bg-primary/15 text-primary font-medium' : 
        isFocused ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isLayer ? (
        isExpanded ? <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
      ) : (
        <div className="w-3 flex-shrink-0" /> // 占位，保持对齐
      )}
      
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isLayer ? 'text-gray-500' : ''}`} style={!isLayer ? { color: node.shapeData?.color } : {}} />
      
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="h-5 text-xs px-1 py-0 flex-1"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {!isLayer && node.code && (
            <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{node.code}</span>
          )}
          <span className="truncate">{isLayer ? `${node.label} (${node.count})` : node.label}</span>
          {!isLayer && node.info && (
            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-auto">{node.info}</span>
          )}
        </div>
      )}
    </div>
  );

  if (isLayer) {
    return (
      <div>
        {content}
        {isExpanded && node.children?.map(child => (
          <TreeNode key={child.id} node={child} depth={depth + 1} focusedId={focusedId} onExpandToggle={onExpandToggle} />
        ))}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {content}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => setIsEditing(true)}>重命名</ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>复制</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>移动到图层...</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            {layers.map(l => (
              <ContextMenuItem key={l.id} onClick={() => handleMoveToLayer(l.id)} disabled={l.id === node.shapeData?.layerId}>
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: l.color }} />
                {l.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleMoveTop}>置顶</ContextMenuItem>
        <ContextMenuItem onClick={handleMoveBottom}>置底</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleToggleLock}>锁定/解锁 (模拟)</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">删除</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
