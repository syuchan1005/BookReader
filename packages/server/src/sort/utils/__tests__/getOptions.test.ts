import { OrderEnum } from '@server/sort/types';
import getOptions from '../getOptions';
const defaultOptions = {
  order: 'asc',
};
describe('getOptions()', () => {
  describe('valid options', () => {
    it('should return custom options, if argument is object', () => {
      const customOptions = {
        order: 'desc' as OrderEnum,
      };
      const options = getOptions(customOptions);
      const expected = customOptions;
      expect(options).toEqual(expected);
    });
    it('should return custom options, if argument is a string', () => {
      const customOptions = 'desc';
      const options = getOptions(customOptions);
      const expected = {
        order: customOptions,
      };
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is undefined', () => {
      const options = getOptions();
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is empty object', () => {
      const options = getOptions({});
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
  });
  describe('invalid options', () => {
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: 'abc',
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: true,
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: 1,
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: {},
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: () => {},
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: Symbol(),
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: null,
      };
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is null', () => {
      const options = getOptions(null);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is an object with unknown properties', () => {
      const customOptions = {
        a: 1,
        b: 2,
        c: 3,
      };
      const options = getOptions(customOptions as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is an invalid string', () => {
      const options = getOptions('abc' as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a number', () => {
      const options = getOptions(123 as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a function', () => {
      const options = getOptions((() => {}) as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a symbol', () => {
      const options = getOptions(Symbol() as any);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
  });
});