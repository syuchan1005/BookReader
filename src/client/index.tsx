import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import App from './App';

let uri = '';
if (process.env.NODE_ENV !== 'production') {
  uri = 'http://localhost:8081/graphql';
} else {
  uri = '/graphql';
}

const client = new ApolloClient({ uri });

ReactDOM.render(
  (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  ),
  document.getElementById('app'),
);
