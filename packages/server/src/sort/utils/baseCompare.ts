import getMappedValueRecord from './getMappedValueRecord';
import compareValues from './compareValues';
import type { BaseCompareOptions } from '../types';

const baseCompare = (options: BaseCompareOptions, customChunkString?: string[] | undefined,) => (
  valueA: unknown,
  valueB: unknown,
): number => {
  const a = getMappedValueRecord(valueA, customChunkString);
  const b = getMappedValueRecord(valueB, customChunkString);
  const result = compareValues(a, b);
  return result * (options.order === 'desc' ? -1 : 1);
};

export default baseCompare;