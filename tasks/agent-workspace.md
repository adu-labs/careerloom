# 工作记录与 Agent 工作台：工程任务

日期：2026-09-16。全部未实施。依据[专项方案](../docs/design/工作记录与Agent工作台-产品架构与持续优化.md)。这些是对现有任务的扩展；T31继续承担持久任务底座，避免另造一套队列或AI服务。

每项预计 M、4 个主要文件；如实施超过一个专注工作单元则继续拆分。通用验收包括类型/构建、权限与失败测试及运行证据。A08 随首个真实 Agent 接入，不能拖到全部界面完成后。

## A01 轻量记录与项目归档

- [ ] **交付／验收**：支持不求职状态下每日/项目/读书等记录、Markdown自动保存和版本恢复；归档不删正文。
- **验证**：跨账号、日期/项目筛选、刷新恢复、文本导入导出与删除。
- **依赖**：T08,T11。
- **建议文件**：`apps/api/notes/notes.ts`、`apps/api/db/notes.sql`、`apps/web/notes/editor.tsx`、`quality/notes.spec.ts`。

## A02 材料范围与来源投影

- [ ] **交付／验收**：批量选定版本、正文/附件范围和禁止外传段落；读取与输出用途分别授权。
- **验证**：未选笔记读取拒绝、权限撤回、正文更新不改变已选版本、隐藏投影。
- **依赖**：A01,T06。
- **建议文件**：`packages/agent-contracts/sources.ts`、`apps/api/notes/selections.ts`、`apps/web/notes/selector.tsx`、`quality/source-scope.spec.ts`。

## A03 全量读取覆盖清单

- [ ] **交付／验收**：逐块处理全部已选材料，报告失败/遗漏；超预算可分批而不谎报完成。
- **验证**：超长笔记、解析失败、缺附件、重复段落、任务恢复和覆盖计数。
- **依赖**：A02,T31。
- **建议文件**：`workers/ai/source-reader.ts`、`packages/agent-contracts/coverage.ts`、`apps/web/agent/coverage.tsx`、`quality/source-coverage.spec.ts`。

### 检查点 AC1

- [ ] 对应用户路径与异常恢复可演示；运行与反馈证据齐全；产品验收记录明确未完成项。

## A04 成果候选与证据关联

- [ ] **交付／验收**：事实候选关联原文；矛盾数字/团队贡献需确认；学习材料不伪装成果。
- **验证**：合成项目与阅读混合集、数字口径、缺失结果、确认后写经历库。
- **依赖**：A03,T09。
- **建议文件**：`workers/ai/claims.ts`、`packages/agent-contracts/claims.ts`、`apps/web/agent/claims.tsx`、`quality/claims.spec.ts`。

## A05 AI 默认首页与任务会话

- [ ] **交付／验收**：求职者默认会话入口；可见选择范围与任务状态；保留今天和其他直接入口及默认页设置。
- **验证**：三阶段、日常积累、角色区别、移动端、历史会话恢复和真实进度。
- **依赖**：A02,T31,I01。
- **建议文件**：`apps/web/agent/page.tsx`、`apps/api/agent/conversations.ts`、`packages/agent-contracts/conversation.ts`、`quality/agent-home.spec.ts`。

## A06 简历产物与多轮修改

- [ ] **交付／验收**：从记录交付可编辑简历；后续反馈形成补丁；保存版本/导出与编辑器同对象。
- **验证**：20篇混合笔记端到端、局部修改、取消、排除项保留和源笔记不被改写。
- **依赖**：A04,A05,T13,T18,T32。
- **建议文件**：`workers/ai/notes-to-resume.ts`、`packages/agent-contracts/artifact.ts`、`apps/web/agent/artifact-panel.tsx`、`quality/notes-to-resume.spec.ts`。

### 检查点 AC2

- [ ] 对应用户路径与异常恢复可演示；运行与反馈证据齐全；产品验收记录明确未完成项。

## A07 任务修订与可控记忆

