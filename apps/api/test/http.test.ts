import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

// 使用编译后的真实入口验证启动失败与信号，而不是仅 mock bootstrap 函数。
function startProcess(extra: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../src/main.js', import.meta.url))], {
    env: { ...process.env, APP_ENV: 'test', API_HOST: '127.0.0.1', ...extra },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
  const closed = once(child, 'close');
  return { child, closed, output: () => ({ stdout, stderr }) };
}

test('live endpoint, cache policy and unknown route work over real HTTP', async () => {
  const app = await createApp();
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const response = await fetch(`${base}/v1/health/live`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { status: 'ok', service: 'careerloom-api' });
    assert.equal((await fetch(`${base}/v1/unknown`)).status, 404);
    assert.equal((await fetch(`${base}/v1/health/ready`)).status, 404);
  } finally {
    await app.close();
  }
});

test('invalid startup exits nonzero without echoing input', { timeout: 10000 }, async (t) => {
  const run = startProcess({ API_PORT: 'secret-value' });
  t.after(() => { run.child.kill('SIGKILL'); });
  const [code] = await run.closed;
  assert.equal(code, 1);
  assert.match(run.output().stderr, /api_start_failed/);
  assert.doesNotMatch(run.output().stderr, /secret-value/);
  assert.equal(run.output().stdout, '');
});

test('occupied port exits nonzero instead of leaving a running process', { timeout: 10000 }, async (t) => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.close(); });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const run = startProcess({ API_PORT: String(address.port) });
  t.after(() => { run.child.kill('SIGKILL'); });
  const [code] = await run.closed;
  assert.equal(code, 1);
  assert.match(run.output().stderr, /already in use/);
});

test('SIGTERM closes an actually started API', { timeout: 10000 }, async (t) => {
  // 先分配可用端口再释放；若被抢占应让测试失败，不能伪报启动成功。
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  await new Promise<void>((resolveClose) => reservation.close(() => resolveClose()));
  const run = startProcess({ API_PORT: String(address.port) });
  t.after(() => { run.child.kill('SIGKILL'); });
  const started = new Promise<void>((resolveStarted, reject) => {
    run.child.stdout.on('data', () => {
      if (run.output().stdout.includes('api_started')) resolveStarted();
    });
    run.closed.then(() => reject(new Error('process closed before startup')), reject);
  });
  await started;
  const response = await fetch(`http://127.0.0.1:${address.port}/v1/health/live`);
  assert.equal(response.status, 200);
  run.child.kill('SIGTERM');
  const [code, signal] = await run.closed;
  assert.ok(code === 0 || signal === 'SIGTERM');
  await assert.rejects(fetch(`http://127.0.0.1:${address.port}/v1/health/live`));
});
