const CACHE_NAME = 'inspektor-v1';

// Pre-cache the app shell
const PRECACHE_URLS = ['/'];

// ── IndexedDB helpers for Web Share Target ────────────────────────────────
// Files received via share are stored here so they never hit the server,
// sidestepping any body-size limits on the hosting platform.
const SHARE_DB_NAME = 'inspektor-shares';
const SHARE_DB_VERSION = 1;
const SHARE_STORE = 'pending-files';

function openShareDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(SHARE_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function addShareEntry(db, entry) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE, 'readwrite');
    tx.objectStore(SHARE_STORE).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const db = await openShareDB();

    const sharedFiles = formData.getAll('files');
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';

    for (const file of sharedFiles) {
      if (file instanceof File && file.size > 0) {
        const data = await file.arrayBuffer();
        await addShareEntry(db, {
          id: crypto.randomUUID(),
          name: file.name || 'shared-file',
          type: file.type || 'application/octet-stream',
          size: file.size,
          data,
          receivedAt: Date.now(),
        });
      }
    }

    // If no files were shared but there is text/url content, save it as a txt
    const textContent = [title, text, url].filter(Boolean).join('\n');
    if (sharedFiles.length === 0 && textContent) {
      const encoded = new TextEncoder().encode(textContent).buffer;
      await addShareEntry(db, {
        id: crypto.randomUUID(),
        name: title ? `${title.slice(0, 60)}.txt` : 'shared.txt',
        type: 'text/plain',
        size: encoded.byteLength,
        data: encoded,
        receivedAt: Date.now(),
      });
    }

    db.close();
  } catch (err) {
    console.error('[SW] Share target error:', err);
  }

  // Redirect into the app; the ShareReceiver component will pick up the files
  return Response.redirect('/?share=1', 303);
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Web Share Target POST — must come before the GET-only guard below
  if (url.pathname === '/share-target' && request.method === 'POST') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // For navigation requests: network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // For Next.js static chunks: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // For everything else: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
