/* global workbox */ /* eslint-disable no-underscore-dangle,no-restricted-globals, default-case */
workbox.core.setCacheNameDetails({ prefix: 'bookReader' });
workbox.core.skipWaiting(); workbox.core.clientsClaim();
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.routing.registerRoute(
  /^\/book\/([a-f0-9-]{36})\/(\d+)(_(\d*)x(\d*))?\.jpg(\.webp)?/,
  new workbox.strategies.CacheFirst(),
  'GET',
);
addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      // eslint-disable-next-line no-undef
      skipWaiting();
  }
});