- [ ] **交付／验收**：新意图使旧输出过时；偏好记忆可查看修改删除；来源移除显示受影响产物。
- **验证**：迟到响应、并发编辑、跨会话偏好、删除传播、暂停取消与副作用重放。
- **依赖**：A06。
- **建议文件**：`packages/agent-runtime/revisions.ts`、`packages/agent-runtime/memory.ts`、`apps/web/agent/memory.tsx`、`quality/agent-revision.spec.ts`。

## A08 事件与运行追踪契约

- [ ] **交付／验收**：运行/工具/队列关联，事件幂等，模型提示工具版本和费用可查；正文不进普通分析。
- **验证**：强制错误、trace跨队列、重复事件、敏感字段白名单与高基数拦截。
- **依赖**：T31。
- **建议文件**：`packages/telemetry/events.ts`、`packages/telemetry/tracing.ts`、`apps/api/telemetry/ingest.ts`、`quality/telemetry.spec.ts`。

## A09 产物反馈与质量案例

- [ ] **交付／验收**：段落级问题与结构化原因；研究样本主动授权、预览和撤回；反馈关联产物版本。
- **验证**：无正文反馈、拒绝授权仍可用、样本撤回和事实错误分类。
- **依赖**：A06,A08。
- **建议文件**：`apps/api/feedback/feedback.ts`、`apps/web/agent/feedback.tsx`、`quality/agent/case-schema.ts`、`quality/feedback.spec.ts`。

### 检查点 AC3

- [ ] 对应用户路径与异常恢复可演示；运行与反馈证据齐全；产品验收记录明确未完成项。

## A10 评测与版本发布闸门

- [ ] **交付／验收**：开发/留出集区分；版本化工作流对比、人工抽查、实验配置与回滚。
- **验证**：事实/覆盖/隐私回归、近重复隔离、低样本不报显著、灰度失败回退。
- **依赖**：A09,A07。
- **建议文件**：`quality/agent/evaluator.ts`、`quality/agent/release-gates.ts`、`apps/api/agent/releases.ts`、`quality/agent/release.spec.ts`。

## A11 后台任务与产品统计

- [ ] **交付／验收**：按任务/阶段/语言/版本查看成功、取消、等待、质量与费用；普通运营不读私人正文。
- **验证**：服务端与埋点对账、漏斗分母、权限、小样本抑制和诊断定位。
- **依赖**：A08,A09。
- **建议文件**：`apps/web/admin/agent-runs.tsx`、`apps/web/admin/agent-metrics.tsx`、`apps/api/analytics/agent.ts`、`quality/agent-dashboard.spec.ts`。

## A12 告警与故障处置

- [ ] **交付／验收**：每条告警有阈值/持续时间/负责人/处置手册；故障时业务保存不依赖分析系统。
- **验证**：供应商失败、队列堵塞、预算上限、重复通知抑制、恢复通知与采集端故障。
- **依赖**：A08,A11。
- **建议文件**：`infra/alerts/agent.yaml`、`docs/operations/agent-alerts.md`、`quality/agent/failure-drill.spec.ts`、`quality/agent/telemetry-health.spec.ts`。

### 检查点 AC4

- [ ] 对应用户路径与异常恢复可演示；运行与反馈证据齐全；产品验收记录明确未完成项。

## A13 第二场景复用验证

- [ ] **交付／验收**：私密复盘使用同一运行/产物/反馈协议；业务来源与权限不混用。
- **验证**：复盘与简历场景对照、不同账号/产品隔离、接口变更回归。
- **依赖**：A07,A10,T39,T40。
- **建议文件**：`workers/ai/review-workflow.ts`、`packages/agent-runtime/contracts.ts`、`quality/agent/reuse.spec.ts`、`docs/decisions/007-agent-reuse-validation.md`。

### 检查点 AC5

- [ ] 对应用户路径与异常恢复可演示；运行与反馈证据齐全；产品验收记录明确未完成项。
