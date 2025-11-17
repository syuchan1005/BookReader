import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/client';

import apolloClient, { setUpApollo } from '@client/apollo/index';
import App from './App';

import db from './indexedDb/Database';

import { workbox } from './registerServiceWorker';

// Disabled. not work properly when use with react-router-dom v6.
// biome-ignore lint/correctness/noConstantCondition: read above
if (process.env.NODE_ENV !== 'production' && false) {
  import('@welldone-software/why-did-you-render').then(
    (
      { default: whyDidYouRender }, // @ts-ignore
    ) =>
      whyDidYouRender(React, {
        trackAllPureComponents: true,
        exclude: [/Remount/],
      }),
  );
}

(async () => {
  await db.connect();
  await workbox?.register();
  await setUpApollo();

  ReactDOM.render(
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>,
    document.getElementById('app'),
  );
})();
