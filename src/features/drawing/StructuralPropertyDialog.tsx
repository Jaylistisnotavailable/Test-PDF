import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAppDispatch } from '@/app/store/hooks';

import {
  updateShape,
} from '@/app/store/slices/drawingSlice';

import type {
  StructuralElement,
} from './elements/elementTypes';

import {
  mmToPageUnits,
  pageUnitsToMm,
} from './elements/elementDefaults';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  element: StructuralElement | null;

  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  /**
   * Current architectural drawing scale.
   *
   * Example:
   * 1:100 -> 100
   * 1:50  -> 50
   */
  scaleDenominator?: number;
}

type DraftValues =
  Record<string, string>;

const GEOMETRY_DIMENSION_FIELDS =
  new Set([
    'width',
    'depth',
    'thickness',
    'height',
    'columnWidth',
    'columnDepth',
    'beamWidth',
    'beamDepth',
  ]);

const NUMERIC_PROPERTY_FIELDS =
  new Set([
    'thickness',
  ]);

const ROTATION_FIELDS =
  new Set([
    'rotation',
  ]);

function roundEngineeringValue(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  /**
   * Engineering dimensions are normally best shown
   * to 2 decimal places.
   */
  return Math.round(
    value * 100,
  ) / 100;
}

function getFields(
  element: StructuralElement,
): string[] {
  switch (element.type) {
    case 'column':
      return [
        'label',
        'width',
        'depth',
        'rotation',
        'section',
        'material',
      ];

    case 'beam':
      return [
        'label',
        'width',
        'depth',
        'section',
        'material',
      ];

    case 'wall':
      return [
        'label',
        'thickness',
        'wallType',
        'material',
      ];

    case 'slab':
      return [
        'label',
        'thickness',
        'level',
        'material',
      ];

    case 'portalFrame':
      return [
        'label',
        'height',
        'columnWidth',
        'columnDepth',
        'beamWidth',
        'beamDepth',
        'section',
        'material',
      ];

    default:
      return [
        'label',
      ];
  }
}

/**
 * Build the editable draft from the actual structural
 * element.
 *
 * IMPORTANT:
 *
 * Geometry is stored in PDF page units.
 * The property dialog displays engineering dimensions in mm.
 */
function getDraftFromElement(
  element: StructuralElement,
  scaleDenominator: number,
): DraftValues {
  const geometry =
    element.geometry as any;

  const properties =
    element.properties as any;

  const data: Record<
    string,
    unknown
  > = {
    label: element.label,
    ...properties,
  };

  switch (element.type) {
    case 'column':
      Object.assign(data, {
        width: roundEngineeringValue(
          pageUnitsToMm(
            geometry.width,
            scaleDenominator,
          ),
        ),

        depth: roundEngineeringValue(
          pageUnitsToMm(
            geometry.depth,
            scaleDenominator,
          ),
        ),

        rotation:
          geometry.rotation ?? 0,
      });

      break;

    case 'beam':
      Object.assign(data, {
        width: roundEngineeringValue(
          pageUnitsToMm(
            geometry.width,
            scaleDenominator,
          ),
        ),

        depth: roundEngineeringValue(
          pageUnitsToMm(
            geometry.depth,
            scaleDenominator,
          ),
        ),
      });

      break;

    case 'wall':
      Object.assign(data, {
        thickness: roundEngineeringValue(
          pageUnitsToMm(
            geometry.thickness,
            scaleDenominator,
          ),
        ),
      });

      break;

    case 'slab':
      /**
       * Slab thickness is already stored as an
       * engineering value in the current data model.
       */
      Object.assign(data, {
        thickness:
          properties.thickness ?? 150,

        level:
          properties.level ?? 'Level 1',
      });

      break;

    case 'portalFrame':
      Object.assign(data, {
        height: roundEngineeringValue(
          pageUnitsToMm(
            geometry.height,
            scaleDenominator,
          ),
        ),

        columnWidth:
          roundEngineeringValue(
            pageUnitsToMm(
              geometry.columnWidth,
              scaleDenominator,
            ),
          ),

        columnDepth:
          roundEngineeringValue(
            pageUnitsToMm(
              geometry.columnDepth,
              scaleDenominator,
            ),
          ),

        beamWidth:
          roundEngineeringValue(
            pageUnitsToMm(
              geometry.beamWidth,
              scaleDenominator,
            ),
          ),

        beamDepth:
          roundEngineeringValue(
            pageUnitsToMm(
              geometry.beamDepth,
              scaleDenominator,
            ),
          ),
      });

      break;
  }

  return Object.fromEntries(
    Object.entries(data).map(
      ([key, value]) => [
        key,
        String(
          value ?? '',
        ),
      ],
    ),
  );
}

function parseNumber(
  value: string,
): number | null {
  if (
    value.trim() === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}

function formatFieldName(
  field: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    label: 'Label',
    width: 'Width',
    depth: 'Depth',
    thickness: 'Thickness',
    height: 'Height',
    rotation: 'Rotation',
    columnWidth: 'Column Width',
    columnDepth: 'Column Depth',
    beamWidth: 'Beam Width',
    beamDepth: 'Beam Depth',
    section: 'Section',
    material: 'Material',
    wallType: 'Wall Type',
    level: 'Level',
  };

  return (
    labels[field] ??
    field
  );
}

