import React from 'react';
import { FileText, Undo2, Redo2, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisplaySettingsDialog } from './DisplaySettingsDialog';

export function AppHeader() {
  return (
    <header className="h-12 flex items-center justify-between px-4 bg-editor-toolbar border-b border-border shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-semibold text-base tracking-tight">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-accent-foreground">
            <FileText className="w-4 h-4" />
          </div>
          <span>PDF Canvas</span>
        </div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {['File', 'Edit', 'View', 'Tools'].map((item) => (
            <button
              key={item}
              className="px-3 py-1.5 rounded hover:bg-editor-hover hover:text-foreground transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1">
        {/* 替换为显示设置对话框触发器 */}
        <DisplaySettingsDialog />
        
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Undo (Ctrl+Z)">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
        <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>
    </header>
  );
}