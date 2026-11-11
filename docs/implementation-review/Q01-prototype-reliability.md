# Q01：原型稳定性、数据保护与项目自动检查

- 状态：实现与验证完成，待用户审阅；不沿用 UI01 批准覆盖新增行为。
- 日期：2026-11-11。
- 实现提交：`b42f373`；基础提交：`a75d485`。当前精确文件哈希见文末；本轮使用独立分支 `codex/q01-project-quality`。
- 范围：现有原型与工程检查。未开始的生产业务功能仍按原任务推进。

## 1. 目标与实际结果

此次审阅发现并复现了四类问题：

| 触发 | 修复前 | 修复后 |
| --- | --- | --- |
| 删除全部简历后刷新 | 直接读取首条简历 ID，页面启动抛错 | 空库有效，可刷新并从空白新建 |
| 导入名称带 HTML 的模板再新建简历 | 模板选择器把名称直接插入 HTML | 使用已有 E() 转义，名称作为文字显示 |
| 快速连续选文件、关闭或切换导入弹窗 | 后完成的旧读取可覆盖当前选择 | 仅当前弹窗最后一次选择拥有写回权 |
| 本机 JSON 损坏或集合形状错误 | 抛错，或回落到样例后可能覆盖原数据 | 保留原文、阻止普通保存、提供下载备份与确认重置 |

三个核心缺陷的回归用例先在旧实现失败，再在修复后通过。另增加关闭/失败选择、大小上限、损坏保护与旧数据兼容验证。测试样例均为虚构数据。

根检查以前只覆盖 API/Web；现在也检查原型实际引用资源、脚本语法、9 项原型回归与 Markdown 相对文件链接。新增 GitHub Actions 使用相同检查与构建命令，固定官方 Action 提交，仅授予 contents:read，不包含部署、业务凭证或写仓库权限。

## 2. 建议阅读顺序

| 文件 | 关注点 |
| --- | --- |
| [storage.js](../../prototype/dist/storage.js) | 读取边界、最小结构校验、损坏原文锁与恢复页 |
| [app.js](../../prototype/dist/app.js) | 可选首条简历、受保护 persist、恢复页分支、备份和确认重置 |
| [workbench.js](../../prototype/dist/workbench.js) | 工作台恢复分支与模板名称转义 |
| [templates.js](../../prototype/dist/templates.js) | readTemplateFile、弹窗 revision、选择序号、DOM 身份与关闭状态 |
| [原型回归](../../prototype/test/regressions.test.mjs)、[测试替身](../../prototype/test/helpers.mjs) | 从实际 HTML 加载真实脚本；只替代 DOM，不声称验证布局 |
| [原型检查](../../scripts/check-prototype.mjs)、[文档检查](../../scripts/check-doc-links.mjs) | 本地资源和语法、相对文件目标检查范围 |
| [CI](../../.github/workflows/ci.yml)、[根脚本](../../package.json) | 自动运行统一检查，无独立的部署授权 |

## 3. 数据流与兼容边界

```text
localStorage 原键 → JSON 解析与集合校验
  有效 → 原状态 → 既有 migrate() 补新增可选字段
  无效 → 内存样例仅用于安全启动 → 恢复页 → 普通 persist 不可覆盖原文
                                               → 下载原始备份
                                               → 用户确认重置后才写新样例
```

保留 `qicheng-prototype-v1`、`qicheng-template`。空数组不是损坏；旧快照缺省的可选集合仍由既有迁移补齐。结构检查只覆盖启动/渲染必需形状，不声称是完整业务 schema。无法识别的快照保留原文，不静默删记录或修字段，也不发送到服务端。

恢复页不显示原始 JSON，避免私人资料出现在页面或被当成 HTML。备份按原字节文本下载；只在当前浏览器处理。重置仍需要原有确认弹窗，取消保留原文。浏览器拒绝存储时仍允许会话内操作，原有保存失败提示继续生效。

文件导入的 parsed 先保留在局部变量。await 完成后依次确认：同一导入轮次、最后一次文件选择、当前 input 节点身份、dialog 仍打开；全部满足才更新 pendingTemplate 和按钮。旧读取无需真正中断，但不能提交结果。512 KiB 上限在读取内容前检查。外部源码仍只保留文本，不执行或编译。

正式 API、数据库模型、鉴权、交易、幂等与后台任务未在此功能中变更。角色切换仍是演示，不构成权限边界。

## 4. 决策与取舍

采用小范围修复而非重写原型：展示层和事件委托继续复用；单独提取存储边界，避免在每个页面重复捕获同一损坏数据错误。

对于坏数据选择保留原文与显式恢复，而不是自动补齐所有缺失字段，因为无法确认缺失是否代表真实删除或数据损坏。有效旧数据只做已有迁移；未提供通用备份恢复导入器，下载原文后需单独判断如何修复。

回归使用 Node VM 加载真实脚本，既能运行在 CI，也能稳定控制文件读取顺序；布局、真实 DOM、下载和键盘仍另做浏览器验证。它不是沙箱执行用户代码的安全机制。

## 5. 验证与复现

