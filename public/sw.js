/**
 * Service Worker for My Image Library
 *
 * 提供离线缓存策略和性能优化
 */

const CACHE_NAME = 'roboneo-image-library-v2';
const CACHE_VERSION = '1.1.0';

// 静态资源缓存策略 - 只缓存确实存在的资源
const STATIC_CACHE_RESOURCES = [
  '/',
  // 为避免安装阶段触发 SSR/函数请求，不预缓存 /my-library 页面
];

// 动态缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：Cache First
  static: {
    pattern: /\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/,
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
  },

  // API 接口：Network First with fallback
  api: {
    pattern: /^\/api\//,
    strategy: 'NetworkFirst',
    maxAge: 5 * 60 * 1000, // 5分钟
  },

  // 页面：Network First
  pages: {
    pattern: /^\/(?!api\/)/,
    strategy: 'NetworkFirst',
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  },

  // 图片资源：Cache First (补充 IndexedDB)
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/,
    strategy: 'CacheFirst',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  }
};

/**
 * Service Worker 安装事件
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching static resources...');

        // 逐个添加资源，避免单个失败影响整体
        const cachePromises = STATIC_CACHE_RESOURCES.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] Cached: ${url}`);
            } else {
              console.warn(`[SW] Failed to cache ${url}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`[SW] Error caching ${url}:`, error);
          }
        });

        await Promise.allSettled(cachePromises);
        console.log('[SW] Static resources caching completed');
        return self.skipWaiting(); // 立即激活新版本
      })
      .catch((error) => {
        console.error('[SW] Failed to open cache:', error);
      })
  );
});

/**
 * Service Worker 激活事件
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本缓存
            if (cacheName !== CACHE_NAME && cacheName.startsWith('roboneo-image-library-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // 立即控制所有页面
      })
      .catch((error) => {
        console.error('[SW] Failed to activate service worker:', error);
      })
  );
});

/**
 * Service Worker fetch 事件 - 网络请求拦截
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 不拦截 Next.js 内部资源，避免开发环境 ChunkLoadError
  if (url.pathname.startsWith('/_next/')) {
    return; // 让浏览器直接从网络加载，不参与缓存
  }

  // 跳过某些请求类型
  if (shouldSkipRequest(request)) {
    return;
  }

  // 根据请求类型应用不同缓存策略
  const strategy = getCacheStrategy(request);

  if (strategy) {
    event.respondWith(handleRequest(request, strategy));
  }
});

/**
 * 判断是否应该跳过请求
 */
function shouldSkipRequest(request) {
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') return true;

  // 跳过 Next 开发相关请求
  if (url.pathname.includes('_next/webpack-hmr')) return true;
  if (url.pathname.includes('__nextjs_original-stack-frame')) return true;
  if (url.pathname.startsWith('/_next/')) return true;

  // 跳过 Chrome 扩展等
  if (!url.protocol.startsWith('http')) return true;

  // 跳过认证相关路由，避免影响登录/重定向流程
  if (url.pathname.startsWith('/auth')) return true;
  if (url.pathname.startsWith('/api/auth')) return true;

  return false;
}

/**
 * 根据请求获取缓存策略
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API 请求
  if (CACHE_STRATEGIES.api.pattern.test(pathname)) {
    return CACHE_STRATEGIES.api;
  }

  // 静态资源
  if (CACHE_STRATEGIES.static.pattern.test(pathname)) {
    return CACHE_STRATEGIES.static;
  }

  // 图片资源
  if (CACHE_STRATEGIES.images.pattern.test(pathname)) {
    return CACHE_STRATEGIES.images;
  }

  // 页面请求
  if (CACHE_STRATEGIES.pages.pattern.test(pathname)) {
    return CACHE_STRATEGIES.pages;
  }

  return null;
}

/**
 * 处理网络请求
 */
async function handleRequest(request, strategy) {
  const { strategy: strategyType, maxAge } = strategy;

  try {
    switch (strategyType) {
      case 'CacheFirst':
        return await cacheFirstStrategy(request, maxAge);

      case 'NetworkFirst':
        return await networkFirstStrategy(request, maxAge);

      default:
        return await fetch(request);
    }
  } catch (error) {
    console.error('[SW] Request failed:', request.url, error);

    // 返回离线页面或默认响应
    return await getOfflineFallback(request);
  }
}

