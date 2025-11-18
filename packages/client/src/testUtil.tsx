import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export const renderWithRouter = (ui: ReactElement) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <Routes>
        <Route path="*">{children}</Route>
      </Routes>
    </BrowserRouter>
  );
  return { ...render(ui, { wrapper: Wrapper }) };
};
