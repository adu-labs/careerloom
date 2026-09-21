import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConfig } from '../src/config.js';

test('local defaults bind only to loopback', () => {
  assert.deepEqual(readConfig({}), { environment: 'development', host: '127.0.0.1', port: 3001 });
  assert.ok(Object.isFrozen(readConfig({})));
});

test('deployment configuration must be explicit', () => {
  for (const APP_ENV of ['staging', 'production']) {
    assert.throws(() => readConfig({ APP_ENV }), /required/);
    assert.throws(() => readConfig({ APP_ENV, API_HOST: '0.0.0.0' }), /required/);
    assert.equal(readConfig({ APP_ENV, API_HOST: '0.0.0.0', API_PORT: '8080' }).port, 8080);
  }
});

test('invalid ports cannot be partially parsed or exposed in errors', () => {
  for (const API_PORT of ['', '0', '-1', '65536', '1.5', '3001oops', ' 3001', 'NaN', 'secret-value']) {
    assert.throws(() => readConfig({ API_PORT }), {
      message: 'API_PORT must be an integer between 1 and 65535',
    });
  }
  for (const API_PORT of ['1', '65535']) assert.equal(readConfig({ API_PORT }).port, Number(API_PORT));
});

test('unknown environment and bind address fail early', () => {
  assert.throws(() => readConfig({ APP_ENV: 'prod' }), /APP_ENV/);
  assert.throws(() => readConfig({ API_HOST: 'https://example.com' }), /API_HOST/);
});
