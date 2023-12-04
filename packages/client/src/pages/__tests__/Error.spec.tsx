import '@testing-library/jest-dom/extend-expect';

import { renderWithRouter } from '../../testUtil';

import ErrorComponent from '../Error';

describe('<Error>', () => {
  it('initial', () => {
    const { getByTestId } = renderWithRouter(<ErrorComponent />);
    expect(getByTestId('svg')).not.toBe(undefined);
    expect(getByTestId('text')).not.toBe(undefined);
    expect(getByTestId('button')).not.toBe(undefined);
  });
});
