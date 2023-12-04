import { CssBaseline, ThemeProvider } from '@mui/material';
import { StyledEngineProvider, createTheme } from '@mui/material/styles';
import { Decorator } from '@storybook/react';
import { RecoilRoot } from 'recoil';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const theme = createTheme();

export const decorators: Array<Decorator> = [
  (Story) => (
    <RecoilRoot>
      <Story />
    </RecoilRoot>
  ),
  (Story) => (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  ),
  (Story) => (
    <StyledEngineProvider injectFirst>
      <Story />
    </StyledEngineProvider>
  ),
];
