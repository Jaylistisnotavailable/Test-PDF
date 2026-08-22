import React from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  toggleShowElementLabels,
  toggleShowElementSections,
  toggleDimPdfBackground,
} from '@/app/store/slices/uiSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react';

export function DisplaySettingsDialog() {
  const dispatch = useAppDispatch();
  const showElementLabels = useAppSelector((s) => s.ui.showElementLabels);
  const showElementSections = useAppSelector((s) => s.ui.showElementSections);
  const dimPdfBackground = useAppSelector((s) => s.ui.dimPdfBackground);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="h-8 w-8 rounded flex items-center justify-center hover:bg-editor-hover text-muted-foreground hover:text-foreground transition-colors"
          title="Display Settings"
        >
          <Eye className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Display Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-labels" className="text-sm font-medium">
              Show Element Labels (Nodes, Columns, Beams, Walls)
            </Label>
            <Switch
              id="show-labels"
              checked={showElementLabels}
              onCheckedChange={() => dispatch(toggleShowElementLabels())}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-sections" className="text-sm font-medium">
              Show Element Sections
            </Label>
            <Switch
              id="show-sections"
              checked={showElementSections}
              onCheckedChange={() => dispatch(toggleShowElementSections())}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dim-pdf" className="text-sm font-medium">
              Dim PDF Background
            </Label>
            <Switch
              id="dim-pdf"
              checked={dimPdfBackground}
              onCheckedChange={() => dispatch(toggleDimPdfBackground())}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}