// src/app/store/slices/pageCoordinateSlice.ts

import {
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

import type { RootState } from '../index';

import type {
  EngineeringUnit,
} from '@/core/coordinate/engineeringScale';

import {
  createDefaultPageCoordinateSystem,
  sanitizePageCoordinateSystem,
  type PageCoordinateSystem,
} from '@/core/coordinate/pageCoordinateSystem';

export interface PageCoordinateState {
  pages: Record<
    number,
    PageCoordinateSystem
  >;

  /**
   * When true, the next click on the PDF
   * canvas becomes the page engineering origin.
   */
  originMode: boolean;
}

const initialState: PageCoordinateState = {
  pages: {},

  originMode: false,
};

export const pageCoordinateSlice =
  createSlice({
    name: 'pageCoordinate',

    initialState,

    reducers: {
      ensurePage: (
        state,
        action: PayloadAction<{
          pageIndex: number;
        }>,
      ) => {
        const {
          pageIndex,
        } = action.payload;

        if (
          !state.pages[pageIndex]
        ) {
          state.pages[pageIndex] =
            createDefaultPageCoordinateSystem();
        }
      },

      setPageScale: (
        state,
        action: PayloadAction<{
          pageIndex: number;
          numerator: number;
          denominator: number;
        }>,
      ) => {
        const {
          pageIndex,
          numerator,
          denominator,
        } = action.payload;

        const current =
          state.pages[pageIndex] ??
          createDefaultPageCoordinateSystem();

        const next =
          sanitizePageCoordinateSystem({
            ...current,

            scaleNumerator:
              numerator,

            scaleDenominator:
              denominator,
          });

        state.pages[pageIndex] =
          next;
      },

      setPageUnit: (
        state,
        action: PayloadAction<{
          pageIndex: number;
          unit: EngineeringUnit;
        }>,
      ) => {
        const {
          pageIndex,
          unit,
        } = action.payload;

        const current =
          state.pages[pageIndex] ??
          createDefaultPageCoordinateSystem();

        state.pages[pageIndex] =
          sanitizePageCoordinateSystem({
            ...current,
            unit,
          });
      },

      setPageOrigin: (
        state,
        action: PayloadAction<{
          pageIndex: number;
          x: number;
          y: number;
        }>,
      ) => {
        const {
          pageIndex,
          x,
          y,
        } = action.payload;

        const current =
          state.pages[pageIndex] ??
          createDefaultPageCoordinateSystem();

        state.pages[pageIndex] =
          sanitizePageCoordinateSystem({
            ...current,

            origin: {
              x,
              y,
            },

            engineeringOrigin: {
              x: 0,
              y: 0,
            },
          });

        state.originMode =
          false;
      },

      setEngineeringOrigin: (
        state,
        action: PayloadAction<{
          pageIndex: number;
          x: number;
          y: number;
        }>,
      ) => {
        const {
          pageIndex,
          x,
          y,
        } = action.payload;

        const current =
          state.pages[pageIndex] ??
          createDefaultPageCoordinateSystem();

        state.pages[pageIndex] =
          sanitizePageCoordinateSystem({
            ...current,

            engineeringOrigin: {
              x,
              y,
            },
          });
      },

      setOriginMode: (
        state,
        action: PayloadAction<boolean>,
      ) => {
        state.originMode =
          action.payload;
      },

      clearPageOrigin: (
        state,
        action: PayloadAction<{
          pageIndex: number;
        }>,
      ) => {
        const {
          pageIndex,
        } = action.payload;

        const current =
          state.pages[pageIndex] ??
          createDefaultPageCoordinateSystem();

        state.pages[pageIndex] =
          sanitizePageCoordinateSystem({
            ...current,

            origin: {
              x: 0,
              y: 0,
            },

            engineeringOrigin: {
              x: 0,
              y: 0,
            },
          });
      },
    },
  });

export const {
  ensurePage,
  setPageScale,
  setPageUnit,
  setPageOrigin,
  setEngineeringOrigin,
  setOriginMode,
  clearPageOrigin,
} =
  pageCoordinateSlice.actions;

export const selectPageCoordinateSystem =
  (
    state: RootState,
    pageIndex: number,
  ): PageCoordinateSystem =>
    state.pageCoordinate.pages[
      pageIndex
    ] ??
    createDefaultPageCoordinateSystem();

export const selectOriginMode =
  (state: RootState) =>
    state.pageCoordinate.originMode;

export default pageCoordinateSlice;