const path = require('path');

module.exports = {
  extends: [
    'airbnb',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'react',
    'react-hooks',
    'jsx-a11y',
    'graphql',
    'jest',
  ],
  env: {
    browser: true,
    node: true,
    'jest/globals': true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    // project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [
    'packages/graphql/generated/*.ts',
    'packages/server/src/sort/**/*.ts',
    '**/dist/*',
    '**/*.puml',
    '**/*.yml',
    '**/*.json',
    '**/*.html',
    '**/*.css',
    '**/*.gql',
    '**/*.graphql',
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-use-before-define': 'off',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
    'react/jsx-props-no-spreading': 0,
    'react/require-default-props': 0,
    'react/prop-types': 0,
    'react/no-unused-prop-types': 0,
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      ts: 'never',
      tsx: 'never',
      js: 'never',
      jsx: 'never',
      mjs: 'never',
    }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'warn', {
        additionalHooks: 'useRecoilCallback',
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
      alias: {
        map: [
          ['@client', path.resolve(__dirname, 'packages', 'client', 'src')],
          ['@server', path.resolve(__dirname, 'packages', 'server', 'src')],
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
    },
  },
};
