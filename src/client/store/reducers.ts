import { logger } from './middlewares';
import { BookInfoOrder } from '@common/GQLTypes.ts';

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
}

export const initialState: IState = {
  showAppBar: true,
  needContentMargin: true,
  barTitle: 'Book Reader',
  barSubTitle: '',
  showBackRouteArrow: false,
  backRoute: undefined,
  wb: undefined,
  searchText: '',
  sortOrder: BookInfoOrder.UpdateNewest,
  history: false,
  normal: true,
  invisible: false,
  theme: 'light',
  primary: 'green',
  secondary: 'blue',
  webp: false,
  readOrder: 1, // LtoR, RtoL
  showOriginalImage: false,
};

const rootReducer = (prevState, action) => {
  if (Object.keys(action).every((k) => prevState[k] === action[k])) return prevState;

  const state = {
    ...prevState,
    ...action,
  };

  logger(action, prevState, state);

  return state;
};

export default rootReducer;
