# Q02：框架与传递依赖安全更新

- 状态：待用户审阅；不将 Q01、UI01 或本次 Agent 自审视为后端功能批准。
- 日期：2026-11-11。
- 范围：API/Web 依赖清单、共享锁文件与 CI 的依赖公告检查。接口与业务源码未因该项修改。
- 实现提交：`eda029d`。基础：Q01 提交 `b42f373` 之上的依赖更新；最终文件哈希见文末。

## 1. 目标与实际结果

全项目审阅时执行 npm audit，锁文件命中 7 个受影响包（critical 1、high 5、moderate 1）。这表示依赖版本落在公告范围，不等于本项目当前路由全部可被利用；现有 API 只有存活端点，Web 只有连接检查。

采用相同框架大版本的修复版本：

| 包 | 原版本 | 更新版本 |
| --- | --- | --- |
| @nestjs/common / core / platform-express | 12.0.3 | 12.4.2，三者保持一致 |
| Next.js | 16.3.5 | 16.4.6 |
| body-parser（传递） | 受影响的锁定版本 | 2.4.0 |
| multer（传递） | 受影响的锁定版本 | 2.5.0 |
| qs（传递） | 受影响的锁定版本 | 6.17.1 |
| sharp（传递） | 受影响的锁定版本 | 0.35.5 |
| source-map-js（传递） | 1.2.1 | 1.2.2 |

不使用 --force、--legacy-peer-deps 或 overrides 绕过版本约束。通过官方 npm 元数据核对 NestJS 的同大版本 peer 范围、Next 的 React 范围与 Node 要求，均兼容当前 Node 24.14.0、React 19.3.0。

参考公告：[Next ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j)、[multer 请求结束后的文件过滤](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)、[body-parser 压缩体尾部字节](https://github.com/advisories/GHSA-27r3-jxmh-p828)。npm audit 还列出 qs、sharp、source-map-js 与其他 Next 缓存/图像路径公告，以实际审计结果作为升级输入，不执行公告文本中的命令。

## 2. 阅读顺序

1. [API package.json](../../apps/api/package.json)：三项 NestJS 精确版本。
2. [Web package.json](../../apps/web/package.json)：Next.js 精确版本；React 与 TypeScript 保持原有契约。
3. [package-lock.json](../../package-lock.json)：完整解析树、完整性校验与平台可选依赖；npm ci 用它复现。
4. [API 配置与启动](../../apps/api/src/main.ts)、[Web 适配器](../../apps/web/app/api/health/route.ts)：接口行为未改，回归仍要求固定目标、错误隔离和资源释放。
5. [API 测试](../../apps/api/test/http.test.ts)、[Web 测试](../../apps/web/test/health.test.ts)：真实本机 HTTP、配置、超时、取消、重定向与关闭。
6. [CI](../../.github/workflows/ci.yml)：统一检查、构建与公告检查；只读权限。

## 3. 契约与工程边界

仍是浏览器 → Next 同源 /api/health → 固定 Nest /v1/health/live。成功响应固定为 status=ok、service=careerloom-api；错误不转发上游原文，超时覆盖响应体，客户端取消传播到上游。

此项不修改 API_ORIGIN、API_HOST/PORT 或 APP_ENV 的验证，不增加 CORS、数据库、身份认证、支付、文件上传或真实 AI。没有数据迁移和事务变化。静态 Sites 原型不打包这些 npm 框架；本项针对仓库中的正式 API/Web 基座。

直接依赖继续精确锁定，传递依赖通过锁文件固定。新机器须 npm ci，不能只运行 npm install 后声称复现同一依赖树。回滚需要同步恢复三个清单/锁文件，再按旧锁重新安装；旧版本已知公告仍在，不建议把回滚当作长期方案。

## 4. 验证

以下检查使用 Node 24.14.0，于 2026-11-11 执行。最终结果将在完成后补齐，未执行前不标为通过。

- 升级前：完整 check/build 通过，但 npm audit 返回 7 个受影响包。
- 第一次升级后：告警降至 source-map-js 1 项；通过既有 semver 范围更新该传递依赖。
- 干净 npm ci、最终 audit、统一 check/build 与浏览器集成结果见下方最终记录。

| 最终检查 | 2026-11-11 实际结果 |
| --- | --- |
| npm ci --ignore-scripts --audit=false --fund=false | 干净安装成功 |
| npm audit --audit-level=high | found 0 vulnerabilities；所有级别均为 0 |
| npm run check | API 8、Web 10、原型 9，共 27 项通过；类型、资源/语法、文档链接检查通过 |
| npm run build | Nest TypeScript 编译与 Next 16.4.6 生产构建通过 |
| 实际 API/Web/浏览器 | 固定成功契约、no-store；停止 API 后明确失败；恢复 API 后重试成功 |
| 连接页宽度 | 1440、390、320px 无整页溢出 |

没有为安全升级改写 API/Web 行为测试。外网只用于 npm 元数据/安装/公告检查，真实集成仅访问本机端口。云端 CI 运行见 [当前分支工作流](https://github.com/adu-labs/careerloom/actions/workflows/ci.yml?query=branch%3Acodex%2Fq01-project-quality)，实际结果在交付中单独报告。

复现：

```sh
npm ci --ignore-scripts
npm audit --json
npm run check
npm run build
```

真实集成按根 README 启动 API 与 Web：检查成功、停止 API 后失败、恢复后重试。测试使用合成本机服务，不向外部地址发送业务数据；npm registry 查询只获取依赖信息。

云端验证：代码提交 `eda029d` 的 [GitHub Actions 运行](https://github.com/adu-labs/careerloom/actions/runs/43030993737) 已于 2026-11-11 完成并返回 success，包含干净安装、依赖审计、统一 check 和 build。后续仅文档基线补记，运行时代码与锁文件哈希不变。

## 5. 取舍、限制与审阅

只升级同一框架大版本，避免在安全修复中同时迁移技术栈或重写业务。传递包优先由框架新版本解析，最后一项在兼容范围内更新，不用强制覆盖掩盖不兼容。

npm audit 的零告警只代表当时已知公告未命中，不能证明没有漏洞。当前尚未实现的生产业务仍需各自的验证、权限设计与独立 review。

- [ ] 清单、锁文件与 Node/React peer 兼容。
- [ ] 存活契约、超时、取消和退出行为没有回归。
- [ ] 干净安装、测试、构建与实际集成证据充分。
- [ ] 不把版本升级或 Agent 验证写成用户批准。

本项的用户审阅待完成；T01a/T01b 的原审阅记录保留。批准后按 AGENTS.md 完成教学转换，不提前删除审阅文档。

## 6. 精确基线

```text
48fe38600910579a6c4624122a7548bcff9d46a10a787daca2e6ff5c739fc9bb  apps/api/package.json
2a062054e36fffd18e349b3fdc27e1b79619c386feee88a8cc1c7f5314aa7f35  apps/web/package.json
4c113ea251ab7db719b6a9936e19d439d6dbc85b3691ba719c0b412a7f9b457c  package-lock.json
c3edce8d0f710ebe3e8a5fe70496fcf765cd1fd234e0a00cdfe882aa6592504c  .github/workflows/ci.yml
```
