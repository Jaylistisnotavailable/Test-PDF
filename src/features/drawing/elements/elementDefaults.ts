import type { ElementStyle, StructuralElementType } from './elementTypes';

export const STRUCTURAL_DEFAULTS = {
  column: { width: 300, depth: 300, rotation: 0, section: '300×300', material: 'Concrete' },
  beam: { width: 300, depth: 450, section: '300×450', material: 'Concrete' },
  wall: { thickness: 200, wallType: 'Structural', material: 'Concrete' },
  slab: { thickness: 150, level: 'Level 1', material: 'Concrete' },
  portalFrame: {
    height: 4000, columnWidth: 300, columnDepth: 300,
    beamWidth: 300, beamDepth: 450, section: '300×450', material: 'Steel'
  },
} as const;

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  color: '#2563eb',
  strokeWidth: 2,
  opacity: 1,
  fillColor: 'transparent',
  fillOpacity: 0.15,
};

export const prefixForType = (type: StructuralElementType): string => ({
  column: 'C',
  beam: 'B',
  wall: 'W',
  slab: 'S',
  portalFrame: 'PF',
}[type]);

export const structuralTypeLabel = (type: StructuralElementType): string => ({
  column: 'Columns',
  beam: 'Beams',
  wall: 'Walls',
  slab: 'Slabs',
  portalFrame: 'Portal Frames',
}[type]);
