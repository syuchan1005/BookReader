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
  if (!event.data || !event.data.type || !event.clientId) return;
  let cb;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      // eslint-disable-next-line no-undef
      skipWaiting();
      return;
    case 'BOOK_CACHE':
      cb = (cache, urls) => event.waitUntil((async () => {
        await cache.addAll(urls);
        const client = await self.clients.get(event.clientId);
        if (client) client.postMessage({ type: 'BOOK_CACHE', state: 'Finish' });
      })());
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
