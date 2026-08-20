// src/core/coordinate/pageCoordinateSystem.ts

import type {
  EngineeringUnit,
} from './engineeringScale';

import {
  engineeringUnitToMm,
  mmToEngineeringUnit,
  pagePtToRealMm,
  realMmToPagePt,
  sanitizeScale,
} from './engineeringScale';

export interface PageOrigin {
  /**
   * PDF page coordinate in PDF points.
   *
   * PDF coordinate:
   *   X → right
   *   Y → down
   */
  x: number;
  y: number;
}

export interface EngineeringOrigin {
  /**
   * Engineering coordinate assigned to the PDF base point.
   *
   * Normally:
   *   x = 0
   *   y = 0
   *
   * Units are millimetres.
   */
  x: number;
  y: number;
}

export interface PageCoordinateSystem {
  /**
   * Drawing scale:
   *
   * 1:N
   */
  scaleNumerator: number;
  scaleDenominator: number;

  /**
   * Engineering display unit.
   */
  unit: EngineeringUnit;

  /**
   * PDF page point used as the engineering coordinate origin.
   */
  origin: PageOrigin;

  /**
   * Engineering coordinate assigned to origin.
   *
   * Stored in mm.
   */
  engineeringOrigin: EngineeringOrigin;
}

export const DEFAULT_PAGE_COORDINATE_SYSTEM: PageCoordinateSystem = {
  scaleNumerator: 1,
  scaleDenominator: 100,
  unit: 'mm',

  origin: {
    x: 0,
    y: 0,
  },

  engineeringOrigin: {
    x: 0,
    y: 0,
  },
};

export function createDefaultPageCoordinateSystem(
  scaleDenominator = 100,
  scaleNumerator = 1,
  unit: EngineeringUnit = 'mm',
): PageCoordinateSystem {
  const scale = sanitizeScale(
    scaleNumerator,
    scaleDenominator,
  );

  return {
    scaleNumerator: scale.numerator,
    scaleDenominator: scale.denominator,
    unit,

    origin: {
      x: 0,
      y: 0,
    },

    engineeringOrigin: {
      x: 0,
      y: 0,
    },
  };
}

export function sanitizePageCoordinateSystem(
  value?: Partial<PageCoordinateSystem>,
): PageCoordinateSystem {
  const scale = sanitizeScale(
    value?.scaleNumerator ?? 1,
    value?.scaleDenominator ?? 100,
  );

  const origin = value?.origin ?? {
    x: 0,
    y: 0,
  };

  const engineeringOrigin =
    value?.engineeringOrigin ?? {
      x: 0,
      y: 0,
    };

  const unit =
    value?.unit === 'm' ||
    value?.unit === 'cm' ||
    value?.unit === 'mm'
      ? value.unit
      : 'mm';

  return {
    scaleNumerator: scale.numerator,
    scaleDenominator: scale.denominator,
    unit,

    origin: {
      x: Number.isFinite(origin.x)
        ? origin.x
        : 0,

      y: Number.isFinite(origin.y)
        ? origin.y
        : 0,
    },

    engineeringOrigin: {
      x: Number.isFinite(engineeringOrigin.x)
        ? engineeringOrigin.x
        : 0,

      y: Number.isFinite(engineeringOrigin.y)
        ? engineeringOrigin.y
        : 0,
    },
  };
}

/**
 * Convert PDF page point → engineering millimetres.
 *
 * PDF:
 *   X positive right
 *   Y positive down
 *
 * Engineering:
 *   X positive right
 *   Y positive UP
 */
export function pagePointToEngineeringMm(
  pagePoint: { x: number; y: number },
  coordinateSystem: PageCoordinateSystem,
): { x: number; y: number } {
  const cs = sanitizePageCoordinateSystem(
    coordinateSystem,
  );

  const dxPage =
    pagePoint.x -
    cs.origin.x;

  const dyPage =
    pagePoint.y -
    cs.origin.y;

  const dxMm =
    pagePtToRealMm(
      dxPage,
      cs.scaleNumerator,
      cs.scaleDenominator,
    );

  const dyMm =
    pagePtToRealMm(
      dyPage,
      cs.scaleNumerator,
      cs.scaleDenominator,
    );

  return {
    x:
      cs.engineeringOrigin.x +
      dxMm,

    /*
     * PDF Y is down.
     * Engineering Y is up.
     */
    y:
      cs.engineeringOrigin.y -
      dyMm,
  };
}

/**
 * Convert engineering millimetres → PDF page point.
 */
export function engineeringMmToPagePoint(
  engineeringPoint: { x: number; y: number },
  coordinateSystem: PageCoordinateSystem,
): { x: number; y: number } {
  const cs = sanitizePageCoordinateSystem(
    coordinateSystem,
  );

  const dxMm =
    engineeringPoint.x -
    cs.engineeringOrigin.x;

  const dyMm =
    engineeringPoint.y -
    cs.engineeringOrigin.y;

  const dxPage =
    realMmToPagePt(
      dxMm,
      cs.scaleNumerator,
      cs.scaleDenominator,
    );

  const dyPage =
    realMmToPagePt(
      dyMm,
      cs.scaleNumerator,
      cs.scaleDenominator,
    );

  return {
    x:
      cs.origin.x +
      dxPage,

    /*
     * Engineering Y is up.
     * PDF Y is down.
     */
    y:
      cs.origin.y -
      dyPage,
  };
}

export function pagePointToEngineeringUnit(
  pagePoint: { x: number; y: number },
  coordinateSystem: PageCoordinateSystem,
): { x: number; y: number } {
  const mm =
    pagePointToEngineeringMm(
      pagePoint,
      coordinateSystem,
    );

  return {
    x: mmToEngineeringUnit(
      mm.x,
      coordinateSystem.unit,
    ),

    y: mmToEngineeringUnit(
      mm.y,
      coordinateSystem.unit,
    ),
  };
}

export function engineeringUnitToPagePoint(
  engineeringPoint: { x: number; y: number },
  coordinateSystem: PageCoordinateSystem,
): { x: number; y: number } {
  const mm = {
    x: engineeringUnitToMm(
      engineeringPoint.x,
      coordinateSystem.unit,
    ),

    y: engineeringUnitToMm(
      engineeringPoint.y,
      coordinateSystem.unit,
    ),
  };

  return engineeringMmToPagePoint(
    mm,
    coordinateSystem,
  );
}

export function formatEngineeringCoordinate(
  pagePoint: { x: number; y: number },
  coordinateSystem: PageCoordinateSystem,
  decimals?: number,
): { x: string; y: string } {
  const value =
    pagePointToEngineeringUnit(
      pagePoint,
      coordinateSystem,
    );

  const digits =
    decimals ??
    (
      coordinateSystem.unit === 'm'
        ? 3
        : coordinateSystem.unit === 'cm'
          ? 2
          : 1
    );

  return {
    x: value.x.toFixed(digits),
    y: value.y.toFixed(digits),
  };
}

export function formatDrawingScale(
  coordinateSystem: PageCoordinateSystem,
): string {
  const cs =
    sanitizePageCoordinateSystem(
      coordinateSystem,
    );

  if (cs.scaleNumerator === 1) {
    return `1:${cs.scaleDenominator}`;
  }

  return `${cs.scaleNumerator}:${cs.scaleDenominator}`;
}