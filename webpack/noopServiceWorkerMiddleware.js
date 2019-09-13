// A dev-only middleware that resets service workers for the current host:port
// This is for dealing with cases where a developer loads the dev and prod
// versions of an app on the same host:port combination, causing the prod
// service worker to hijack subsequent visists in dev mode.

// Note this doesn't always immediately fix the problem - if the server used
// to serve the production app has a long cache header for /service-worker.js,
// this noop service worker will not be able to take effect. In such cases,
// the developer will have to manually unregister the service worker in
// Chrome Devtools -> Application -> Service Workers

const fs = require('fs');
const path = require('path');

// language=JS
const resetScript = `
/* eslint-disable no-restricted-globals */

// This service worker file is effectively a 'no-op' that will reset any
// previous service worker registered for the same host:port combination.

// It is read and returned by a dev server middleware that is only loaded
// during development.

// In the production build, this file is replaced with an actual service worker
// file that will precache your site's local assets.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', () => {
  self.clients.matchAll({ type: 'window' }).then((windowClients) => {
    windowClients.forEach((windowClient) => {
      windowClient.navigate(windowClient.url);
    });
  });
});
`;

module.exports = function createNoopServiceWorkerMiddleware() {
  return function noopServiceWorkerMiddleware(req, res, next) {
    if (req.url === '/service-worker.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.send(resetScript);
    } else {
      next();
    }
  };
};
