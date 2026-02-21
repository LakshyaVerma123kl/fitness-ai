self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // For API routes — always go to network WITH credentials, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request.url, {
        method: request.method,
        headers: request.headers,
        credentials: "include", // ← THIS is what was missing
        body: request.method !== "GET" ? request.body : undefined,
      }).catch(() => Response.json({ error: "Offline" }, { status: 503 })),
    );
    return;
  }

  // Cache-first for static assets only
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches
            .open("fitnessai-v1")
            .then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }),
  );
});
