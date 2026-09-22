import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Careerloom · 开发连接检查',
  description: 'Careerloom Web 与 API 的本地连接检查。',
  robots: { index: false, follow: false },
};

/** 根布局留在服务端；仅连接状态页需要浏览器事件和请求状态。 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
