/* eslint-disable no-console */
// eslint-disable-next-line import/prefer-default-export
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
