import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { selectShape, clearSelection } from '@/app/store/slices/drawingSlice';
import { useTreeData } from './useTreeData';
import { TreeToolbar } from './TreeToolbar';
import { TreeNode } from './TreeNode';
import type { SortBy, TreeNodeData } from './types';

export function TreeViewPanel() {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const treeData = useTreeData(searchQuery, sortBy);
  const containerRef = useRef<HTMLDivElement>(null);

  // 扁平化树节点以支持键盘导航
  const flatNodes = useCallback((nodes: TreeNodeData[], depth = 0): { node: TreeNodeData; depth: number }[] => {
    let result: { node: TreeNodeData; depth: number }[] = [];
    nodes.forEach(node => {
      result.push({ node, depth });
      if (node.type === 'layer' && (node.isExpanded || expandedIds.has(node.id)) && node.children) {
        result = result.concat(flatNodes(node.children, depth + 1));
      }
    });
    return result;
  }, [expandedIds]);

  const currentFlatNodes = flatNodes(treeData);

  // 初始化默认展开所有图层
  useEffect(() => {
    const layerIds = treeData.filter(n => n.type === 'layer').map(n => n.id);
    setExpandedIds(new Set(layerIds));
  }, [treeData]);

  const handleExpandToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, currentFlatNodes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const targetNode = currentFlatNodes[focusedIndex]?.node;
        if (targetNode) {
          if (targetNode.type === 'layer') {
            handleExpandToggle(targetNode.id);
          } else {
            dispatch(selectShape({ id: targetNode.id, multiSelect: e.ctrlKey || e.metaKey }));
          }
        }
      } else if (e.key === 'Escape') {
        dispatch(clearSelection());
        setFocusedIndex(-1);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    return () => container?.removeEventListener('keydown', handleKeyDown);
  }, [currentFlatNodes, focusedIndex, dispatch]);

  // 同步 focusedId 到 TreeNode
  const focusedId = focusedIndex >= 0 ? currentFlatNodes[focusedIndex]?.node.id : null;

  return (
    <div className="flex flex-col h-full bg-white focus:outline-none" ref={containerRef} tabIndex={0}>
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-sm">元素树</h3>
        <span className="text-xs text-gray-400">{currentFlatNodes.filter(n => n.node.type === 'shape').length} 个元素</span>
      </div>

      <TreeToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="flex-1 overflow-y-auto p-1">
        {treeData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-gray-400">
            {searchQuery ? '未找到匹配的元素' : '当前页暂无图形元素'}
          </div>
        ) : (
          treeData.map(node => (
            <TreeNode
              key={node.id}
              node={{ ...node, isExpanded: expandedIds.has(node.id) }}
              depth={0}
              focusedId={focusedId}
              onExpandToggle={handleExpandToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
