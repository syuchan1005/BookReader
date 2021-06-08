const Errors = {
  QL0000: 'thumbnail must be jpeg image',
  QL0001: 'book info id not exist',
  QL0002: 'unsupported archive type',
  QL0003: 'jpeg file not found in zip',
  QL0004: 'book not found',
  QL0005: 'Some changes are needed',
  QL0006: 'failed add books',
  QL0007: 'numbers range error',
  QL0008: 'genre not found',
  QL0009: 'can not delete default genre',
  QL0010: 'can not edit default genre',
  QL0011: 'genre name must be unique',
  QL0012: 'Invalid arguments',
  QL0013: 'Failed to save image',

  Unknown: 'Unknown',
} as const;

export const createError = (code: keyof typeof Errors, msg?: string) => ({
  success: false,
  code,
  message: msg || Errors[code],
});

export default Errors;
