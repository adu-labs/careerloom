import type { NextConfig } from 'next';

// 这里只保存框架配置。API_ORIGIN 在服务端请求时读取，不能通过 env 注入浏览器。
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
