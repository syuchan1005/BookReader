import { vi, describe, it, expect, beforeEach } from 'vitest';
import orderBy from '../index';
import baseOrderBy from '../../utils/baseOrderBy';

vi.mock('../../utils/baseOrderBy', () => ({
  default: vi.fn(),
}));

describe('orderBy()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('non-exceptional cases', () => {
    it('should call baseOrderBy() with provided collection argument and an empty array value for identifiers and orders', () => {
      const collection = ['Fred', 'barney', 'frank', 'Bob'];
      const identifiers = undefined;
      const orders = undefined;
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, [], [], undefined);
    });
    it('should call baseOrderBy() with provided collection, identifiers and orders arguments', () => {
      const collection = ['Fred', 'barney', 'frank', 'Bob'];
      const identifiers = [v => v.toLowerCase()];
      const orders = ['desc'];
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, identifiers, orders, undefined);
    });
  });
  describe('exceptional cases', () => {
    it('should call baseOrderBy() with provided collection argument and an empty array value for identifiers and orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = null;
      const orders = null;
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, [], [], undefined);
    });
    it('should call baseOrderBy() with provided collection argument and an empty array value for identifiers and orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = {};
      const orders = {};
      // $FlowInvalidInputTest
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, [], [], undefined);
    });
    it('should call baseOrderBy() with provided collection argument and an empty array value for identifiers and orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = true;
      const orders = true;
      // $FlowInvalidInputTest
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, [], [], undefined);
    });
    it('should call baseOrderBy() with provided collection argument and an empty array value for identifiers and orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = Symbol();
      const orders = Symbol();
      // $FlowInvalidInputTest
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, [], [], undefined);
    });
    it('should call baseOrderBy() with provided collection and identifiers argument and an empty array value for orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = ['users'];
      const orders = 'abc';
      // $FlowInvalidInputTest
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, identifiers, [], undefined);
    });
    it('should call baseOrderBy() with provided collection and identifiers argument and an empty array value for orders', () => {
      const collection = [
        {
          user: 'Fred',
          age: 48,
        },
        {
          user: 'barney',
          age: 34,
        },
        {
          user: 'fred',
          age: 40,
        },
        {
          user: 'Barney',
          age: 36,
        },
      ];
      const identifiers = ['users'];
      const orders = 1;
      // $FlowInvalidInputTest
      orderBy(collection, identifiers, orders);
      expect(baseOrderBy).toHaveBeenCalledTimes(1);
      expect(baseOrderBy).toHaveBeenCalledWith(collection, identifiers, [], undefined);
    });
    it('should return an empty array, if collection is null', () => {
      const collection = null;
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is undefined', () => {
      const collection = undefined;
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is boolean', () => {
      const collection = true;
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is a number', () => {
      const collection = 1;
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is a string', () => {
      const collection = 'abc';
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is a object', () => {
      const collection = {};
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is a function', () => {
      const collection = () => {};

      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should return an empty array, if collection is a symbol', () => {
      const collection = Symbol();
      const identifiers = undefined;
      const orders = undefined;
      // $FlowInvalidInputTest
      const result = orderBy(collection, identifiers, orders, undefined);
      expect(baseOrderBy).not.toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});


