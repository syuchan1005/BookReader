import { GraphQLScalarType, IntValueNode } from 'graphql';
import { Kind } from 'graphql/language/kinds';
import { Scalars } from '@syuchan1005/book-reader-graphql';

export const flatRange = (range: Scalars['IntRange']): number[] => {
  if (!range) return [];
  let arr = [];
  range.forEach((a) => {
    if (Array.isArray(a)) {
      const [max, min] = a[0] > a[1] ? a : [a[1], a[0]];
      arr = [...arr, ...[...Array(max - min + 1).keys()].map((i) => i + min)];
    } else {
      arr.push(a);
    }
  });

  return arr
    .filter((elem, index, self) => self.indexOf(elem) === index)
    .sort((a, b) => a - b);
};

export const chunkedRange = (range: Scalars['IntRange']): number[][] => {
  if (!range) return [];
  const arr: number[][] = [];
  range.forEach((a) => {
    if (Array.isArray(a)) {
      const [max, min] = a[0] > a[1] ? a : [a[1], a[0]];
      arr.push([...Array(max - min + 1).keys()].map((i) => i + min));
    } else {
      arr.push([a]);
    }
  });
  return arr;
};

const parseIntRange = (value: (number | number[])[] | any) => {
  if (!Array.isArray(value)
    || !value.every(
      (v) => Number.isInteger(v)
        || (Array.isArray(v) && v.length === 2 && v.every((e) => Number.isInteger(e))),
    )
  ) {
    throw new Error('IntRange must `(Int | Int[2])[]` type');
  }
  return value;
};

const IntRange = new GraphQLScalarType({
  name: 'IntRange',
  description: 'Int or Int[2] has array',
  serialize: parseIntRange,
  parseValue: parseIntRange,
  parseLiteral(ast) {
    if (ast.kind === Kind.LIST) {
      const arr = [];
      if (!ast.values.every((v) => {
        if (v.kind === Kind.INT) {
          const num = parseInt(v.value, 10);
          if (!Number.isNaN(num)) {
            arr.push(num);
            return true;
          }
        } else if (v.kind === Kind.LIST) {
          if (v.values.length !== 2
            || !v.values.every((a) => a.kind === Kind.INT)) return false;
          const range = v.values.map((a: IntValueNode) => {
            const num = parseInt(a.value, 10);
            return Number.isNaN(num) ? undefined : num;
          });
          if (range.some((r) => r === undefined)) return false;
          arr.push(range);
          return true;
        }
        return false;
      })) {
        return null;
      }
      return arr;
    }
    return null;
  },
});

export default IntRange;
