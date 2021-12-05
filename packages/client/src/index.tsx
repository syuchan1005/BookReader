import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/client';
import { RecoilRoot } from 'recoil';

import apolloClient, { setUpApollo } from '@client/apollo/index';
import { AsyncAuth0Provider } from '@client/components/AsyncAuth0Provider';
import App from './App';

import db from './Database';

import { workbox } from './registerServiceWorker';

// Disabled. not work properly when use with react-router-dom v6.
// eslint-disable-next-line no-constant-condition
if (process.env.NODE_ENV !== 'production' && false) {
  import('@welldone-software/why-did-you-render')
    .then(({ default: whyDidYouRender }) => whyDidYouRender(React, {
      trackAllPureComponents: true,
      exclude: [
        /Remount/,
      ],
    }));
}

(async () => {
  await db.connect();
  await workbox?.register();
  await setUpApollo();

  ReactDOM.render(
    (
      <RecoilRoot>
        <ApolloProvider client={apolloClient}>
          <AsyncAuth0Provider>
            <App />
          </AsyncAuth0Provider>
        </ApolloProvider>
      </RecoilRoot>
    ),
    document.getElementById('app'),
  );
})();