function fieldUnit(
  field: string,
): string {
  if (
    GEOMETRY_DIMENSION_FIELDS.has(
      field,
    ) ||
    NUMERIC_PROPERTY_FIELDS.has(
      field,
    )
  ) {
    return 'mm';
  }

  if (
    ROTATION_FIELDS.has(
      field,
    )
  ) {
    return '°';
  }

  return '';
}

export function StructuralPropertyDialog({
  element,
  open,
  onOpenChange,
  scaleDenominator = 100,
}: Props) {
  const dispatch =
    useAppDispatch();

  const [
    draft,
    setDraft,
  ] = useState<DraftValues>({});

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  /**
   * Initialise the draft only when the actual
   * element being edited changes.
   *
   * Do NOT depend on the Redux shapes array.
   *
   * This prevents Apply from reopening the dialog.
   */
  useEffect(() => {
    if (!element) {
      setDraft({});
      setError(null);
      return;
    }

    setDraft(
      getDraftFromElement(
        element,
        scaleDenominator,
      ),
    );

    setError(null);
  }, [
    element?.id,
    scaleDenominator,
  ]);

  const fields =
    useMemo(
      () =>
        element
          ? getFields(element)
          : [],
      [element?.type],
    );

  const closeDialog =
    () => {
      setError(null);
      onOpenChange(false);
    };

  const handleCancel =
    () => {
      closeDialog();
    };

  const handleApply =
    () => {
      if (!element) {
        closeDialog();
        return;
      }

      const geometry: any = {
        ...(element.geometry as any),
      };

      const properties: any = {
        ...(element.properties as any),
      };

      for (
        const field of fields
      ) {
        if (
          field === 'label'
        ) {
          continue;
        }

        const value =
          draft[field] ?? '';

        /**
         * Geometry dimensions:
         *
         * UI = mm
         * Storage = PDF page units
         */
        if (
          GEOMETRY_DIMENSION_FIELDS.has(
            field,
          ) &&
          field in geometry
        ) {
          const numericValue =
            parseNumber(value);

          if (
            numericValue === null ||
            numericValue < 0
          ) {
            setError(
              `${formatFieldName(field)} must be a valid non-negative number.`,
            );

            return;
          }

          geometry[field] =
            mmToPageUnits(
              numericValue,
              scaleDenominator,
            );

          continue;
        }

        /**
         * Rotation remains degrees.
         */
        if (
          ROTATION_FIELDS.has(
            field,
          ) &&
          field in geometry
        ) {
          const numericValue =
            parseNumber(value);

          if (
            numericValue === null
          ) {
            setError(
              'Rotation must be a valid number.',
            );

            return;
          }

          geometry[field] =
            numericValue;

          continue;
        }

        /**
         * Properties.
         *
         * Slab thickness is currently stored directly
         * as engineering mm, so it is NOT converted.
         */
        if (
          field in properties
        ) {
          if (
            NUMERIC_PROPERTY_FIELDS.has(
              field,
            )
          ) {
            const numericValue =
              parseNumber(value);

            if (
              numericValue === null ||
              numericValue < 0
            ) {
              setError(
                `${formatFieldName(field)} must be a valid non-negative number.`,
              );

              return;
            }

            properties[field] =
              numericValue;
          } else {
            properties[field] =
              value;
          }
        }
      }

      const label =
        draft.label?.trim() ||
        element.label;

      properties.label =
        label;

      /**
       * One Redux update.
       *
       * The parent dialog state is deliberately
       * independent from the updated Redux object.
       */
      dispatch(
        updateShape({
          id: element.id,
          changes: {
            label,
            geometry,
            properties,
          },
        }),
      );

      /**
       * Close immediately.
       */
      closeDialog();
    };

  if (!element) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[680px]"
        onEscapeKeyDown={() => {
          closeDialog();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {formatFieldName(
              element.type,
            )}{' '}
            Properties
          </DialogTitle>

          <div className="text-xs text-muted-foreground">
            Drawing scale: 1:
            {scaleDenominator}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-3">
          {fields.map(
            (field) => {
              const isNumeric =
                GEOMETRY_DIMENSION_FIELDS.has(
                  field,
                ) ||
                NUMERIC_PROPERTY_FIELDS.has(
                  field,
                ) ||
                ROTATION_FIELDS.has(
                  field,
                );

              const unit =
                fieldUnit(field);

              return (
                <div
                  key={field}
                  className="space-y-1.5"
                >
                  <label
                    htmlFor={`property-${element.id}-${field}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {formatFieldName(
                      field,
                    )}
                  </label>

                  <div className="relative">
                    <Input
                      id={`property-${element.id}-${field}`}
                      type={
                        isNumeric
                          ? 'number'
                          : 'text'
                      }
                      value={
                        draft[field] ??
                        ''
                      }
                      min={
                        isNumeric
                          ? 0
                          : undefined
                      }
                      step={
                        isNumeric
                          ? 'any'
                          : undefined
                      }
                      className={
                        unit
                          ? 'pr-12'
                          : undefined
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event.target
                            .value;

                        setDraft(
                          (current) => ({
                            ...current,
                            [field]:
                              value,
                          }),
                        );

                        if (error) {
                          setError(
                            null,
                          );
                        }
                      }}
                    />

                    {unit && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={
              handleCancel
            }
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={
              handleApply
            }
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}