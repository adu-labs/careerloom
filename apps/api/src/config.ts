/** 启动配置在监听端口前校验；错误只报告字段名，不回显可能敏感的值。 */
export interface ApiConfig {
  readonly environment: 'development' | 'test' | 'staging' | 'production';
  readonly host: string;
  readonly port: number;
}

export class ConfigError extends Error {}

/**
 * 缺省启动是仅本机的 development。staging/production 必须明确绑定地址与端口。
 * 禁止 parseInt 的宽松转换，避免把 "3001oops" 当作合法端口。
 */
export function readConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const environment = env.APP_ENV ?? 'development';
  if (!['development', 'test', 'staging', 'production'].includes(environment)) {
    throw new ConfigError('APP_ENV must be development, test, staging or production');
  }
  const deployed = environment === 'staging' || environment === 'production';
  if (deployed && (!env.API_HOST || !env.API_PORT)) {
    throw new ConfigError('API_HOST and API_PORT are required in staging/production');
  }
  const host = env.API_HOST ?? '127.0.0.1';
  // 先限定明确的绑定方式，避免把 URL、拼错的域名当监听地址。
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host)) {
    throw new ConfigError('API_HOST must be an explicitly supported bind address');
  }
  const rawPort = env.API_PORT ?? '3001';
  if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
    throw new ConfigError('API_PORT must be an integer between 1 and 65535');
  }
  return Object.freeze({ environment: environment as ApiConfig['environment'], host, port: Number(rawPort) });
}