/**
 * Cache First 策略 - 优先使用缓存
 */
async function cacheFirstStrategy(request, maxAge) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    console.log('[SW] Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('[SW] Cache miss, fetching:', request.url);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 克隆响应用于缓存，避免 body 被锁定
      const responseClone = networkResponse.clone();

      // 直接缓存克隆的响应
      cache.put(request, responseClone);
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed, using stale cache:', request.url);
  }

  // 网络失败时返回过期缓存
  return cachedResponse || await getOfflineFallback(request);
}

/**
 * Network First 策略 - 优先使用网络
 */
async function networkFirstStrategy(request, maxAge) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // 始终将网络响应返回给浏览器（包括 3xx/4xx/5xx），
    // 让浏览器正确处理重定向/错误。仅在成功时写入缓存。
    if (networkResponse && networkResponse.ok) {
      console.log('[SW] Network success:', request.url);
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
  }

  // 网络失败时使用缓存
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    console.log('[SW] Using cached response:', request.url);
    return cachedResponse;
  }

  return await getOfflineFallback(request);
}

/**
 * 检查缓存是否过期
 */
function isExpired(response, maxAge) {
  // 使用响应的 Date 头或缓存时间来判断过期
  const dateHeader = response.headers.get('date');
  const cacheTime = response.headers.get('sw-cached-at');

  let responseTime;
  if (cacheTime) {
    responseTime = parseInt(cacheTime, 10);
  } else if (dateHeader) {
    responseTime = new Date(dateHeader).getTime();
  } else {
    // 如果没有时间信息，假设缓存有效
    return false;
  }

  const age = Date.now() - responseTime;
  return age > maxAge;
}

/**
 * 获取离线回退响应
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // 页面请求的离线回退
  if (request.destination === 'document') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Roboneo</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding: 50px;
              background: #f5f5f5;
              color: #333;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #555; margin-bottom: 10px; }
            p { color: #777; line-height: 1.5; }
            button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover { background: #0056b3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>Your image library is available offline! The images you've saved are still accessible.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // API 请求的离线回退
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'This feature requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 其他请求返回网络错误
  return new Response('Network Error', { status: 503 });
}

/**
 * 清理过期缓存
 */
async function cleanupExpiredCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  let cleaned = 0;

  for (const request of requests) {
    const response = await cache.match(request);

    if (response) {
      // 检查所有策略的过期时间
      let isExpiredItem = false;

      for (const strategy of Object.values(CACHE_STRATEGIES)) {
        if (strategy.pattern.test(request.url) && isExpired(response, strategy.maxAge)) {
          isExpiredItem = true;
          break;
        }
      }

      if (isExpiredItem) {
        await cache.delete(request);
        cleaned++;
      }
    }
  }

  if (cleaned > 0) {
    console.log(`[SW] Cleaned ${cleaned} expired cache entries`);
  }
}

/**
 * 定期清理过期缓存
 */
setInterval(() => {
  cleanupExpiredCache().catch(console.error);
}, 60 * 60 * 1000); // 每小时清理一次

/**
 * 消息处理 - 用于与主线程通信
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;

    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * 获取缓存状态
 */
async function getCacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  let totalSize = 0;
  const byType = {
    static: 0,
    api: 0,
    pages: 0,
    images: 0,
    other: 0
  };

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const size = parseInt(response.headers.get('content-length') || '0', 10);
      totalSize += size;

      // 按类型分类
      const url = new URL(request.url);
      if (CACHE_STRATEGIES.static.pattern.test(url.pathname)) {
        byType.static++;
      } else if (CACHE_STRATEGIES.api.pattern.test(url.pathname)) {
        byType.api++;
      } else if (CACHE_STRATEGIES.images.pattern.test(url.pathname)) {
        byType.images++;
      } else if (CACHE_STRATEGIES.pages.pattern.test(url.pathname)) {
        byType.pages++;
      } else {
        byType.other++;
      }
    }
  }

  return {
    totalItems: requests.length,
    totalSize,
    byType,
    cacheVersion: CACHE_VERSION
  };
}

/**
 * 清理所有缓存
 */
async function clearCache() {
  await caches.delete(CACHE_NAME);
  console.log('[SW] All cache cleared');
}
