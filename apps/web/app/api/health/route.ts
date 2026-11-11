/**
 * 仅为 Web 提供 API 存活探测，不是通用反向代理，也不承载业务规则。
 * 浏览器 → 本同源 GET → 固定的 Nest /v1/health/live，避免开放 CORS。
 * 不转发用户 cookie/鉴权头、任意 URL 或上游错误原文；无存储与写入副作用。
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UPSTREAM_TIMEOUT_MS = 3_000;
// 正常响应只有几十字节；限制响应体，避免误配到下载页面时持续占用内存。
const MAX_BODY_BYTES = 1_024;

function reply(body: object, status: number): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** 只接受运维配置的 origin；拒绝凭证、路径和查询参数，不能由请求参数指定。 */
function readOrigin(): string {
  const value = process.env.API_ORIGIN ?? (process.env.NODE_ENV === 'production'
    ? '' : 'http://127.0.0.1:3001');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash || value.trim() !== value) {
    throw new Error('Invalid API origin');
  }
  return url.origin;
}

/** 读取有大小上限的 JSON；失败时取消剩余流并释放 reader。 */
async function readLiveBody(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing response body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error('Response too large');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } finally {
    // 正常读取结束时 cancel 无副作用；超长、断连或超时时也清理资源。
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

/**
 * 成功返回固定存活契约；配置错误 500、上游失败/错服务/无效 JSON 502、超时 504。
 * 超时覆盖连接和读取响应体；客户端断开时向上游传播取消，不进行自动重试。
 */
export async function GET(request: Request): Promise<Response> {
  let origin: string;
  try {
    origin = readOrigin();
  } catch {
    return reply({ status: 'unavailable', reason: 'configuration' }, 500);
  }

  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(`${origin}/v1/health/live`, {
      signal: AbortSignal.any([request.signal, timeout]),
      cache: 'no-store',
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    });
    // 不跟随上游重定向，避免误配把探测变成对第三方地址的访问。
    if (!response.ok) {
      await response.body?.cancel();
      return reply({ status: 'unavailable', reason: 'upstream' }, 502);
    }
    const body = await readLiveBody(response);
    if (typeof body !== 'object' || body === null || !('status' in body)
        || body.status !== 'ok' || !('service' in body) || body.service !== 'careerloom-api') {
      return reply({ status: 'unavailable', reason: 'invalid_response' }, 502);
    }
    // 丢弃额外字段，避免上游以后新增敏感信息时意外透传到匿名页面。
    return reply({ status: 'ok', service: 'careerloom-api' }, 200);
  } catch {
    return reply({ status: 'unavailable', reason: timeout.aborted ? 'timeout' : 'upstream' },
      timeout.aborted ? 504 : 502);
  }
}
