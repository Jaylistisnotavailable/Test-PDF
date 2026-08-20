import type { ToolContext } from './BaseTool';
import type { StructuralElementType } from '../elements/elementTypes';
import {
  DEFAULT_ELEMENT_STYLE,
  getStructuralDefaults,
  prefixForType,
} from '../elements/elementDefaults';

export function makeBase(ctx: ToolContext, type: StructuralElementType, geometry: any) {
  const state = ctx.getState();
  const drawing = state.drawing;

  return {
    id: 'temp',
    type,
    pageIndex: state.pdf.currentPage,
    layerId: state.layer.activeLayerId,
    geometry,
    properties: {} as any,
    style: {
      ...DEFAULT_ELEMENT_STYLE,
      color: drawing.currentStrokeColor,
      strokeWidth: drawing.currentStrokeWidth,
      opacity: drawing.currentOpacity,
      fillColor: drawing.currentFillColor,
    },
    label: '',
    createdAt: '',
    updatedAt: '',
    zIndex: 0,
  } as any;
}

export function structuralDefaults(type: StructuralElementType, scaleDenominator: number, scaleNumerator = 1) {
  return getStructuralDefaults(scaleDenominator, scaleNumerator)[type];
}

export function ensureLabel(ctx: ToolContext, type: StructuralElementType) {
  const state = ctx.getState();
  const prefix = prefixForType(type);
  const used = state.drawing.shapes
    .filter((s: any) => s.type === type)
    .map((s: any) => s.label as string);

  let i = 1;
  while (used.includes(`${prefix}-${String(i).padStart(3, '0')}`)) i++;
  return `${prefix}-${String(i).padStart(3, '0')}`;
}
