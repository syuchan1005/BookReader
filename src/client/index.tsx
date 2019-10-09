import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';

import regSW from './registerServiceWorker';
import App from './App';

import getClient from './apollo';

const wb = regSW();

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
}

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
