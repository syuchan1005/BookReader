/* eslint-disable import/no-extraneous-dependencies */
import { renderHook, act } from '@testing-library/react-hooks';

import useDebounceValue from '../useDebounceValue';

jest.useFakeTimers();

describe('useDebounceValue', () => {
  it('initial', () => {
    const { result } = renderHook(() => useDebounceValue('test', 200));
    expect(result.current).toBe('test');
  });

  it('value change', async () => {
    const {
      result,
      rerender,
    } = renderHook(({ value, delay }) => useDebounceValue(value, delay), {
      initialProps: { value: 'test', delay: 200 },
    });
    expect(result.current).toBe('test');

    act(() => { rerender({ value: 'test2', delay: 200 }); });
    expect(result.current).not.toBe('test2');
    act(() => { jest.runTimersToTime(201); });
    expect(result.current).toBe('test2');
  });
});
