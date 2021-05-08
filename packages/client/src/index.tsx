import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';
import { SnackbarProvider } from 'notistack';

import MyApolloProvider from '@client/apollo/ApolloProvider';
import getClient from '@client/apollo/index';
import StoreProvider from '@client/store/StoreProvider';
import registerServiceWorker from './registerServiceWorker';
import App from './App';

import db from './Database';

const wb = registerServiceWorker();

if (process.env.NODE_ENV !== 'production') {
  import('why-did-you-update')
  .then(({ whyDidYouUpdate }) => whyDidYouUpdate(React));
}

(async () => {
  await db.connect();
  const [client, persistor] = await getClient();

  ReactDOM.render(
    (
      <StoreProvider>
        <SnackbarProvider maxSnack={3}>
          <ApolloProvider client={client}>
            <MyApolloProvider client={client} persistor={persistor}>
              <App wb={wb} />
            </MyApolloProvider>
          </ApolloProvider>
        </SnackbarProvider>
      </StoreProvider>
    ),
    document.getElementById('app'),
  );
})();
