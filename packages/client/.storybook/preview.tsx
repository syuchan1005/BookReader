// @ts-ignore
import React from 'react';
import { DecoratorFn } from '@storybook/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme, StyledEngineProvider } from '@mui/material/styles';
import { RecoilRoot } from 'recoil';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import { InMemoryCache } from '@apollo/client/cache';
import { AsyncAuth0Provider } from '@client/components/AsyncAuth0Provider';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
});
const theme = createTheme();

export const decorators: Array<DecoratorFn> = [
  (Story) => (
    <RecoilRoot>
      <Story />
    </RecoilRoot>
  ),
  (Story) => (
    <AsyncAuth0Provider>
      <Story />
    </AsyncAuth0Provider>
  ),
  (Story) => (
    <ApolloProvider client={apolloClient}>
      <Story />
    </ApolloProvider>
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
