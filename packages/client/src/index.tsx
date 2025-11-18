import { ApolloProvider } from '@apollo/client/react';
import apolloClient, { setUpApollo } from '@client/apollo/index';
import React from 'react';
import { createRoot } from 'react-dom/client';
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

  const root = createRoot(document.getElementById('app'));
  root.render(
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>,
  );
})();
