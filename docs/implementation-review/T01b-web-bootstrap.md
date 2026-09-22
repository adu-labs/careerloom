# T01b：Web 骨架与 API 连接实现审阅

- 状态：实现与必要验证完成，**待用户审阅**。
- 实现与验证日期：2026-09-22。
- 代码审阅基线：`c36c7a5`；本功能 diff：`8b2654c..c36c7a5`。后续仅文档提交不改变本基线。
- 分支：`codex/t01b-web-bootstrap`，基于仍待审阅的 `feature/t01a-api-bootstrap`。本功能不包含对 T01a 的批准或合并。
- 对应需求：[实现顺序](../../tasks/implementation-sequence.md)、[T01](../../tasks/todo.md#t01-工程骨架与验证命令)、[系统边界](../decisions/001-system-boundaries.md)。

## 1. 目标与实际结果

新增独立的 `apps/web` Next.js 应用，使用既定的 React / TypeScript 技术栈。浏览器会请求真实 API 存活检查，显示检查中、连接成功或失败，以及本次检查时间。用户可以手动重试，正在请求时按钮不可重复点击。

API 停止后点击「重新检查」会显示失败；重新启动 API 后点击「重试连接」可恢复。成功表示本次 HTTP 请求完成，不代表持续在线或业务就绪；页面没有后台轮询。

这是一张明确标记「开发预览」的连接检查页。数据库、身份、简历、AI 会话、Agent、遥测、业务首页均未实现；没有调用生产服务，没有修改已有 Sites 原型，也没有部署上线。后续业务首页按自己的任务替换此入口。

## 2. 建议阅读顺序

| 顺序 | 文件／符号 | 核对重点 |
|---|---|---|
| 1 | [根 package.json](../../package.json)、[Web package.json](../../apps/web/package.json) | npm workspaces、固定版本、独立启动和统一检查命令 |
| 2 | [route.ts](../../apps/web/app/api/health/route.ts)：`readOrigin`、`readLiveBody`、`GET` | 固定目标、配置校验、无缓存、超时、响应校验与资源释放 |
| 3 | [page.tsx](../../apps/web/app/page.tsx)：`ConnectionPage`、`checkConnection` | 状态归属、最新请求写入权、卸载取消、重试和本地错误文案 |
| 4 | [layout.tsx](../../apps/web/app/layout.tsx)、[globals.css](../../apps/web/app/globals.css) | 中文页面语义、metadata、键盘焦点、移动端换行 |
| 5 | [health.test.ts](../../apps/web/test/health.test.ts) | 临时 HTTP 服务下的成功、失败、重试、重定向、超时与取消 |

框架配置：[next.config.ts](../../apps/web/next.config.ts)、[tsconfig.json](../../apps/web/tsconfig.json)。`next-env.d.ts` 由 Next.js 生成，先执行 `typecheck` / `dev` / `build` 生成它引用的路由类型，不手工维护。

## 3. 实现与契约

### 请求与数据流

```text
浏览器 page.tsx
  → 同源 GET /api/health（6 秒客户端超时）
  → Next Route Handler（3 秒上游超时，最多读取 1024 字节）
  → API_ORIGIN + /v1/health/live
  → 校验服务名和状态，返回固定响应
  → 页面更新状态／允许重新检查
```

`API_ORIGIN` 仅从 Web 服务端环境读取。开发默认 `http://127.0.0.1:3001`；生产模式缺少配置时接口返回 500。只接受 HTTP(S) origin，拒绝嵌入用户名／密码、路径、查询串、fragment 和前后空白。该环境变量属于可信部署配置，并非任意主机的安全白名单；只有部署维护者应能修改它。

| HTTP | JSON | 页面行为 |
|---|---|---|
| 200 | `{"status":"ok","service":"careerloom-api"}` | 已连接，展示检查时间 |
| 500 | `{"status":"unavailable","reason":"configuration"}` | 提示检查 `API_ORIGIN` |
| 502 | `{"status":"unavailable","reason":"upstream"}` | 提示确认 API 启动后重试；包括连接失败、非成功响应、非法 JSON、超长响应或调用方取消 |
| 502 | `{"status":"unavailable","reason":"invalid_response"}` | JSON 可解析但不是目标服务的成功契约，提示检查 API |
| 504 | `{"status":"unavailable","reason":"timeout"}` | 提示 API 响应超时 |

浏览器自身网络失败／解析失败使用固定的网络错误说明；客户端 6 秒超时显示连接检查超时。它也会核对成功响应中的服务名，不只判断 HTTP 200。没有把上游错误文本直接展示给用户。

### 边界与清理

- `force-dynamic` + 上游 `fetch(..., {cache: 'no-store'})` + 响应 `Cache-Control: no-store`：每次检查都重新请求，不复用旧成功结果。
- 上游请求只使用固定路径；忽略浏览器查询参数，不转发 Cookie、Authorization 或其他用户请求头，不跟随重定向。额外响应字段被丢弃。
- 3 秒超时包含连接和读取响应体；超长响应会停止读取，reader 在 `finally` 取消并释放。若请求的 abort signal 触发，会传递给上游 fetch。
- 页面用局部状态和 `AbortController` 管理请求；新请求取消旧请求，旧响应没有写入权；effect 只负责首次检查及卸载清理。按钮事件直接触发重试。浏览器计时器在 `finally` 清理。
- 状态使用文字与 `aria-live`，不只依赖颜色；原生按钮支持 Enter、可见焦点和禁用态。无动画或额外图标／字体网络依赖。
- 本检查接口匿名可读，只有固定的服务存活结果；没有账户数据、数据库模型、迁移、事务或写入操作。GET 可重复调用，不需要写入幂等键。业务鉴权与公共网关限流尚未建设，当前只在本地运行。

## 4. 决策与取舍

1. **采用 Next.js + React，继续 npm workspaces。** 锁定 Next.js `16.3.5`、React / React DOM `19.3.0`、TypeScript `5.9.3`；沿用 Node.js `24.14.0`。没有引入第二种包管理器或脚手架中的无关依赖。
2. **本次使用窄范围同源适配接口。** 浏览器不直接跨域请求 Nest；原 API 无需新增 CORS 配置，内部地址也不用 `NEXT_PUBLIC_` 暴露。代价是多一个 HTTP 跳转。这不是通用代理或业务 BFF，后续业务接口仍由 Nest 承担权限和规则。部署网关的统一路由应在对应部署任务评估。
3. **只做开发检查页。** 沿用原型的蓝色、浅灰背景和圆角；不用没有服务支持的入口填充页面。传统工作台与 AI 首页仍按已确定产品设计实施。
4. **手动检查 + 有限等待。** 适合当前单一诊断请求，不添加轮询、自动重试或全局状态库；以后多页面的业务请求可以再引入统一的数据访问层。
5. **沿用 Node 测试运行器。** 由 Node 24 直接读取测试 TS，`typecheck` 单独负责类型校验；TypeScript 类型不会自动校验外部 JSON，所以两侧都保留运行时检查。

框架行为核对来源：[Next.js 安装与 App Router](https://nextjs.org/docs/app/getting-started/installation)、[Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)。依赖版本同时从 npm 官方 registry 核实后固定在清单与锁文件中。

## 5. 实际验证记录

环境：macOS、Node.js 24.14.0、npm 11.9.0；2026-09-22 执行。测试没有真实用户数据。

| 检查 | 实际命令／步骤 | 结果 |
|---|---|---|
| 锁文件重装 | `npm ci --ignore-scripts --offline --no-audit --no-fund` | 成功，129 个包；`--offline` 使用本机已安装时缓存，其他环境首次安装应移除此参数 |
| 类型与测试 | `NEXT_TELEMETRY_DISABLED=1 npm run check` | 两个 workspace 类型检查成功，API 8/8、Web 10/10 通过 |
| 生产构建 | `NEXT_TELEMETRY_DISABLED=1 npm run build` | API 编译与 Next 生产构建成功；`/` 静态输出、`/api/health` 动态处理 |
| 浏览器联调 | `node /tmp/careerloom-t01b-qa.mjs` | 真实 Nest + Next 生产构建 + Chrome 完成下面的验收；临时脚本不纳入仓库 |
| diff 格式 | `git diff --cached --check` | 代码基线提交前通过 |

Web 的 10 项测试包括：固定路径／不透传凭证／结果投影；失败后真实重试；错误服务、非法 JSON、超大响应各一项；拒绝重定向；无效及缺失生产配置；响应头不返回、响应体不结束分别超时；调用方取消。

首次在受限沙箱内运行 HTTP 测试，因不允许监听本地端口而出现 `EPERM`；在允许本地监听的环境重跑通过。初次类型检查发现 Next 对 `NODE_ENV` 的只读声明与测试临时改环境冲突，已限制在测试中使用可写视图，并在结束时还原。

### 浏览器验收

Browser plugin not available：本会话没有 Browser 插件对应 skill，使用现有 Playwright `1.62.1` + 本机 Chrome `123.0.6312.124`，未添加浏览器测试依赖到产品项目。测试 URL 为本机临时端口 `http://127.0.0.1:62718`，测试结束自动停止自己启动的 API / Web。

| 项目 | 结果 |
|---|---|
| 页面身份、标题、非空页面 | 通过，标题为「Careerloom · 开发连接检查」 |
| 错误覆盖层与 console | 无框架错误覆盖层，无 JavaScript 异常；人为停止 API 的步骤产生一条预期 502 网络日志，没有其他警告／错误 |
| 真实路径 | 页面加载 → 检查中且按钮禁用 → 实际 API 成功；同源响应为 200 且 no-store |
| 断连恢复 | 停止 API → 点击重新检查 → 失败说明 → 启动 API → 聚焦重试并按 Enter → 恢复成功 |
| 合成边界 | 模拟 HTTP 200 但服务名错误，页面拒绝；模拟浏览器请求超过 6 秒，退出等待并能重试，取消的旧响应不拥有新状态 |
| 视觉与布局 | 1440×1000 桌面、390×844 及 320×740 视口；无水平溢出，重试按钮保留；已查看成功、失败与手机截图 |

本机临时证据位于 `/tmp/careerloom-t01b-qa/`：`results.json`、`server.log`、`desktop.png`、`disconnected.png`、`loading.png`、`mobile-390.png`、`mobile-320.png`。这些不是仓库长期资产，重启或清理临时目录后可能消失。长期可复现的接口测试在仓库中；浏览器流程可按下述步骤复验。

### 本地复现

在仓库根目录、Node.js 24 下执行（需能从 npm 下载依赖；无付费服务）：

```sh
npm ci --ignore-scripts
npm run check
npm run build
```

终端 1：`npm run start:api`。终端 2：`API_ORIGIN=http://127.0.0.1:3001 npm run start:web`。访问 `http://127.0.0.1:3000`，预期连接成功。

1. 终端 1 按 Ctrl+C，点击「重新检查」：预期失败和重试按钮。
2. 重新启动 API，点击「重试连接」：预期成功和新的检查时间。
3. 终端 2 按 Ctrl+C；用 `API_ORIGIN=invalid npm run start:web` 启动，刷新：预期配置错误提示。恢复正确变量后重启。
4. 用浏览器设备视图设为 390px / 320px 宽；检查文案、按钮和焦点可见。
5. 分别 Ctrl+C 停止两个终端；无数据库或测试资料需要清理。

日常改前端可以将终端 2 换成 `npm run dev:web`，开发模式默认 API 地址为本机 3001。上述自动浏览器记录针对生产构建，并非开发服务器热更新验收。

## 6. Review 检查点、限制与回滚

- [ ] 同源适配层只做连接检查，未把业务规则从 Nest 移到 Next。
- [ ] 连接成功的含义准确，失败不会复用旧成功，配置／上游数据没有泄漏。
- [ ] 状态、超时、取消、重试及注释能清楚解释；本页不是未来产品首页的定稿。
- [ ] T01a 和 T01b 仍待用户批准，T01c 数据库功能尚未开始。

未验证：Safari、Firefox、真实手机／辅助读屏器、生产反向代理、持续高并发、云部署与实际数据库。键盘与语义检查不能替代完整无障碍验收。未配置 lint 或可持续运行的 E2E CI，本地浏览器临时脚本也不应描述为已有持续回归套件。

回滚：本次没有迁移或用户数据。停止 Web；在尚未合并的功能分支上可切回 `feature/t01a-api-bootstrap` 并按其锁文件 `npm ci --ignore-scripts`，保留 T01a API。若以后已合并，应通过新的 revert 提交回退 T01b 对应代码及文档，不能改写共享历史。

## 7. 审阅记录

2026-09-22：提交实现基线 `c36c7a5` 与本审阅说明；尚未收到用户明确批准。继续实施不等于 review 通过。

通过后，按 [AGENTS.md](../../AGENTS.md) 先完成 `docs/learning/T01b-web-bootstrap.md`，覆盖 Next 路由、服务端环境边界、TS 联合类型与运行时校验、React effect／ref、AbortController、HTTP 失败处理及从零练习，再迁移有价值的审阅内容并删除本文件。当前不提前生成或转换教学文档。
