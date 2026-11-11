import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 只校验仓库 Markdown 的相对文件目标，不访问外网，也不声称校验标题锚点。 */
const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['.git', '.next', '.playwright-mcp', '.sites-runtime', 'node_modules', 'build']);
const files = [];
function collect(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory() && !excluded.has(item.name)) collect(path);
    else if (item.isFile() && item.name.endsWith('.md')) files.push(path);
  }
}
collect(root);
const missing = [];
for (const file of files) {
  for (const match of readFileSync(file, 'utf8').matchAll(/\]\(([^)\n]+)\)/g)) {
    // 教学/审阅模板中的 <相对链接> 是填写位置，真实的带空格路径仍应检查。
    if (relative(root, file).startsWith('docs/templates/') && match[1].includes('<')) continue;
    let target = match[1].replace(/^<|>$/g, '');
    if (target.includes('<') || target.includes('>') || /^[a-z][\w+.-]*:/i.test(target) || target.startsWith('#')) continue;
    try { target = decodeURIComponent(target.split('#')[0]); } catch { missing.push(`${relative(root, file)} → 无效 URL 编码`); continue; }
    if (target && !statSync(resolve(dirname(file), target), { throwIfNoEntry: false })) missing.push(`${relative(root, file)} → ${target}`);
  }
}
if (missing.length) throw new Error(`文档相对链接失效：\n${missing.join('\n')}`);
console.log(`${files.length} 份 Markdown 的相对文件链接检查通过。`);
