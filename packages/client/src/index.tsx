import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';
import { SnackbarProvider } from 'notistack';

import apolloClient, { setUpApollo } from '@client/apollo/index';
import StoreProvider from '@client/store/StoreProvider';
import App from './App';

import db from './Database';

import { workbox } from './registerServiceWorker';

if (process.env.NODE_ENV !== 'production') {
  import('@welldone-software/why-did-you-render')
    .then(({ default: whyDidYouRender }) => whyDidYouRender(React, {
      trackAllPureComponents: true,
    }));
}

(async () => {
  await db.connect();
  await workbox?.register();
  await setUpApollo();

  ReactDOM.render(
    (
      <StoreProvider>
        <SnackbarProvider maxSnack={3}>
          <ApolloProvider client={apolloClient}>
            <App />
          </ApolloProvider>
        </SnackbarProvider>
      </StoreProvider>
    ),
    document.getElementById('app'),
  );
})();
