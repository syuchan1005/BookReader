import { AtomEffect, DefaultValue } from 'recoil';

// eslint-disable-next-line import/prefer-default-export
export const logEffect = <T>(): AtomEffect<T> => ({
  node,
  onSet,
}) => {
  if (process.env.NODE_ENV !== 'production') {
    onSet((newValue, oldValue) => {
      // eslint-disable-next-line no-console
      console.log(`%cUpdate%c ${node.key}`, 'color: red', 'color: auto', oldValue, newValue);
    });
  }
};

const LOCAL_STORAGE_KEY = 'state-persist';
export const localStorageEffect = <T>(stateKey: string): AtomEffect<T> => ({ setSelf, onSet }) => {
  const loadJsonString = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (loadJsonString !== null) {
    const savedValue = JSON.parse(loadJsonString)[stateKey];
    if (savedValue != null) {
      setSelf(savedValue);
    }
  }

  onSet((newValue) => {
    const jsonString = localStorage.getItem(LOCAL_STORAGE_KEY);
    const json = (jsonString === null) ? {} : JSON.parse(jsonString);
    if (newValue instanceof DefaultValue) {
      delete json[stateKey];
    } else {
      json[stateKey] = newValue;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json));
  });
};
