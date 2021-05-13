import type { MappedValueRecord } from '../types';
import stringify from './stringify';
import numberify from './numberify';
import createChunkMaps from './createChunkMaps';
import isFunction from './isFunction';
import isNaN from './isNaN';
import isNull from './isNull';
import isObject from './isObject';
import isSymbol from './isSymbol';
import isUndefined from './isUndefined';

const getMappedValueRecord = (value: unknown, customChunkString?: string[] | undefined): MappedValueRecord => {
  if (
    typeof value === 'string' ||
    value instanceof String ||
    ((typeof value === 'number' || value instanceof Number) && !isNaN(value)) ||
    typeof value === 'boolean' ||
    value instanceof Boolean ||
    value instanceof Date
  ) {
    const stringValue = stringify(value);
    const parsedNumber = numberify(stringValue);
    const chunks = createChunkMaps(
      parsedNumber ? `${parsedNumber}` : stringValue,
      customChunkString
    );
    return {
      parsedNumber,
      chunks,
      value,
    };
  }

  return {
    isArray: Array.isArray(value),
    isFunction: isFunction(value),
    isNaN: isNaN(value),
    isNull: isNull(value),
    isObject: isObject(value),
    isSymbol: isSymbol(value),
    isUndefined: isUndefined(value),
    value,
  };
};

export default getMappedValueRecord;