import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
// eslint-disable-next-line import/no-extraneous-dependencies
import { render } from '@testing-library/react';

type Option = {
  history?: MemoryHistory;
}

// eslint-disable-next-line import/prefer-default-export
export const renderWithRouter = (ui: React.ReactElement, option?: Option) => {
  const Wrapper = ({
    children,
  }: { children: React.ReactNode }) => (
    <Router history={option?.history ?? createMemoryHistory()}>{children}</Router>
  );
  return { ...render(ui, { wrapper: Wrapper }) };
};
