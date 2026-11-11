import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { after, before, beforeEach, describe, it } from 'node:test';
import { GET } from '../app/api/health/route.ts';

/**
 * 使用临时端口上的合成 HTTP 服务，验证真实 fetch、响应流、超时和重定向边界。
 * 不访问外网、不依赖 Nest 进程；真实 Nest ↔ Next ↔ 浏览器链路另做集成验收。
 */
describe('Web health adapter', { concurrency: false }, () => {
  let server: Server;
  let origin: string;
  let mode = 'ok';
  let seenPath: string | undefined;
  let seenHeaders: Record<string, string | string[] | undefined>;
  let requests = 0;
  const originalOrigin = process.env.API_ORIGIN;
  const originalNodeEnv = process.env.NODE_ENV;
  // Next 将 NODE_ENV 声明为只读；测试用可写视图切换环境分支，并在 after 完整还原。
  const testEnvironment: Record<string, string | undefined> = process.env;

  before(async () => {
    server = createServer((request, response) => {
      requests += 1;
      seenPath = request.url;
      seenHeaders = request.headers;
      if (mode === 'stalled-headers') return;
      if (mode === 'stalled-body') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write('{');
        return;
      }
      if (mode === 'redirect') {
        response.writeHead(302, { Location: `${origin}/must-not-follow` });
        response.end();
        return;
      }
      response.setHeader('Content-Type', 'application/json');
      if (mode === 'error') {
        response.statusCode = 503;
        response.end('synthetic-private-detail');
      } else if (mode === 'malformed') response.end('{broken');
      else if (mode === 'large') response.end('x'.repeat(2048));
      else if (mode === 'wrong-service') response.end(JSON.stringify({ status: 'ok', service: 'unrelated' }));
      else response.end(JSON.stringify({ status: 'ok', service: 'careerloom-api', extra: 'must-not-forward' }));
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    origin = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    process.env.API_ORIGIN = origin;
    testEnvironment.NODE_ENV = 'test';
    mode = 'ok';
    requests = 0;
  });

  after(async () => {
    // 不用赋值 undefined：process.env 会把它变成字符串，影响同进程后续测试。
    if (originalOrigin === undefined) delete process.env.API_ORIGIN;
    else process.env.API_ORIGIN = originalOrigin;
    if (originalNodeEnv === undefined) delete testEnvironment.NODE_ENV;
    else testEnvironment.NODE_ENV = originalNodeEnv;
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('returns only the fixed contract, uses a fixed target and does not forward credentials', async () => {
    const response = await GET(new Request('http://web.example/api/health?url=https://invalid.example', {
      headers: { Cookie: 'session=synthetic', Authorization: 'Bearer synthetic' },
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { status: 'ok', service: 'careerloom-api' });
    assert.equal(seenPath, '/v1/health/live');
    assert.equal(seenHeaders.cookie, undefined);
    assert.equal(seenHeaders.authorization, undefined);
  });

  it('rechecks on every request, reports an upstream failure safely, then recovers', async () => {
    mode = 'error';
    const failed = await GET(new Request('http://web.example/api/health'));
    assert.equal(failed.status, 502);
    assert.equal(failed.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await failed.json(), { status: 'unavailable', reason: 'upstream' });
    mode = 'ok';
    assert.equal((await GET(new Request('http://web.example/api/health'))).status, 200);
    assert.equal(requests, 2);
  });

  for (const invalid of ['wrong-service', 'malformed', 'large']) {
    it(`rejects ${invalid} responses instead of showing a successful connection`, async () => {
      mode = invalid;
      const response = await GET(new Request('http://web.example/api/health'));
      assert.equal(response.status, 502);
      assert.equal((await response.json()).status, 'unavailable');
    });
  }

  it('does not follow upstream redirects', async () => {
    mode = 'redirect';
    assert.equal((await GET(new Request('http://web.example/api/health'))).status, 502);
    assert.equal(requests, 1);
    assert.equal(seenPath, '/v1/health/live');
  });

  it('rejects invalid/missing production configuration without echoing it or making requests', async () => {
    const invalidValues = ['', 'not-a-url', 'file:///tmp/synthetic', `${origin}/api`,
      `${origin}?key=synthetic`, `${origin}#synthetic`, 'http://synthetic:secret@localhost'];
    for (const value of invalidValues) {
      process.env.API_ORIGIN = value;
      const response = await GET(new Request('http://web.example/api/health'));
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { status: 'unavailable', reason: 'configuration' });
    }
    delete process.env.API_ORIGIN;
    testEnvironment.NODE_ENV = 'production';
    assert.equal((await GET(new Request('http://web.example/api/health'))).status, 500);
    assert.equal(requests, 0);
  });

  for (const stalled of ['stalled-headers', 'stalled-body']) {
    it(`times out when ${stalled}, including while reading the body`, async () => {
      mode = stalled;
      const response = await GET(new Request('http://web.example/api/health'));
      assert.equal(response.status, 504);
      assert.deepEqual(await response.json(), { status: 'unavailable', reason: 'timeout' });
    });
  }

  it('cancels upstream work when the caller aborts', async () => {
    mode = 'stalled-body';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 50);
    try {
      const response = await GET(new Request('http://web.example/api/health', { signal: controller.signal }));
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), { status: 'unavailable', reason: 'upstream' });
    } finally {
      clearTimeout(timer);
    }
  });
});
