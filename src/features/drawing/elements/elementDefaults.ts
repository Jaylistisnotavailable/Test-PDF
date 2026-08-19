import type {
  ElementStyle,
  StructuralElementType,
} from './elementTypes';

/**
 * Architectural drawing scale.
 *
 * The drawing model uses PDF page points.
 *
 * 1 inch = 72 pt
 * 1 inch = 25.4 mm
 *
 * Therefore:
 *
 * pageUnits = realMm / scaleDenominator * 72 / 25.4
 */
export const DEFAULT_PLAN_SCALE = 100;

export const MM_TO_PT = 72 / 25.4;

/**
 * Convert a real engineering dimension in mm
 * to PDF page units for the specified drawing scale.
 *
 * Example:
 *
 * 90 mm @ 1:100
 *
 * = 90 / 100 * 72 / 25.4
 * = 2.55118 pt
 */
export function mmToPageUnits(
  mm: number,
  scaleDenominator: number = DEFAULT_PLAN_SCALE,
): number {
  if (!Number.isFinite(mm)) {
    return 0;
  }

  if (
    !Number.isFinite(scaleDenominator) ||
    scaleDenominator <= 0
  ) {
    return 0;
  }

  return (
    (mm / scaleDenominator) *
    MM_TO_PT
  );
}

/**
 * Convert PDF page units back to real engineering
 * millimetres.
 *
 * Example:
 *
 * 2.55118 pt @ 1:100
 *
 * = 90 mm
 */
export function pageUnitsToMm(
  pageUnits: number,
  scaleDenominator: number = DEFAULT_PLAN_SCALE,
): number {
  if (!Number.isFinite(pageUnits)) {
    return 0;
  }

  if (
    !Number.isFinite(scaleDenominator) ||
    scaleDenominator <= 0
  ) {
    return 0;
  }

  return (
    (pageUnits / MM_TO_PT) *
    scaleDenominator
  );
}

/**
 * Default structural engineering dimensions.
 *
 * IMPORTANT:
 *
 * `real...` values are engineering dimensions in mm.
 *
 * `...` geometry values are generated for the default
 * 1:100 drawing scale and are suitable for the canvas.
 */
export const STRUCTURAL_DEFAULTS = {
  column: {
    realWidth: 90,
    realDepth: 90,

    width: mmToPageUnits(90),
    depth: mmToPageUnits(90),

    rotation: 0,

    section: '90×90',
    material: 'Concrete',
  },

  beam: {
    realWidth: 90,
    realDepth: 450,

    width: mmToPageUnits(90),
    depth: mmToPageUnits(450),

    section: '90×450',
    material: 'Concrete',
  },

  wall: {
    realThickness: 190,

    thickness: mmToPageUnits(190),

    wallType: 'Structural',
    material: 'Concrete',
  },

  slab: {
    realThickness: 150,

    thickness: 150,

    level: 'Level 1',
    material: 'Concrete',
  },

  portalFrame: {
    realHeight: 4000,

    realColumnWidth: 90,
    realColumnDepth: 90,

    realBeamWidth: 90,
    realBeamDepth: 450,

    height: mmToPageUnits(4000),

    columnWidth: mmToPageUnits(90),
    columnDepth: mmToPageUnits(90),

    beamWidth: mmToPageUnits(90),
    beamDepth: mmToPageUnits(450),

    section: '90×450',
    material: 'Steel',
  },
} as const;

/**
 * Default structural element visual style.
 */
export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  color: '#2563eb',
  strokeWidth: 1.5,
  opacity: 1,
  fillColor: 'transparent',
  fillOpacity: 0.12,
};

/**
 * Dedicated colours.
 */
export const ELEMENT_COLORS = {
  column: '#2563eb',
  beam: '#2563eb',
  wall: '#7c3aed',
  wallCenterline: '#7c3aed',

  portalColumn: '#2563eb',
  portalBeam: '#dc2626',
} as const;

export const prefixForType = (
  type: StructuralElementType,
): string => ({
  column: 'C',
  beam: 'B',
  wall: 'W',
  slab: 'S',
  portalFrame: 'PF',
}[type]);

export const structuralTypeLabel = (
  type: StructuralElementType,
): string => ({
  column: 'Columns',
  beam: 'Beams',
  wall: 'Walls',
  slab: 'Slabs',
  portalFrame: 'Portal Frames',
}[type]);