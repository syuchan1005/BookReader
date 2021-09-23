module.exports = {
  roots: [
    '<rootDir>/src/database/sequelize',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@server/(.+)': '<rootDir>/src/$1',
    'natural-orderby': '<rootDir>/src/sort',
  },
};
