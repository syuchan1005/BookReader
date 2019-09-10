/* global workbox */ /* eslint-disable no-underscore-dangle,no-restricted-globals */
workbox.core.setCacheNameDetails({ prefix: 'bookReader' });
workbox.core.skipWaiting(); workbox.core.clientsClaim();
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.routing.registerRoute(/book\/[0-9a-fA-F-]{36}\/[0-9]+\.jpg$/, new workbox.strategies.CacheFirst(), 'GET');
