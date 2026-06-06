import { vi, describe, it, expect, beforeEach } from 'vitest';
import compare from '../index';
import baseCompare from '../../utils/baseCompare';

vi.mock('../../utils/baseCompare', () => ({
  default: vi.fn(),
}));

const defaultOptions = {
  order: 'asc',
};

describe('compare()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call baseCompare() with default options', () => {
    compare();
    expect(baseCompare).toHaveBeenCalledTimes(1);
    expect(baseCompare).toHaveBeenCalledWith(defaultOptions, undefined);
  });

  it('should call baseCompare() with { order: "desc" } ', () => {
    const options = {
      order: 'desc',
    };
    const expectedOptions = { ...defaultOptions, ...options };
    compare(options as any);
    expect(baseCompare).toHaveBeenCalledTimes(1);
    expect(baseCompare).toHaveBeenCalledWith(expectedOptions, undefined);
  });
});
