// Naikkan angka versi ini setiap kali index.html diubah agar HP memuat versi baru.
const V = 'mylist-v3', FONTS = 'mylist-fonts';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  if (u.origin === location.origin) {
    // Halaman: coba jaringan dulu (agar update cepat), jika offline pakai cache.
    if (r.mode === 'navigate') {
      e.respondWith(
        fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; })
          .catch(() => caches.match('index.html'))
      );
      return;
    }
    // Berkas lain: cache dulu.
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }))
    );
    return;
  }

  // Font Google: simpan setelah pertama kali dimuat agar tampil juga saat offline.
  if (/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(
      caches.open(FONTS).then(c => c.match(r).then(hit => hit ||
        fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => hit)))
    );
  }
});
