import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

/**
 * 用轻量 DOM 替身加载真实原型脚本，隔离浏览器存储与全局变量。
 * 只验证状态/转义/异步竞争等逻辑，不用它替代真实浏览器布局和可访问性检查。
 */
export function createPrototypeHarness({ stored, loadTemplates = true } = {}) {
  const elements = new Map();
  const storage = new Map(stored === undefined ? [] : [['qicheng-prototype-v1', stored]]);
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', disabled: false, open: false,
      classList: { add() {}, remove() {} }, addEventListener() {},
      showModal() { this.open = true; }, close() { this.open = false; },
      insertAdjacentHTML() {}, focus() {},
    });
    return elements.get(id);
  };
  const context = createContext({
    console, URL, Blob, AbortController,
    setTimeout: () => 0, clearTimeout() {},
    document: {
      getElementById: element,
      querySelector: selector => ['.intro-foot', '.app-footer', '.top-actions .label'].includes(selector) ? element(selector) : null,
      querySelectorAll: () => [], addEventListener() {},
    },
    window: { addEventListener() {}, scrollTo() {} },
    location: { hash: '' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    history: { replaceState() {} },
  });
  const evaluate = code => runInContext(code, context);
  const load = name => runInContext(readFileSync(new URL(`../dist/${name}`, import.meta.url), 'utf8'), context, { filename: name });
  // 从真正的入口读取顺序，忘记加载一个依赖脚本也应让回归失败。
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  for (const [, src] of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)) {
    if (src === 'templates.js') {
      // 布局由浏览器验证；测试不解析 HTML 字符串，也不伪造布局通过结果。
      evaluate('render = () => {}');
      if (!loadTemplates) continue;
    }
    load(src);
  }
  return { evaluate, element, storage };
}

export const templateFixture = name => ({
  type: 'qicheng-template', schemaVersion: 1, name,
  design: { layout: 'classic', accent: '#2855e7', fontFamily: 'sans', fontSize: 13, lineHeight: 1.6, pageMargin: 18 },
});
