module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: '@storybook/react-vite',
  core: { builder: '@storybook/builder-vite' },
  previewHead: (head) => `${head}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<link rel="preload" as="style" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
<link rel="stylesheet" media="print" onload="this.media='all'"
      href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
<link rel="stylesheet" media="print" onload="this.media='all'"
      href="https://fonts.googleapis.com/icon?family=Material+Icons&display=swap" />
`,
  managerHead: (head, { configType }) =>
    configType === 'PRODUCTION' ? `${head}<base href="/storybook/">` : head,
  docs: {
    autodocs: true,
  },
};
