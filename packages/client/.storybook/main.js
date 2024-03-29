const path = require('path');

module.exports = {
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: '@storybook/react',
  core: {
    builder: "webpack5",
  },
  async webpackFinal(config) {
    config.resolve.alias['@client'] = path.resolve(__dirname, '../src');
    config.resolve.alias['@syuchan1005/book-reader-graphql'] = path.resolve(__dirname, '../generated', 'GQLQueries.ts')
    return config;
  },
  previewHead: (head) => (`${head}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<link rel="preload" as="style" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
<link rel="stylesheet" media="print" onload="this.media='all'"
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<link rel="stylesheet" media="print" onload="this.media='all'"
      href="https://fonts.googleapis.com/icon?family=Material+Icons&display=swap" />
`),
  managerHead: (head, { configType }) => configType === 'PRODUCTION' ? `${head}<base href="/storybook/">` : head,
};
