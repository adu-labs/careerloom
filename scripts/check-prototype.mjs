import { readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

/** 检查真实 HTML 引用的本地文件与脚本语法；不执行页面，不假装完成浏览器验证。 */
const directory = fileURLToPath(new URL('../prototype/dist/', import.meta.url));
const html = readFileSync(resolve(directory, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1].split(/[?#]/)[0]);
let checked = 0;
for (const asset of new Set(assets)) {
  if (!asset || /^(?:https?:|data:|mailto:)/.test(asset)) continue;
  const path = resolve(directory, asset);
  const local = relative(directory, path);
  if (local === '..' || local.startsWith(`..${sep}`) || !statSync(path, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`原型引用了不存在或越界的资源：${asset}`);
  }
  if (asset.endsWith('.js')) {
    const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    checked += 1;
  }
}
console.log(`原型资源存在，${checked} 个脚本语法检查通过。`);
