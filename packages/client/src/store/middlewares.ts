/* eslint-disable no-console, import/prefer-default-export */
import { IState } from '@client/store/reducers';

const localStorageKey = 'state-persist';

export const logger = (
  action: object,
  prevState: object,
  currentState: object,
) => {
  if (process.env.NODE_ENV === 'production') return;
  console.groupCollapsed(`StoreDispatch (${Object.keys(action).join(', ')})`);
  console.log('%c Action:', 'color: blue', action);
  console.log('%c Previous State:', 'color: red', prevState);
  console.log('%c Current State:', 'color: green', currentState);
  console.groupEnd();
};

export const loadStateFromLocalStorage = (
  initialState: IState,
  loadProperties: string[],
) => {
  if (!window.localStorage) return initialState;
  const jsonStr = window.localStorage.getItem(localStorageKey);
  if (!jsonStr) return initialState;
  const json: object = JSON.parse(jsonStr);
  Object.keys(json)
    .forEach((k) => {
      if (!loadProperties.includes(k)) delete json[k];
    });
  return {
    ...initialState,
    ...json,
  };
};

export const saveStateToLocalStorage = (
  state: IState,
  saveProperties: string[],
) => {
  if (!window.localStorage) return;
  const s = { ...state };
  Object.keys(s)
    .forEach((k) => {
      if (!saveProperties.includes(k)) delete s[k];
    });
  window.localStorage.setItem(localStorageKey, JSON.stringify(s));
};
