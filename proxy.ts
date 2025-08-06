
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "*",
};

export default async (req: Request): Promise<Response> => {
  // 1. 预检 OPTIONS 直接返回
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  // 2. 解析目标 URL
  const url = new URL(req.url);
  const target = url.searchParams.get("url");
  if (!target) {
    return new Response("?url= 参数缺失", { status: 400 });
  }

  // 3. 构造新请求
  const targetUrl = new URL(target);
  const newReq = new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  // 4. 转发
  const resp = await fetch(newReq);

  // 5. 复制响应头（过滤掉禁止的）
  const newHeaders = new Headers(resp.headers);
  ["content-encoding", "content-length"].forEach((h) => newHeaders.delete(h));
  Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));

  // 6. 返回流式响应（大文件也 OK）
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
