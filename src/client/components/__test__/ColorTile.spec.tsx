/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';

import ColorTile from '../ColorTile';

describe('<ColorTile>', () => {
  const props = {
    color: 'orange',
  };

  it('initial', () => {
    const { getByTestId } = render(<ColorTile {...props} />);

    expect(getByTestId('tile')).not.toBe(undefined);
    expect(getByTestId('text')).toHaveTextContent(props.color);
  });
});
