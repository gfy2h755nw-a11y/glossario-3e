/* App «Glossari» installata sul telefono: la pagina, i caratteri e le icone restano sul dispositivo, così si apre anche senza internet.
   I termini arrivano sempre dalla rete; senza rete la pagina usa l'ultima copia salvata sul telefono. */
var CACHE = 'glossari-v1';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['/glossario', '/icona-glossari-192.png']); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE && k.indexOf('glossari-') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  // la pagina: prima la rete (sempre aggiornata), senza rete l'ultima copia
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put('/glossario', cp); }); } return res; })
      .catch(function () { return caches.match('/glossario'); }));
    return;
  }
  // caratteri e icone: dalla copia sul telefono
  if (/^\/fonts\/|^\/icona-glossari|^\/apple-touch-glossari/.test(u.pathname)) {
    e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); } return res; }); }));
  }
});
