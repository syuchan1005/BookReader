module.exports = {
  extends: '../../.eslintrc.js',
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'jest',
  ],
  env: {
    browser: true,
    'jest/globals': true,
  },
  rules: {
    'react/jsx-no-target-blank': 'error',
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
    'react/jsx-props-no-spreading': 0,
    'react/require-default-props': 0,
    'react/prop-types': 0,
    'react/no-unused-prop-types': 0,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'warn', {
        additionalHooks: 'useRecoilCallback',
      },
    ],
    'react/function-component-definition': [
      'error', {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@client', `${__dirname}/src`],
        ],
      },
    },
  },
};
