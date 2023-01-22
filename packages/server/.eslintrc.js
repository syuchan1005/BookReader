module.exports = {
  extends: '../../.eslintrc.js',
  env: {
    node: true,
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@server', `${__dirname}/src`],
          ['natural-orderby', `${__dirname}/src/sort`],
          ['@syuchan1005/book-reader-graphql', `${__dirname}/generated/GQLResolvers.ts`],
        ],
      },
    },
  },
};
