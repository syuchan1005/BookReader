import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';

import regSW from './registerServiceWorker';
import App from './App';

import getClient from './apollo';

const wb = regSW();

getClient().then(([client, persistor]) => {
  ReactDOM.render(
    (
      <ApolloProvider client={client}>
        <App wb={wb} persistor={persistor} />
      </ApolloProvider>
    ),
    document.getElementById('app'),
  );
});
