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
  /\/book\/([a-f0-9-]{36})\/(\d+)(_(\d+)x(\d+))?\.jpg(\.webp)?[^?nosave]$/,
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
/*
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
*/

addEventListener('message', (event) => {
  // When no response, client cannot resolve Promise.
  const postMessage = (arg = true) => event.ports[0].postMessage(arg);
  if (!event.data || !event.data.type) {
    postMessage();
    return;
  }

  const onMessage = async () => {
    let cb: (cache: Cache, urls: string[]) => Promise<any>;
    switch (event.data.type) {
      case 'SKIP_WAITING':
        skipWaiting();
        break;
      case 'PURGE_CACHE':
        const ks = await caches.keys();
        await Promise.all(ks.map((k) => caches.delete(k)));
        break;
      case 'BOOK_CACHE':
        cb = (cache, urls) => cache.addAll(urls);
        break;
      case 'BOOK_REMOVE':
        cb = (cache, urls) => Promise.all(urls.map((k) => cache.delete(k)));
        break;
    }
    if (cb) {
      const pad = event.data.pages.toString(10).length;
      const urls = [...Array(event.data.pages).keys()]
        .map((i) => `/book/${event.data.bookId}/${i.toString(10).padStart(pad, '0')}.jpg`);
      const cache = await caches.open(BookImageCacheName);
      await cb(cache, urls);
    }
    postMessage();
  };

  // @ts-ignore waitUntil is not resolved
  event.waitUntil(onMessage());
});