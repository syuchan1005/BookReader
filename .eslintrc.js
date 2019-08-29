module.exports = {
  extends: 'airbnb',
  plugins: [
    '@typescript-eslint',
    'import',
    'react',
    'jsx-a11y',
    'graphql',
  ],
  env: {
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    // project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off',
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    'react/jsx-no-target-blank': 'error',
    'react/jsx-filename-extension': [1, { "extensions": [".tsx", ".jsx"] }],
    'react/jsx-props-no-spreading': 0,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
    },
  },
};
