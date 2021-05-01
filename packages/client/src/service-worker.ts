import { skipWaiting, clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

setCacheNameDetails({ prefix: 'bookReader' });
skipWaiting();
clientsClaim();
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);


// https://github.com/GoogleChrome/workbox/issues/1599
registerRoute(/^https:\/\/fonts\.googleapis\.com/, new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' }));
registerRoute(/^https:\/\/fonts\.gstatic\.com/, new CacheFirst({ cacheName: 'google-fonts-webfonts', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 })] }));

const BookImageCacheName = 'bookReader-images';
registerRoute(
  /\/book\/([a-f0-9-]{36})\/(\d+)(_(\d+)x(\d+))?\.jpg(\.webp)?[^?nosave]/,
  new StaleWhileRevalidate({
    cacheName: BookImageCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  }),
  'GET',
);
registerRoute(
  /\/book\/([a-f0-9-]{36})\/(\d+)(_(\d+)x(\d+))?\.jpg(\.webp)?\?nosave/,
  new StaleWhileRevalidate({
    cacheName: `${BookImageCacheName}-expires`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 day
      }),
    ],
  }),
  'GET',
);

addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;
  let cb;
  switch (event.data.type) {
    case 'SKIP_WAITING':
      skipWaiting();
      return;
    case 'BOOK_CACHE':
      if (!event.clientId) return;
      cb = (cache, urls) => event.waitUntil((async () => {
        await cache.addAll(urls);
        const client = await self.clients.get(event.clientId);
        if (client) client.postMessage({ type: 'BOOK_CACHE', state: 'Finish' });
      })());
      break;
    case 'BOOK_REMOVE':
      cb = (cache, urls) => urls.forEach((k) => cache.delete(k));
      break;
    case 'PURGE_CACHE':
      event.waitUntil((async () => {
        const ks = await caches.keys();
        await Promise.all(ks.map((k) => caches.delete(k)));
        const client = await self.clients.get(event.clientId);
        if (client) client.postMessage({ type: 'PURGE_CACHE', state: 'Finish' });
      })());
      return;
  }
  if (cb) {
    const pad = event.data.pages.toString(10).length;
    const urls = [...Array(event.data.pages).keys()]
      .map((i) => `/book/${event.data.bookId}/${i.toString(10).padStart(pad, '0')}.jpg`);
    event.waitUntil(caches.open(BookImageCacheName).then((cache) => cb(cache, urls)));
  }
});