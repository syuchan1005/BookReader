import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language/kinds';

const parseBigInt = (value: string) => {
  if (value === '') {
    throw new TypeError('require string');
  }
  const num = Number(value);
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    throw new TypeError(`number range invalid: ${value}`);
  }
  const int = Math.floor(num);
  if (num !== int) {
    throw new TypeError(`non integer value: ${value}`);
  }
  return int;
};

const BigInt = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt scalar type can represent values more Int.',
  serialize: parseBigInt,
  parseValue: parseBigInt,
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      const num = parseInt(ast.value, 10);
      if (num <= Number.MAX_SAFE_INTEGER && num >= Number.MIN_SAFE_INTEGER) {
        return num;
      }
    }
    return null;
  },
});

export default BigInt;
