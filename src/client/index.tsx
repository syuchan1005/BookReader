import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';
import { SnackbarProvider } from 'notistack';

import StoreProvider from '@client/store/StoreProvider';
import regSW from './registerServiceWorker';
import App from './App';

import getClient from './apollo';
import db from './Database';

// TODO: material-icons と Roboto をこっちで内包する

const wb = regSW();

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    collapseGroups: true,
  });
}

(async () => {
  await db.connect();
  const [client, persistor] = await getClient();

  ReactDOM.render(
    (
      <StoreProvider>
        <SnackbarProvider maxSnack={3}>
          <ApolloProvider client={client}>
            <App wb={wb} persistor={persistor} />
          </ApolloProvider>
        </SnackbarProvider>
      </StoreProvider>
    ),
    document.getElementById('app'),
  );
})();
