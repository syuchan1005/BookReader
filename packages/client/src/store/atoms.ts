import {
  BookInfoOrder,
  BookOrder,
  SearchMode,
} from '@syuchan1005/book-reader-graphql';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Helper to create localStorage atom with the same key structure as before
const createLocalStorageAtom = <T>(key: string, initialValue: T) => {
  return atomWithStorage<T>(`state-persist.${key}`, initialValue, {
    getItem: (key) => {
      const storageKey = 'state-persist';
      const loadJsonString = localStorage.getItem(storageKey);
      if (loadJsonString !== null) {
        const savedValue =
          JSON.parse(loadJsonString)[key.replace(`${storageKey}.`, '')];
        if (savedValue != null) {
          return savedValue;
        }
      }
      return initialValue;
    },
    setItem: (key, newValue) => {
      const storageKey = 'state-persist';
      const stateKey = key.replace(`${storageKey}.`, '');
      const jsonString = localStorage.getItem(storageKey);
      const json = jsonString === null ? {} : JSON.parse(jsonString);
      json[stateKey] = newValue;
      localStorage.setItem(storageKey, JSON.stringify(json));
    },
    removeItem: (key) => {
      const storageKey = 'state-persist';
      const stateKey = key.replace(`${storageKey}.`, '');
      const jsonString = localStorage.getItem(storageKey);
      if (jsonString !== null) {
        const json = JSON.parse(jsonString);
        delete json[stateKey];
        localStorage.setItem(storageKey, JSON.stringify(json));
      }
    },
  });
};

export const genresState = atom<string[]>([]);

export const searchModeState = createLocalStorageAtom<SearchMode>(
  'searchMode',
  SearchMode.Database,
);

export const themeState = atom<'light' | 'dark'>('light');

export const primaryColorState = createLocalStorageAtom<string>(
  'primary',
  'green',
);

export const secondaryColorState = createLocalStorageAtom<string>(
  'secondary',
  'blue',
);

export const sortOrderState = createLocalStorageAtom<BookInfoOrder>(
  'sortOrder',
  BookInfoOrder.UpdateNewest,
);

export const sortBookOrderState = createLocalStorageAtom<BookOrder>(
  'sortBookOrder',
  BookOrder.NumberAsc,
);

export const ReadOrder = {
  LTR: 'LTR',
  RTL: 'RTL',
} as const;
export type ReadOrderType = (typeof ReadOrder)[keyof typeof ReadOrder];

export const readOrderState = createLocalStorageAtom<ReadOrderType>(
  'readOrder',
  ReadOrder.RTL,
);

export const showOriginalImageState = createLocalStorageAtom<boolean>(
  'showOriginalImage',
  false,
);

export const pageImageEffectState = createLocalStorageAtom<
  PageImageEffect | undefined
>('pageImageEffectState', undefined);

export type PageImageEffectType = 'paper' | 'dark';
export type PageImageEffect = {
  type: PageImageEffectType;
  percent: number; // 0-100
};

export const showBookInfoNameState = createLocalStorageAtom<boolean>(
  'showBookInfoName',
  false,
);

export const alertOpenState = atom<boolean>(false);

export type AlertData = {
  message: string;
  variant: 'warning' | 'error';
  persist?: boolean;
};

export const innerAlertDataState = atom<AlertData | undefined>();

export const alertDataState = atom(
  (get) => {
    if (get(alertOpenState)) {
      return get(innerAlertDataState);
    }
    return undefined;
  },
  (_get, set, value: AlertData | undefined) => {
    if (value) {
      set(innerAlertDataState, value);
    }
    set(alertOpenState, !!value);
  },
);

type Position = { index: number; block: 'start' | 'end' };
export const homeLastSeenBookPosition = atom<Position | undefined>();
