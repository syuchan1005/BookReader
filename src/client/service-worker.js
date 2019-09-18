/* global workbox */ /* eslint-disable no-underscore-dangle,no-restricted-globals, default-case */
workbox.core.setCacheNameDetails({ prefix: 'bookReader' });
workbox.core.skipWaiting(); workbox.core.clientsClaim();
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
workbox.routing.registerRoute(
  /^\/book\/([a-f0-9-]{36})\/(\d+)_(\d*)x(\d*)\.jpg$/,
  new workbox.strategies.CacheFirst(),
  'GET',
);
addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;
  let cb;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      // eslint-disable-next-line no-undef
      skipWaiting();
      return;
    case 'BOOK_CACHE':
      cb = (cache, urls) => cache.addAll(urls);
      break;
    case 'BOOK_REMOVE':
      cb = (cache, urls) => urls.forEach((k) => cache.delete(k));
      break;
  }
  if (cb) {
    const pad = event.data.pages.toString(10).length;
    const urls = [...Array(event.data.pages).keys()]
      .map((i) => `/book/${event.data.bookId}/${i.toString(10).padStart(pad, '0')}.jpg`);
    event.waitUntil(caches.open(workbox.core.cacheNames.runtime).then((cache) => cb(cache, urls)));
  }
});
