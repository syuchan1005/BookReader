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
  history: boolean;
  invisible: boolean;
  theme: 'light' | 'dark';
  webp: boolean;
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
  history: false,
  invisible: false,
  theme: 'light',
  webp: false,
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
