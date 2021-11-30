import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { render } from '@testing-library/react';

// eslint-disable-next-line import/prefer-default-export
export const renderWithRouter = (ui: React.ReactElement) => {
  const Wrapper = ({
    children,
  }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <Routes>
        <Route path="*">
          {children}
        </Route>
      </Routes>
    </BrowserRouter>
  );
  return { ...render(ui, { wrapper: Wrapper }) };
};
