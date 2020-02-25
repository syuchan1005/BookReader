import { BookInfoOrder, BookOrder } from '@common/GQLTypes.ts';
import { loadStateFromLocalStorage, logger, saveStateToLocalStorage } from './middlewares';

export interface IState {
  [key: string]: any;
  wb: any;
  searchText: string;
  sortOrder: BookInfoOrder;
  sortBookOrder: BookOrder;
  history: boolean;
  normal: boolean;
  invisible: boolean;
  theme: 'light' | 'dark';
  primary: string;
  secondary: string;
  webp: boolean;
  readOrder: number;
  showOriginalImage: boolean;
  showBookInfoName: boolean;
}

export const initialState: IState = {
  // no load
  wb: undefined,
  webp: false,

  // load
  searchText: '',
  sortOrder: BookInfoOrder.UpdateNewest,
  sortBookOrder: BookOrder.NumberAsc,
  history: false,
  normal: true,
  invisible: false,
  theme: 'light',
  primary: 'green',
  secondary: 'blue',
  readOrder: 1, // LtoR, RtoL
  showBookInfoName: false,
  showOriginalImage: false,
};

const properties = [
  'searchText',
  'sortOrder',
  'sortBookOrder',
  'history',
  'normal',
  'invisible',
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