2026-11-11，Node.js 24.14.0。

| 检查 | 实际结果 |
| --- | --- |
| 改动前全项目 check/build | API 8、Web 10 项通过，类型检查及构建通过 |
| 原型回归 | 9/9 通过；空库、转义、选择竞争在修复前失败 |
| 原型资源/语法 | HTML 引用存在，5 个脚本通过语法检查 |
| 文档相对链接 | 检查通过；不校验外网、标题锚点或 reference-style 链接 |
| Chromium 空库 | 真实删除 4 份简历 → 刷新 → 空态 → 新建 → 再刷新通过 |
| Chromium 损坏数据 | 合成 `{broken` → 恢复页；取消重置后原文不变；下载内容与原文相同；确认重置后恢复入口 |
| Chromium 文件竞争 | 受控延迟旧 File.text，先完成 new.json，再释放旧读取，最终仍是 new.json |
| Chromium 名称转义 | 导入含 img/onerror 字符的合成名称，新建选择器只显示文字，img 数量为 0，没有执行标记 |
| 小屏 | 上述新流程 390/320px 无整页横向溢出，无捕获的脚本错误 |
| 独立代码审阅 | 后端审阅未发现高置信度问题；新增存储与导入修复只读审阅未发现需追加修复的问题 |

最终本机统一检查通过：npm run check（27 项回归、API/Web 类型、5 个原型脚本和 27 份 Markdown 相对链接），npm run build 通过。升级依赖后的真实 API/Web 成功→停止 API 失败→恢复重试成功也已验证。远端 CI 运行见 [当前分支工作流](https://github.com/adu-labs/careerloom/actions/workflows/ci.yml?query=branch%3Acodex%2Fq01-project-quality)，实际结果在交付中报告，不把工作流文件存在描述成云端通过。

复现命令：

```sh
npm ci --ignore-scripts
npm run check
npm run build
# 原型单独验证（不需要监听端口）
npm run test:prototype
# 实际浏览器，需 Python 3 与本机端口权限
python3 -m http.server 8080 --bind 127.0.0.1 --directory prototype/dist
```

请用隐私窗口或独立浏览器测试，不往日常资料中写入损坏样例。测试恢复流程时先通过控制台设置虚构 `{broken` 再刷新；这一步只用于隔离测试。

云端验证：代码提交 `eda029d` 的 [GitHub Actions 运行](https://github.com/adu-labs/careerloom/actions/runs/43030993737) 已于 2026-11-11 完成并返回 success，包含干净安装、依赖审计、统一 check 和 build。后续仅文档基线补记，运行时代码与锁文件哈希不变。

## 6. 审阅关注点、限制与回滚

- [ ] 原始损坏数据不会被自动保存覆盖，重置必须确认。
- [ ] 现有正常快照、空库、版本、回收站和模拟记录兼容。
- [ ] 文件旧读取不能覆盖新选择或新弹窗。
- [ ] 模板名称始终按文本输出。
- [ ] 自动检查覆盖实际原型且保持生产能力边界清楚。

尚未验证 Safari、Firefox、真实触摸设备和屏幕阅读器。未实现通用数据修复、跨设备同步与生产认证；本次未把原型重写为 Next.js 业务。

回滚需成组恢复 storage.js 的入口引用、读取/保存/恢复分支和相应回归；不要清空用户存储。工程检查可独立回退脚本与 CI。没有数据库迁移。当前线上 UI01 v4 不自动被本轮待审实现替换。

## 7. 状态与精确基线

用户对本轮 Q01 的审阅尚待完成，Agent 自审、测试和上传不视为批准。批准后再按 AGENTS.md 转换成教学文档并移除本文件。

```text
a3091c4bf99c6394558014e57c635934ece6c7ecc4932a72049a424b39a4335a  prototype/dist/storage.js
af10e8331226d4218697969e1055cb4ba6bd843d11d683d01ac7e16ce3e696b3  prototype/dist/app.js
85def88faa7d174da6ea139df9550daa96b2bfd524fc269d4eb7cfac9a4c93a5  prototype/dist/workbench.js
4bd4358c1c7bc4b7df894f845d79a51d2394dcf26a71f0a9a8a223f577ee5a29  prototype/dist/templates.js
9b9aa98a68670f995426c6d15360406d02529efc8f8ebfdca1a5804eb23a8ad9  prototype/dist/index.html
370c13e503e1fdee74591388d0be8f69e9d45a23f994ec112c7e16fff8ee3bfc  prototype/test/helpers.mjs
ef1016ec327aac1e0071546cb1ff0982387077ccbb1e1ee4c20bea0f08eac60a  prototype/test/regressions.test.mjs
20bb47a6ea052379e5c9f2e6fe3d0710d260c0a13ed5bb6a9dcd8a3543e04d11  scripts/check-prototype.mjs
c50619cbd425e5a38cc20b4c1f06ec83ed6368ee81dd4e4202d1f1062b506d03  scripts/check-doc-links.mjs
e4da04d8e82838a6c4dbd2613f0136afbb16a45dd5a44b3ba60075281e6f642b  package.json
```
