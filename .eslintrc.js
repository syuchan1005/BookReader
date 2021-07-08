module.exports = {
  extends: 'airbnb',
  plugins: [
    '@typescript-eslint',
    'import',
    'graphql',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
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
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': ['error', 'ignorePackages', {
      ts: 'never',
      tsx: 'never',
      js: 'never',
      jsx: 'never',
      mjs: 'never',
    }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
      alias: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
    },
  },
};
