import { vi } from 'vitest';
import getValueByIdentifier from '../getValueByIdentifier';

describe('getValueByIdentifier()', () => {
  it('should return user', () => {
    const element = {
      user: 'barney',
      age: 34,
    };
    const getValue = vi.fn((v: typeof element) => v && typeof v === 'object' && v.user);
    const value = getValueByIdentifier(element, getValue);
    const expected = element.user;
    expect(value).toEqual(expected);
    expect(getValue).toHaveBeenCalled();
    expect(getValue).toHaveBeenCalledWith(element);
  });

  it('should return element at index 0', () => {
    const element = ['barney', 34];
    const getValue = vi.fn((v: unknown) => v && Array.isArray(v) && v[0]);
    const value = getValueByIdentifier(element, getValue);
    const expected = element[0];
    expect(value).toEqual(expected);
    expect(getValue).toHaveBeenCalled();
    expect(getValue).toHaveBeenCalledWith(element);
  });

  it('should return element', () => {
    const element = {
      user: 'barney',
      age: 34,
    };
    const getValue = vi.fn(v => v);
    const value = getValueByIdentifier(element, getValue);
    const expected = element;
    expect(value).toEqual(expected);
    expect(getValue).toHaveBeenCalled();
    expect(getValue).toHaveBeenCalledWith(element);
  });

  it('should return element', () => {
    const element = ['barney', 34];
    const getValue = vi.fn(v => v);
    const value = getValueByIdentifier(element, getValue);
    const expected = element;
    expect(value).toEqual(expected);
    expect(getValue).toHaveBeenCalled();
    expect(getValue).toHaveBeenCalledWith(element);
  });
});