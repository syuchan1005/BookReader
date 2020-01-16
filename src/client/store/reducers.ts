import { BookInfoOrder } from '@common/GQLTypes.ts';
import { loadStateFromLocalStorage, logger, saveStateToLocalStorage } from './middlewares';

export interface IState {
  [key: string]: any;
  showAppBar: boolean;
  needContentMargin: boolean;
  barTitle: string;
  barSubTitle: string;
  showBackRouteArrow: boolean;
  backRoute: string;
  wb: any;
  searchText: string;
  sortOrder: BookInfoOrder;
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
  showAppBar: true,
  needContentMargin: true,
  barTitle: 'Book Reader',
  barSubTitle: '',
  showBackRouteArrow: false,
  backRoute: undefined,
  wb: undefined,
  webp: false,
  showOriginalImage: false,

  // load
  searchText: '',
  sortOrder: BookInfoOrder.UpdateNewest,
  history: false,
  normal: true,
  invisible: false,
  theme: 'light',
  primary: 'green',
  secondary: 'blue',
  readOrder: 1, // LtoR, RtoL
  showBookInfoName: false,
};

const properties = [
  'searchText',
  'sortOrder',
  'history',
  'normal',
  'invisible',
  'theme',
  'primary',
  'secondary',
  'readOrder',
  'showBookInfoName',
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
