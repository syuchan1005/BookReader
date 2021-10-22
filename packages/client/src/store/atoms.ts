/* eslint-disable import/prefer-default-export */
import { atom, selector } from 'recoil';
import { localStorageEffect, logEffect } from '@client/store/effects';
import { BookInfoOrder, BookOrder } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

export const genresState = atom<string[]>({
  key: 'genresState',
  default: [],
  effects_UNSTABLE: [
    logEffect(),
  ],
});

export const bookHistoryState = atom<'SHOW' | 'HIDE' | 'ALL'>({
  key: 'historyState',
  default: 'ALL',
  effects_UNSTABLE: [
    logEffect(),
  ],
});

export const themeState = atom<'light' | 'dark'>({
  key: 'themeState',
  default: 'light',
  effects_UNSTABLE: [
    logEffect(),
  ],
});

export const primaryColorState = atom<string>({
  key: 'primaryColorState',
  default: 'green',
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('primary'),
  ],
});

export const secondaryColorState = atom<string>({
  key: 'secondaryColorState',
  default: 'blue',
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('secondary'),
  ],
});

export const sortOrderState = atom<BookInfoOrder>({
  key: 'sortOrderState',
  default: BookInfoOrder.UpdateNewest,
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('sortOrder'),
  ],
});

export const sortBookOrderState = atom<BookOrder>({
  key: 'sortBookOrderState',
  default: BookOrder.NumberAsc,
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('sortBookOrder'),
  ],
});

export const ReadOrder = {
  LTR: 'LTR',
  RTL: 'RTL',
} as const;
export type ReadOrderType = typeof ReadOrder[keyof typeof ReadOrder];

export const readOrderState = atom<ReadOrderType>({
  key: 'readOrderState',
  default: ReadOrder.RTL,
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('readOrder'),
  ],
});

export const showOriginalImageState = atom<boolean>({
  key: 'showOriginalImageState',
  default: false,
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('showOriginalImage'),
  ],
});

export const showBookInfoNameState = atom<boolean>({
  key: 'showBookInfoNameState',
  default: false,
  effects_UNSTABLE: [
    logEffect(),
    localStorageEffect('showBookInfoName'),
  ],
});

export const alertOpenState = atom<boolean>({
  key: 'alertOpenState',
  default: false,
  effects_UNSTABLE: [
    logEffect(),
  ],
});

type AlertData = {
  message: string,
  variant: 'warning' | 'error',
  persist?: boolean,
};

export const innerAlertDataState = atom<AlertData>({
  key: 'innerAlertDataState',
  default: undefined,
  effects_UNSTABLE: [
    logEffect(),
  ],
});

export const alertDataState = selector<AlertData>({
  key: 'alertDataState',
  get: ({ get }) => {
    if (get(alertOpenState)) {
      return get(innerAlertDataState);
    }
    return undefined;
  },
  set: ({ set }, value) => {
    if (value) {
      set(innerAlertDataState, value);
    }
    set(alertOpenState, !!value);
  },
});

type Position = { index: number, block: 'start' | 'end' };
export const homeLastSeenBookPosition = atom<Position | undefined>({
  key: 'homeLastSeenBookPosition',
  default: undefined,
  effects_UNSTABLE: [
    logEffect(),
  ],
});
