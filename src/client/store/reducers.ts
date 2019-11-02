import { logger } from './middlewares';

export type SortOrder = 'Update_Newest' | 'Update_Oldest' | 'Add_Newest' | 'Add_Oldest';

export interface IState {
  [key: string]: any;
  showAppBar: boolean;
  needContentMargin: boolean;
  barTitle: string;
  showBackRouteArrow: boolean;
  backRoute: string;
  wb: any;
  searchText: string;
  sortOrder: SortOrder;
  normal: boolean;
  history: boolean;
  invisible: boolean;
  theme: 'light' | 'dark';
  webp: boolean;
  readOrder: number;
}

export const initialState: IState = {
  showAppBar: true,
  needContentMargin: true,
  barTitle: 'Book Reader',
  showBackRouteArrow: false,
  backRoute: undefined,
  wb: undefined,
  searchText: '',
  sortOrder: 'Update_Newest',
  normal: true,
  history: false,
  invisible: false,
  theme: 'light',
  webp: false,
  readOrder: 0, // LtoR, RtoL
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
