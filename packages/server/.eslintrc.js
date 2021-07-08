module.exports = {
  extends: '../../.eslintrc.js',
  env: {
    node: true,
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@server', 'src'],
          ['natural-orderby', 'src/sort'],
        ],
      },
    },
  },
};
