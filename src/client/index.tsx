import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createUploadLink } from 'apollo-upload-client';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { ApolloProvider } from '@apollo/react-hooks';

import App from './App';

let uri = '';
if (process.env.NODE_ENV !== 'production') {
  uri = `${window.location.protocol}//${window.location.hostname}:8081/graphql`;
} else {
  uri = '/graphql';
}

const parseHeaders = (rawHeaders: any) => {
  const headers = new Headers();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  preProcessedHeaders.split(/\r?\n/).forEach((line: any) => {
    const parts = line.split(':');
    const key = parts.shift().trim();
    if (key) {
      const value = parts.join(':').trim();
      headers.append(key, value);
    }
  });
  return headers;
};

const uploadFetch = (url: string, options: any) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    const opts: any = {
      status: xhr.status,
      statusText: xhr.statusText,
      headers: parseHeaders(xhr.getAllResponseHeaders() || ''),
    };
    opts.url = 'responseURL' in xhr
      ? xhr.responseURL
      : opts.headers.get('X-Request-URL');
    const body = 'response' in xhr ? xhr.response : (xhr as any).responseText;
    resolve(new Response(body, opts));
  };
  xhr.onerror = () => {
    reject(new TypeError('Network request failed'));
  };
  xhr.ontimeout = () => {
    reject(new TypeError('Network request timeout'));
  };
  xhr.open(options.method, url, true);

  Object.keys(options.headers).forEach((key) => {
    xhr.setRequestHeader(key, options.headers[key]);
  });

  if (xhr.upload) {
    xhr.upload.onprogress = options.onProgress;
  }

  options.onAbortPossible(() => {
    xhr.abort();
  });

  xhr.send(options.body);
});

const customFetch = (uri1: any, options: any) => {
  if (options.useUpload) {
    return uploadFetch(uri1, options);
  }
  return fetch(uri1, options);
};

const client = new ApolloClient({
  link: ApolloLink.from([
    onError(({ graphQLErrors, networkError }) => {
      /* eslint-disable no-console */
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ));
      }
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    createUploadLink({
      uri,
      // credentials: "same-origin",
      fetch: customFetch as any,
    }),
  ]),
  cache: new InMemoryCache(),
});

ReactDOM.render(
  (
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  ),
  document.getElementById('app'),
);
