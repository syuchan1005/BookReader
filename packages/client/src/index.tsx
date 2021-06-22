import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';
import { SnackbarProvider } from 'notistack';

import getClient from '@client/apollo/index';
import StoreProvider from '@client/store/StoreProvider';
import registerServiceWorker from './registerServiceWorker';
import App from './App';

import db from './Database';

const wb = registerServiceWorker();

if (process.env.NODE_ENV !== 'production') {
  import('@welldone-software/why-did-you-render')
    .then(({ default: whyDidYouRender }) => whyDidYouRender(React, {
      trackAllPureComponents: true,
    }));
}

(async () => {
  await db.connect();
  const client = await getClient();

  ReactDOM.render(
    (
      <StoreProvider>
        <SnackbarProvider maxSnack={3}>
          <ApolloProvider client={client}>
            <App wb={wb} />
          </ApolloProvider>
        </SnackbarProvider>
      </StoreProvider>
    ),
    document.getElementById('app'),
  );
})();
