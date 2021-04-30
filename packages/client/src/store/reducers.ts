import { BookInfoOrder, BookOrder } from '@syuchan1005/book-reader-graphql';
import { loadStateFromLocalStorage, logger, saveStateToLocalStorage } from './middlewares';

export interface IState {
  [key: string]: any;
  wb: any;
  searchText: string;
  sortOrder: BookInfoOrder;
  sortBookOrder: BookOrder;
  genres: string[];
  history: 'SHOW' | 'HIDE' | 'ALL',
  theme: 'light' | 'dark';
  primary: string;
  secondary: string;
  webp: boolean;
  readOrder: number;
  showOriginalImage: boolean;
  showBookInfoName: boolean;
}

export const initialState: IState = {
  wb: undefined,
  webp: false,
  searchText: '',
  sortOrder: BookInfoOrder.UpdateNewest,
  sortBookOrder: BookOrder.NumberAsc,
  genres: [],
  history: 'ALL',
  theme: 'light',
  primary: 'green',
  secondary: 'blue',
  readOrder: 1, // LtoR, RtoL
  showBookInfoName: false,
  showOriginalImage: false,
};

const properties = [
  'sortOrder',
  'sortBookOrder',
  'theme',
  'primary',
  'secondary',
  'readOrder',
  'showBookInfoName',
  'showOriginalImage',
];

export const createInitialState = () => loadStateFromLocalStorage(initialState, properties);

const rootReducer = (prevState, action) => {
  if (Object.keys(action).every((k) => prevState[k] === action[k])) return prevState;

  const state = {
    ...prevState,
    ...action,
  };

  logger(action, prevState, state);
  saveStateToLocalStorage(state, properties);

  return state;
};

export default rootReducer;
