import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';

import './registerServiceWorker';
import App from './App';

import getClient from './apollo';

getClient().then((client) => {
  ReactDOM.render(
    (
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    ),
    document.getElementById('app'),
  );
});
