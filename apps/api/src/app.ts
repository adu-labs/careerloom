import 'reflect-metadata';
import { Controller, Get, Header, Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

/**
 * 存活检查只证明 HTTP 进程能处理请求，不代表数据库、模型或整个产品已就绪。
 * 对外响应固定且无环境/版本/凭证；数据库 readiness 将在 T01c 独立实现。
 */
@Controller('health')
class HealthController {
  @Get('live')
  @Header('Cache-Control', 'no-store')
  live(): { status: 'ok'; service: 'careerloom-api' } {
    return { status: 'ok', service: 'careerloom-api' };
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

/**
 * 创建但不监听，便于测试绑定临时端口和显式关闭，避免导入模块就产生网络副作用。
 * 不开启宽泛 CORS；Web 接入时再按实际受信任 origin 设置策略。
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
  return app;
}
