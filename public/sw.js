// Service Worker para funcionalidad offline
// Versión del service worker
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `plataforma-inmobiliaria-${CACHE_VERSION}`;

// Recursos críticos para cache inmediato
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Recursos adicionales para cache
const ADDITIONAL_RESOURCES = [
  '/about',
  '/portfolio',
  '/static/media/',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  // Cache first: intenta cache primero, luego red
  CACHE_FIRST: 'cache-first',
  // Network first: intenta red primero, luego cache
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate: sirve cache mientras actualiza en background
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network only: solo red
  NETWORK_ONLY: 'network-only'
};

// Función para determinar estrategia de cache por URL
function getCacheStrategy(url) {
  if (url.includes('/api/') || url.includes('supabase')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  if (url.includes('.js') || url.includes('.css') || url.includes('.woff')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  if (url.includes('/static/') || url.includes('/media/')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Evento de instalación
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Cache recursos críticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching critical resources...');
        return cache.addAll(CRITICAL_RESOURCES);
      }),

      // Skip waiting para activar inmediatamente
      self.skipWaiting()
    ])
  );
});

// Evento de activación
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Tomar control de todos los clientes
      self.clients.claim()
    ])
  );
});

// Evento de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen (excepto APIs externas)
  if (url.origin !== self.location.origin && !url.hostname.includes('supabase')) {
    return;
  }

  // Ignorar requests no-GET
  if (request.method !== 'GET') {
    return;
  }

  const strategy = getCacheStrategy(request.url);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(fetch(request));
  }
});

// Estrategia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('Cache First strategy failed:', error);
    // Fallback a página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network First: falling back to cache');

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback para requests de datos
    if (request.url.includes('/api/') || request.url.includes('supabase')) {
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'Esta funcionalidad no está disponible sin conexión a internet'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback a página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Responder con cache inmediatamente si existe
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.warn('Stale while revalidate fetch failed:', error);
  });

  // Devolver cache si existe, sino esperar por network
  if (cachedResponse) {
    // Actualizar en background
    fetchPromise;
    return cachedResponse;
  }

  // No hay cache, esperar por network
  try {
    return await fetchPromise;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Evento de sincronización en background (cuando recupera conexión)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Función de sincronización en background
async function doBackgroundSync() {
  try {
    console.log('🔄 Performing background sync...');

    // Aquí irían las operaciones pendientes guardadas localmente
    // Por ejemplo: enviar comunicaciones pendientes, actualizar estados, etc.

    // Notificar al cliente principal
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });

  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Evento de mensajes desde el cliente principal
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATS':
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        event.ports[0].postMessage({
          cacheSize: keys.length,
          cacheNames: keys.map(req => req.url)
        });
      });
      break;

    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        console.log('🗑️ Cache cleared by client request');
        event.ports[0].postMessage({ success: true });
      });
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Evento de notificaciones push (para futuras funcionalidades)
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Logging de errores
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('🎉 Service Worker loaded and ready!');