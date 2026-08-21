// src/core/coordinate/pageCoordinateSystem.ts

// This module defines the coordinate system for PDF pages, including the drawing scale, engineering unit, origin point on the PDF page, and the corresponding engineering origin in millimeters. It provides functions to convert between PDF page points and engineering coordinates, as well as formatting functions for displaying coordinates and scales.
// The coordinate system is defined by the PageCoordinateSystem interface, which includes the scale numerator and denominator, the engineering unit, the origin point on the PDF page, and the engineering origin in millimeters. The module also provides default values for the coordinate system and functions to sanitize and create coordinate systems.
// The module also provides functions to convert between PDF page points and engineering coordinates, taking into account the drawing scale and engineering unit. The conversion functions handle the differences in coordinate systems, such as the direction of the Y-axis, and provide formatted output for display purposes.
// The module also provides functions to format the drawing scale and engineering coordinates for display purposes, taking into account the specified number of decimal places and the engineering unit. The formatted output can be used for displaying coordinates and scales in a user interface or for generating reports.
// The module also provides functions to sanitize and validate the drawing scale, ensuring that the scale values are finite and positive. The sanitized scale values are used in the conversion functions to ensure accurate conversions between PDF page points and engineering coordinates.
// 这个模块定义了 PDF 页面坐标系，包括绘图比例、工程单位、PDF 页面上的原点以及对应的工程原点（以毫米为单位）。它提供了在 PDF 页面点和工程坐标之间进行转换的函数，以及用于显示坐标和比例的格式化函数。
// 坐标系由 PageCoordinateSystem 接口定义，该接口包括比例分子和分母、工程单位、PDF 页面上的原点以及以毫米为单位的工程原点。该模块还提供了坐标系的默认值以及用于清理和创建坐标系的函数。
// 该模块还提供了在 PDF 页面点和工程坐标之间进行转换的函数，考虑到绘图比例和工程单位。转换函数处理坐标系之间的差异，例如 Y 轴的方向，并提供用于显示目的的格式化输出。
// 该模块还提供了用于格式化绘图比例和工程坐标的函数，考虑到指定的小数位数和工程单位。格式化输出可用于在用户界面中显示坐标和比例，或用于生成报告。
// 该模块还提供了用于清理和验证绘图比例的函数，确保比例值是有限且正数。清理后的比例
import {
  EngineeringUnit,
  engineeringUnitToMm,
  mmToEngineeringUnit,
  pagePtToRealMm,
  realMmToPagePt,
  sanitizeScale,
} from './engineeringScale';

// Interface for defining the origin point on the PDF page in PDF points.
// This represents the PDF page coordinate that corresponds to the engineering origin.
// 定义 PDF 页面上的原点接口，单位为 PDF 点。表示与工程原点对应的 PDF 页面坐标。
export interface PageOrigin {
  /**
   * PDF page coordinate in PDF points.
   * PDF coordinate:
   *   X → right
   *   Y → down
   */
  x: number;
  y: number;
}

// Interface for defining the engineering origin in millimeters.
// This represents the engineering coordinate that corresponds to the PDF page origin.
// 定义工程原点的接口，单位为毫米。表示与 PDF 页面原点对应的工程坐标。
export interface EngineeringOrigin {
  /**
   * Engineering coordinate assigned to the PDF base point.
   * Normally:
   *   x = 0
   *   y = 0
   * Units are millimetres.
   */
  x: number;
  y: number;
}

// Interface for defining the coordinate system for PDF pages
// This includes the drawing scale, engineering unit, origin point on the PDF page, and the corresponding engineering origin in millimeters.
// 定义 PDF 页面坐标系的接口，包括绘图比例、工程单位、PDF 页面上的原点以及对应的工程原点（以毫米为单位）。
export interface PageCoordinateSystem {
  /**
   * Drawing scale:
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
   * Stored in mm.
   */
  engineeringOrigin: EngineeringOrigin;
}

// Default coordinate system for PDF pages, with a scale of 1:100, engineering unit of millimeters, and origin at (0, 0) for both PDF page and engineering coordinates.
// PDF 页面默认坐标系，比例为 1:100，工程单位为毫米，PDF 页面和工程坐标的原点均为 (0, 0)。
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

// Function to create a default PageCoordinateSystem with specified scale and unit, or using default values if not provided.
// 创建默认的 PageCoordinateSystem，使用指定的比例和单位，如果未提供则使用默认值。
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

// Function to sanitize a PageCoordinateSystem, ensuring that all values are finite and valid, and returning a new PageCoordinateSystem with sanitized values.
// 清理 PageCoordinateSystem，确保所有值都是有限且有效的，并返回一个具有清理后值的新 PageCoordinateSystem。
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
 * 把 PDF 页面点转换为工程毫米。
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
 * 把工程毫米转换为 PDF 页面点。
 * PDF:
 *   X positive right
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

/**
 * Convert PDF page point → engineering unit.
 * 把 PDF 页面点转换为工程单位。
 * @param pagePoint 
 * @param coordinateSystem 
 * @returns
 */

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

/**
 * Convert engineering unit → PDF page point.
 * 把工程单位转换为 PDF 页面点。
 * @param engineeringPoint 
 * @param coordinateSystem 
 * @returns 
 */
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

/**
 * Format engineering coordinate for display.
 * 格式化工程坐标以供显示。
 * @param pagePoint 
 * @param coordinateSystem 
 * @param decimals 
 * @returns 
 */
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

/**
 * Format the drawing scale for display.
 * 格式化绘图比例以供显示。
 * @param coordinateSystem 
 * @returns 
 */
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