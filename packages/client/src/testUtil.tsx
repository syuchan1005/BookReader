import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export const renderWithRouter = (ui: React.ReactElement) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <Routes>
        <Route path="*">{children}</Route>
      </Routes>
    </BrowserRouter>
  );
  return { ...render(ui, { wrapper: Wrapper }) };
};
