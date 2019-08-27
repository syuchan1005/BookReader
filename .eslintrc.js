module.exports = {
  extends: 'airbnb',
  parser: '@typescript-eslint/parser', // babel-eslint
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  rules: {
    'react/jsx-no-target-blank': 'error',
    "react/jsx-filename-extension": [1, { "extensions": [".tsx", ".jsx"] }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
      },
    },
  },
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
};
