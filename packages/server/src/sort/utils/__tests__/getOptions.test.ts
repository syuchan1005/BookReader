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
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: true,
      };
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: 1,
      };
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: {},
      };
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: () => {},
      };
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return { caseSensitive: true, order: "asc" }', () => {
      const customOptions = {
        order: Symbol(),
      };
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
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
      // @ts-ignore invalid input test
      const options = getOptions(customOptions);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is an invalid string', () => {
      // @ts-ignore invalid input test
      const options = getOptions('abc');
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a number', () => {
      // @ts-ignore invalid input test
      const options = getOptions(123);
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a function', () => {
      // @ts-ignore invalid input test
      const options = getOptions(() => {});
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
    it('should return default options, if argument is a symbol', () => {
      // @ts-ignore invalid input test
      const options = getOptions(Symbol());
      const expected = defaultOptions;
      expect(options).toEqual(expected);
    });
  });
});