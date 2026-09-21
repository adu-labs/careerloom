# T01a：API 启动、配置校验与存活检查——实现审阅

- 状态：实现与检查完成，待用户 review；尚未合并 main、部署或生成教学文档。
- 日期：2026-09-21。
- 代码基线：`6fa40c5`；分支 `feature/t01a-api-bootstrap`。该提交后的文档更新不改变本次实现。
- 对应计划：[逐功能执行规划](../../tasks/implementation-sequence.md)。T01a 是 T01 的 API 子项，不代表整个 T01 已完成。

## 1. 目标与实际结果

仓库此前只有文档和静态原型。本次建立可实际运行、可测试的 NestJS API 基础，默认绑定本机 `127.0.0.1:3001`。

`GET /v1/health/live` 返回 HTTP 200，JSON 为 `{"status":"ok","service":"careerloom-api"}`，带 `Cache-Control: no-store`。不存在的路由返回404；`/v1/health/ready`尚未实现，也返回404。

配置错误在打开端口前失败；端口占用退出非零；服务可通过SIGTERM关闭。配置错误日志是固定结构，不回显非法输入值。当前无数据库、用户数据、鉴权、Web、模型、队列与Python worker；接口仅证明HTTP进程存活，不是完整系统健康证明。

## 2. 建议阅读顺序（约10–15分钟）

| 顺序 | 文件／符号 | 核对重点 |
|---|---|---|
| 1 | [config.ts](../../apps/api/src/config.ts)：readConfig | 配置默认值、部署环境必填、严格端口校验 |
| 2 | [app.ts](../../apps/api/src/app.ts)：HealthController / createApp | 请求路径、固定响应、无网络副作用的应用创建 |
| 3 | [main.ts](../../apps/api/src/main.ts)：bootstrap | 先校验再监听、失败关闭、退出码 |
| 4 | [配置测试](../../apps/api/test/config.test.ts) | 错值、边界值与信息不泄露 |
| 5 | [HTTP与进程测试](../../apps/api/test/http.test.ts) | 真服务响应、404、子进程失败和SIGTERM |

## 3. 调用与配置契约

启动：进程环境 → readConfig → createApp → 注册控制器 → listen → api_started。
请求：`/v1`全局前缀 → `health`控制器 → `live`方法 → 固定JSON。

| 字段 | 默认值／合法值 | 拒绝行为 |
|---|---|---|
| APP_ENV | 缺省development；development/test/staging/production | 其他值抛ConfigError |
| API_HOST | 本地默认127.0.0.1；127.0.0.1/0.0.0.0/::1/:: | 非列表地址拒绝；staging/production缺失拒绝 |
| API_PORT | 本地默认3001；十进制整数1–65535 | 空值、小数、越界、混合字符拒绝；staging/production缺失拒绝 |

`.env.example`是配置说明，本项不自动加载`.env`。部署流程必须显式设置APP_ENV；如果漏掉，它仍视为本地开发，不会猜测部署环境。生产配置只表示启动契约，不意味着具备生产上线条件。

没有数据写入、迁移或业务事务，因此事务／幂等暂不适用。重复GET无业务副作用。不开放跨域许可，不返回环境值、依赖版本或秘密信息；认证将在独立任务实现。

## 4. 决策与取舍

- **NestJS／TypeScript延续已确认栈**。通过npm元数据固定Nest 12.0.3、TypeScript 5.9.3、reflect-metadata 0.2.2、rxjs 7.8.2和Node类型24.13.6；传递依赖固定在根锁文件。
- **ESM**：本次Nest依赖使用ES模块，API声明`type: module`，源码本地导入显式`.js`后缀供编译后的Node解析；不使用CommonJS混搭或动态导入规避类型检查。
- **npm workspaces**：当前只有一个API，用Node附带工具即可复现；暂不引入额外构建编排。`private: true`禁止误发布npm包，与GitHub仓库公开状态无关。
- **手写小型配置校验**：只有三个字段，纯函数更容易测试；未来配置规模增加时再采用统一配置schema。类型提示不替代运行时验证。
- **存活与就绪分离**：本项不检查数据库；后续T01c负责readiness，避免外部服务暂时不可用导致误判进程死亡。
- **Node内置测试**：配置用单元测试；HTTP、端口和信号用真实应用/子进程。避免仅mock框架调用却没有验证实际监听。
- **日志范围有限**：关闭Nest默认启动日志，仅输出两种结构化启动事件。完整请求日志、trace、指标与告警尚未接入；运行中未知错误的详细诊断需要后续补齐。

参考：[Nest启动与生命周期入口](https://docs.nestjs.com/first-steps)、[配置文档](https://docs.nestjs.com/techniques/configuration)。

## 5. 实际验证记录

环境：macOS，Node.js 24.14.0。未发现Docker CLI，本项不依赖数据库／Docker。

| 命令／检查 | 2026-09-21实际结果 |
|---|---|
| `npm install --ignore-scripts` | 安装102个包；依赖审计报告0已知漏洞，不等于无安全风险 |
| `npm run check` | TypeScript类型检查、编译通过；8项测试全部通过 |
| `npm ci --ignore-scripts` | 依据锁文件重装成功，审计报告0已知漏洞 |
| `git diff --check` | 无空白错误 |

8项测试：本地安全默认值、部署必填配置、端口格式与边界、环境与监听地址验证、真实HTTP存活/404/cache、非法启动非零退出、端口占用非零退出、SIGTERM关闭真实服务。

最初类型检查发现CommonJS与Nest ESM不兼容；已改为ESM后执行完整检查通过。没有使用skipLibCheck掩盖问题。没有独立lint规则，当前验证是严格类型检查与测试；不宣称lint已通过。

## 6. 本地复现

在根目录，使用Node24：

```sh
npm ci --ignore-scripts
npm run check
npm run start:api
```

另一个终端：

```sh
curl -i http://127.0.0.1:3001/v1/health/live
curl -i http://127.0.0.1:3001/v1/health/ready
```

分别应为200和404。原终端Ctrl+C停止。配置失败例：

```sh
API_PORT=invalid npm run start:api
APP_ENV=production npm run start:api
```

均应非零退出并输出明确的字段校验错误，不能开始监听。完整自动测试会启动和清理临时进程，测试不会创建业务数据。若端口3001被占用，用`API_PORT=3101 npm run start:api`。

## 7. Review检查点与限制

- [ ] 默认仅绑定本机，部署环境要求显式配置，符合期望。
- [ ] `/health/live`命名与返回值没有夸大为数据库／业务就绪。
- [ ] 注释足够解释职责、ESM、配置和错误边界。
- [ ] 8项检查覆盖了本次承诺，接受数据库/Web仍未实现的范围。

SIGTERM测试用于进程和监听释放；未验证正在进行的复杂业务请求排空，当前没有这种业务。SIGINT注册但尚无独立自动化测试。Windows及其他Node大版本未测。测试获取空闲端口再启动子进程存在很小的竞争窗口；若被占用会明确失败，不忽略失败。

回滚：本功能未合并main，可切回main继续看原型；如后续合并，使用revert撤回功能提交，无数据库迁移或数据恢复需要。原型内容和线上部署均未更改。

## 8. 审阅记录

尚未收到用户对本功能的明确批准。通过后创建`docs/learning/T01a-api-bootstrap.md`，详细讲解从零搭建、TypeScript/ESM、装饰器、Nest路由、配置解析、异常、测试和生命周期；然后更新链接并删除本临时审阅文档，保留Git历史。
