/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import '@testing-library/jest-dom/extend-expect';

import { renderWithRouter } from '../../testUtil';

import Error from '../Error';

describe('<Error>', () => {
  it('initial', () => {
    const { getByTestId } = renderWithRouter(<Error />);
    expect(getByTestId('svg')).not.toBe(undefined);
    expect(getByTestId('text')).not.toBe(undefined);
    expect(getByTestId('button')).not.toBe(undefined);
  });
});
