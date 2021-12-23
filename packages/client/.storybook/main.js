const path = require('path');

module.exports = {
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials'
  ],
  framework: '@storybook/react',
  core: {
    builder: 'storybook-builder-vite',
  },
  features: {
    storyStoreV7: true,
  },
  async viteFinal(config) {
    config.resolve.alias['@client'] = path.resolve(__dirname, '../src');
    config.base = './';
    return config;
  },
  managerHead: (head, { configType }) => configType === 'PRODUCTION' ? `${head}<base href="/storybook/">` : head,
};
