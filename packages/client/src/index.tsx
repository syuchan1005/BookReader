import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from '@apollo/react-hooks';
import { SnackbarProvider } from 'notistack';
import { RecoilRoot } from 'recoil';

import apolloClient, { setUpApollo } from '@client/apollo/index';
import App from './App';

import db from './Database';

import { workbox } from './registerServiceWorker';

if (process.env.NODE_ENV !== 'production' && !!0) {
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
        <SnackbarProvider maxSnack={3}>
          <ApolloProvider client={apolloClient}>
            <App />
          </ApolloProvider>
        </SnackbarProvider>
      </RecoilRoot>
    ),
    document.getElementById('app'),
  );
})();
