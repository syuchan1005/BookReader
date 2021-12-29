// @ts-ignore
import React from 'react';
import { DecoratorFn } from '@storybook/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme, StyledEngineProvider } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

const theme = createTheme();

export const decorators: Array<DecoratorFn> = [
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
