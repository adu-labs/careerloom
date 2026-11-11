import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPrototypeHarness, templateFixture } from './helpers.mjs';

test('deleting every resume remains a valid workspace after reload', () => {
  const initial = createPrototypeHarness();
  initial.evaluate('state.resumes = []; mode = "campus"; persist()');
  const stored = initial.storage.get('qicheng-prototype-v1');
  const restored = createPrototypeHarness({ stored });
  assert.equal(restored.evaluate('state.resumes.length'), 0);
  assert.match(restored.evaluate('resumes()'), /还没有简历/);
});

test('imported template names are rendered as text in the resume wizard', () => {
  const app = createPrototypeHarness();
  app.evaluate(`mode='campus'; state.privateTemplates.push({id:'private-fixture',status:'ready',name:'<img src=x onerror="alert(1)">',design:${JSON.stringify(templateFixture('fixture').design)}}); resumeWizard()`);
  const html = app.element('dialog').innerHTML;
  assert.ok(!html.includes('<img src=x'), 'template names must never become HTML');
  assert.match(html, /&lt;img src=x/);
});

test('the latest selected template file owns the import result', async () => {
  const app = createPrototypeHarness();
  app.evaluate('openTemplateImport()');
  const changed = app.element('template-file').onchange;
  let resolveOld;
  const oldText = new Promise(resolve => { resolveOld = resolve; });
  const oldRead = changed({ target: { files: [{ name: 'old.json', size: 200, text: () => oldText }] } });
  await changed({ target: { files: [{ name: 'latest.json', size: 200, text: async () => JSON.stringify(templateFixture('新选择')) }] } });
  resolveOld(JSON.stringify(templateFixture('旧选择')));
  await oldRead;
  assert.equal(app.evaluate('pendingTemplate.name'), '新选择');
});

test('a file read finishing after the import dialog closes cannot restore a pending template', async () => {
  const app = createPrototypeHarness();
  app.evaluate('openTemplateImport()');
  let resolveText;
  const text = new Promise(resolve => { resolveText = resolve; });
  const read = app.element('template-file').onchange({ target: { files: [{ name: 'closed.json', size: 200, text: () => text }] } });
  app.evaluate('close()');
  resolveText(JSON.stringify(templateFixture('已关闭')));
  await read;
  assert.equal(app.evaluate('pendingTemplate'), null);
  assert.equal(app.element('template-import-save').disabled, true);
});

test('a failed latest selection stays disabled even when an older valid read finishes', async () => {
  const app = createPrototypeHarness();
  app.evaluate('openTemplateImport()');
  const changed = app.element('template-file').onchange;
  let resolveOld;
  const text = new Promise(resolve => { resolveOld = resolve; });
  const read = changed({ target: { files: [{ name: 'old.json', size: 200, text: () => text }] } });
  await changed({ target: { files: [{ name: 'bad.json', size: 10, text: async () => '{broken' }] } });
  resolveOld(JSON.stringify(templateFixture('不能覆盖错误')));
  await read;
  assert.equal(app.evaluate('pendingTemplate'), null);
  assert.equal(app.element('template-import-save').disabled, true);
  assert.match(app.element('template-import-result').innerHTML, /JSON 格式错误/);
});

test('oversized template files are rejected before reading their contents', async () => {
  const app = createPrototypeHarness();
  app.evaluate('openTemplateImport()');
  let read = false;
  await app.element('template-file').onchange({ target: { files: [{ name: 'large.json', size: 512 * 1024 + 1, text: async () => { read = true; return ''; } }] } });
  assert.equal(read, false);
  assert.equal(app.evaluate('pendingTemplate'), null);
  assert.match(app.element('template-import-result').innerHTML, /超过 512 KB/);
});

for (const stored of ['{broken', '{"mode":"campus","resumes":[]}']) {
  test(`unreadable snapshot is preserved until an explicit reset: ${stored}`, () => {
    const app = createPrototypeHarness({ stored });
    assert.equal(app.evaluate('storageRecovery.raw'), stored);
    app.evaluate("chooseMode('campus'); persist()");
    assert.equal(app.storage.get('qicheng-prototype-v1'), stored);
    assert.match(app.evaluate('renderStorageRecovery()'), /下载原始数据备份/);
    app.evaluate("action('reset-confirm')");
    assert.equal(app.evaluate('storageRecovery'), null);
    assert.equal(JSON.parse(app.storage.get('qicheng-prototype-v1')).resumes.length, 4);
  });
}

test('loading valid older data keeps records and lets existing migrations add optional collections', () => {
  const initial = createPrototypeHarness();
  const stored = initial.evaluate('JSON.stringify(seed)');
  const app = createPrototypeHarness({ stored });
  assert.equal(app.evaluate('storageRecovery'), null);
  assert.equal(app.evaluate('state.resumes[0].name'), '后端研发 · 通用版');
  assert.equal(app.evaluate('Array.isArray(state.todos) && Array.isArray(state.privateTemplates)'), true);
});
