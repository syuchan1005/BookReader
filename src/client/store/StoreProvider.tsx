// MEMO: https://medium.com/strands-tech-corner/react-state-management-without-redux-d39c7087039d

import * as React from 'react';

import rootReducer, { createInitialState, IState } from '@client/store/reducers';

interface IStore {
  state: IState;
  dispatch: (update: Partial<IState>) => void;
}

const initialState = createInitialState();

const GlobalStore = React.createContext<IStore>({ state: initialState, dispatch: () => {} });

export const useGlobalStore = () => React.useContext(GlobalStore);

const StoreProvider: React.PropsWithChildren<React.FC> = ({
  children,
}: React.PropsWithChildren<React.FC>) => {
  const [state, dispatch] = React.useReducer(rootReducer, initialState);
  return (
    <GlobalStore.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStore.Provider>
  );
};

export default StoreProvider;
