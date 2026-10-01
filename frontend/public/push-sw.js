/* Web Push for USWAG. Imported by the generated service worker (vite.config.ts → workbox.importScripts),
   so it shares that worker's lifetime and update flow. Plain JS: it runs outside the app bundle. */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { body: event.data ? event.data.text() : '' };
  }
  // Browsers require every push to show a notification (userVisibleOnly), so always show one.
  event.waitUntil(
    self.registration.showNotification(data.title || 'USWAG', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // The URL comes from our server, but never navigate anywhere off this site.
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin);
  if (target.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const open = windows.find((w) => new URL(w.url).origin === target.origin);
      if (open) {
        try {
          await open.focus();
          await open.navigate(target.href);
          return;
        } catch (err) {
          /* fall through to opening a new window */
        }
      }
      await self.clients.openWindow(target.href);
    })
  );
});
