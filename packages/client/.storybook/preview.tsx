import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme, StyledEngineProvider } from '@mui/material/styles';
import type { Decorator } from '@storybook/react';

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
