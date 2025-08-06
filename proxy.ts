// proxy.ts
// 运行：deno run -A proxy.ts
// 部署：deployctl deploy --project=my-proxy proxy.ts

const TARGET = "https://www.baidu.com";   // ← 改成你要代理的站点

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
};

export default async (req: Request): Promise<Response> => {
  // 1. 预检 OPTIONS
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  // 2. 把当前请求路径拼到目标域名后面
  const url = new URL(req.url);
  const targetUrl = new URL(url.pathname + url.search, TARGET);

  // 3. 构造并转发
  const newReq = new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
  const resp = await fetch(newReq);

  // 4. 复制响应头
  const newHeaders = new Headers(resp.headers);
  ["content-encoding", "content-length"].forEach((h) => newHeaders.delete(h));
  Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));

  // 5. 返回
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: newHeaders,
  });
};

// 本地调试
if (import.meta.main) {
  Deno.serve({ port: 8000 }, (req) => import.meta.default!(req));
}
