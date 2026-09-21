import { createApp } from './app.js';
import { ConfigError, readConfig } from './config.js';

/** 有界错误信息避免把底层异常中的配置或凭证打印到公开运行日志。 */
function startupError(error: unknown): string {
  if (error instanceof ConfigError) return error.message;
  if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
    return 'API port is already in use';
  }
  return 'API startup failed';
}

async function bootstrap(): Promise<void> {
  const config = readConfig(process.env);
  const app = await createApp();
  try {
    await app.listen(config.port, config.host);
    process.stdout.write(JSON.stringify({ event: 'api_started', service: 'careerloom-api' }) + '\n');
  } catch (error) {
    // 监听失败也释放 Nest 生命周期资源，不让一次失败留下半启动的实例。
    await app.close();
    throw error;
  }
}

void bootstrap().catch((error: unknown) => {
  process.stderr.write(JSON.stringify({ event: 'api_start_failed', message: startupError(error) }) + '\n');
  process.exitCode = 1;
});
