/**
 * Coordinate/scale contract for the structural drawing editor.
 *
 * Persistent geometry is stored in PDF PAGE COORDINATES (PDF points, pt).
 * Display zoom is completely separate and is never used in engineering
 * length calculations.
 *
 * PDF points:
 *   72 pt = 1 in
 *   25.4 mm = 1 in
 *
 * Drawing scale 1:N means:
 *   paper length = real length / N
 *
 * Therefore:
 *   pagePt = realMm / N * 72 / 25.4
 *   realMm = pagePt * 25.4 / 72 * N
 */

export const PDF_POINTS_PER_INCH = 72;
export const MM_PER_INCH = 25.4;
export const PT_TO_MM = MM_PER_INCH / PDF_POINTS_PER_INCH;
export const MM_TO_PT = PDF_POINTS_PER_INCH / MM_PER_INCH;

export interface DrawingScale {
  numerator: number;
  denominator: number;
}

// The Redux drawing scale is the single source of truth for the current
// engineering interpretation of PDF page coordinates. This runtime value
// exists only for renderer helpers that cannot receive Redux state directly.
let currentDrawingScale: DrawingScale = { numerator: 1, denominator: 100 };

export function setCurrentDrawingScale(numerator: number, denominator: number): void {
  currentDrawingScale = sanitizeScale(numerator, denominator);
}

export function getCurrentDrawingScale(): DrawingScale {
  return currentDrawingScale;
}

export function sanitizeScale(
  numerator: number,
  denominator: number,
): DrawingScale {
  const safeNumerator = Number.isFinite(numerator) && numerator > 0 ? numerator : 1;
  const safeDenominator = Number.isFinite(denominator) && denominator > 0 ? denominator : 100;

  return {
    numerator: safeNumerator,
    denominator: safeDenominator,
  };
}

/** Real engineering millimetres -> PDF page points. */
export function realMmToPagePt(
  realMm: number,
  numerator = 1,
  denominator = 100,
): number {
  if (!Number.isFinite(realMm)) return 0;
  const scale = sanitizeScale(numerator, denominator);
  return (realMm * scale.numerator / scale.denominator) * MM_TO_PT;
}

/** PDF page points -> real engineering millimetres. */
export function pagePtToRealMm(
  pagePt: number,
  numerator = 1,
  denominator = 100,
): number {
  if (!Number.isFinite(pagePt)) return 0;
  const scale = sanitizeScale(numerator, denominator);
  return pagePt * PT_TO_MM * scale.denominator / scale.numerator;
}

export function realMmToPageUnit(
  realMm: number,
  numerator = 1,
  denominator = 100,
): number {
  return realMmToPagePt(realMm, numerator, denominator);
}

export function pageUnitToRealMm(
  pageUnit: number,
  numerator = 1,
  denominator = 100,
): number {
  return pagePtToRealMm(pageUnit, numerator, denominator);
}

export type EngineeringUnit = 'm' | 'cm' | 'mm';

export function mmToEngineeringUnit(mm: number, unit: EngineeringUnit): number {
  if (unit === 'm') return mm / 1000;
  if (unit === 'cm') return mm / 10;
  return mm;
}

export function engineeringUnitToMm(value: number, unit: EngineeringUnit): number {
  if (unit === 'm') return value * 1000;
  if (unit === 'cm') return value * 10;
  return value;
}

export function pagePtToEngineeringUnit(
  pagePt: number,
  numerator: number,
  denominator: number,
  unit: EngineeringUnit,
): number {
  return mmToEngineeringUnit(
    pagePtToRealMm(pagePt, numerator, denominator),
    unit,
  );
}

export function engineeringUnitToPagePt(
  value: number,
  numerator: number,
  denominator: number,
  unit: EngineeringUnit,
): number {
  return realMmToPagePt(
    engineeringUnitToMm(value, unit),
    numerator,
    denominator,
  );
}

export function formatEngineeringLength(
  pagePt: number,
  numerator: number,
  denominator: number,
  unit: EngineeringUnit = 'mm',
  decimals?: number,
): string {
  const value = pagePtToEngineeringUnit(pagePt, numerator, denominator, unit);
  const digits = decimals ?? (unit === 'm' ? 3 : unit === 'cm' ? 2 : 1);
  return `${value.toFixed(digits)} ${unit}`;
}

export function isValidDrawingScale(numerator: number, denominator: number): boolean {
  return Number.isFinite(numerator) && numerator > 0 &&
    Number.isFinite(denominator) && denominator > 0;
}
