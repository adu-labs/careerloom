'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionState =
  | { kind: 'checking' }
  | { kind: 'connected'; checkedAt: string }
  | { kind: 'failed'; message: string; checkedAt: string };

const CLIENT_TIMEOUT_MS = 6_000;

/**
 * T01b 的开发检查页；只展示已真实验证的 HTTP 链路，不提供尚未实现的业务按钮。
 * 请求状态属于本页，不需要全局 store；后续业务首页在对应任务替换此入口。
 */
export default function ConnectionPage() {
  const [state, setState] = useState<ConnectionState>({ kind: 'checking' });
  const activeRequest = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    // 最新请求拥有状态写入权；重试、卸载和开发 StrictMode 不允许旧响应覆盖新结果。
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ kind: 'checking' });
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch('/api/health', {
        signal: controller.signal, cache: 'no-store', credentials: 'omit',
      });
      const body: unknown = await response.json();
      const valid = typeof body === 'object' && body !== null;
      if (!response.ok || !valid || !('status' in body) || body.status !== 'ok'
          || !('service' in body) || body.service !== 'careerloom-api') {
        let message = '请确认 API 已启动，然后重试。';
        if (valid && 'reason' in body && body.reason === 'configuration') {
          message = '请检查 Web 服务的 API_ORIGIN 配置，然后重试。';
        } else if (response.status === 504) {
          message = 'API 响应超时，请稍后重试。';
        } else if (response.ok || (valid && 'reason' in body && body.reason === 'invalid_response')) {
          message = '服务响应不符合约定，请检查连接的 API。';
        }
        // 只显示本地定义的说明，不渲染服务端原始错误或潜在敏感字段。
        if (activeRequest.current === controller && !controller.signal.aborted) {
          setState({ kind: 'failed', message, checkedAt: new Date().toISOString() });
        }
        return;
      }
      if (activeRequest.current === controller && !controller.signal.aborted) {
        setState({ kind: 'connected', checkedAt: new Date().toISOString() });
      }
    } catch {
      if (activeRequest.current !== controller || (controller.signal.aborted && !timedOut)) return;
      setState({ kind: 'failed', checkedAt: new Date().toISOString(), message: timedOut
        ? '连接检查超时，请稍后重试。' : '无法完成连接检查，请检查网络后重试。' });
    } finally {
      window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // 首次挂载需要访问浏览器同源接口；清理时终止请求，避免卸载后更新状态。
    void checkConnection();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [checkConnection]);

  const title = state.kind === 'checking' ? '正在检查连接' : state.kind === 'connected'
    ? 'Web 与 API 已连接' : '暂时无法连接';

  return (
    <div className="page-shell">
      <header className="page-header">
        <a className="brand" href="/" aria-label="Careerloom 首页">
          <span className="brand-mark" aria-hidden="true">c</span>Careerloom
        </a>
        <span className="environment-label">开发预览 <span aria-hidden="true">/</span> T01b</span>
      </header>

      <main>
        <div className="intro">
          <p className="eyebrow">WORK IN PROGRESS</p>
          <h1>从一条真实的连接开始。</h1>
          <p className="lead">Careerloom 的工作台正在搭建。这里用来检查 Web 与 API 的连接。</p>
        </div>

        <section className={`connection-panel ${state.kind}`} aria-labelledby="connection-title">
          <div className="panel-header"><span>服务连接</span><span className="panel-label">HTTP 存活检查</span></div>
          {/* 状态变化通过文字与 live region 告知，不能只依赖颜色或动画。 */}
          <div className="connection-result" role="status" aria-live="polite" aria-atomic="true">
            <span className="status-symbol" aria-hidden="true">{state.kind === 'connected' ? '↗' : state.kind === 'failed' ? '!' : '…'}</span>
            <h2 id="connection-title">{title}</h2>
            <p className="result-description">{state.kind === 'checking' ? '正在向 API 发送请求，请稍候。'
              : state.kind === 'connected' ? 'API 已响应本次请求，可以继续开发下一项功能。' : state.message}</p>
          </div>
          <div className="connection-path" aria-label="连接路径：浏览器、Web、API">
            <span>浏览器</span><i aria-hidden="true">→</i><span>Web</span><i aria-hidden="true">→</i><span>API</span>
          </div>
          <div className="panel-footer">
            <p className="check-time">{state.kind === 'checking' ? '检查中 · 最多等待 6 秒' : <>
              本次检查 <time dateTime={state.checkedAt}>{new Date(state.checkedAt).toLocaleTimeString('zh-CN', { hour12: false })}</time>
            </>}</p>
            <button type="button" onClick={() => void checkConnection()} disabled={state.kind === 'checking'}>
              {state.kind === 'checking' ? '检查中…' : state.kind === 'failed' ? '重试连接' : '重新检查'}
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        </section>

        <aside className="scope-note" aria-labelledby="scope-title">
          <span className="note-icon" aria-hidden="true">i</span>
          <div><h2 id="scope-title">当前验证范围</h2><p>连接成功仅代表 API 进程可响应。数据库、登录、简历与 AI 功能尚未接入。</p></div>
        </aside>
      </main>

      <footer className="page-footer"><span>Careerloom · 职业积累与求职工作台</span><span>每一步，都有所积累。</span></footer>
    </div>
  );
}
