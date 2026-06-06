import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export const renderWithRouter = (ui: ReactElement) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </BrowserRouter>,
  );
};
