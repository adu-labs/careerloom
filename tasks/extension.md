# 浏览器扩展工程任务

日期：2026-09-16。补充 T51；所有任务未实施。产品与技术依据：[扩展研究](../docs/design/浏览器扩展-竞品研究与实现补充.md)。

T51 保留最早受控试验；E01–E09 是正式交付拆分。建议 M2 建材料投影、M3 建收藏和填表、M4 接 AI、M6 完成商店发布与全链路验收。以下建议路径尚未创建，任务超过一次专注工作或 5 个主要文件时继续拆分。

## E01 扩展骨架与授权会话

- [ ] **验收／交付**：用户点击后打开侧栏，建立可撤销的限域会话；账号切换清理本地缓存。
- **验证**：伪造页面消息、过期凭证、权限拒绝与切换账号。
- **依赖**：T07,T11,T51。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/manifest.json`、`apps/extension/background.ts`、`apps/api/extension/sessions.ts`、`quality/extension/auth.spec.ts`。

## E02 网申资料与版本投影

- [ ] **验收／交付**：选定明确简历版本；独立网申资料补充经授权字段；隐藏经历不被资料库补回。
- **验证**：冲突字段、自由源码未确认数据、版本变化及跨用户访问。
- **依赖**：E01,T12,T22。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/extension/profile.ts`、`apps/api/db/application-profile.sql`、`apps/extension/materials.tsx`、`quality/extension/projection.spec.ts`。

## E03 岗位收藏与重复提示

- [ ] **验收／交付**：预览并确认后只写私人机会；来源链接去敏感参数；不确定重复仅提示。
- **验证**：JD缺字段、SPA换页、重复点击与账号隔离。
- **依赖**：E01,T27。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/job-extract.ts`、`apps/api/extension/opportunities.ts`、`apps/extension/job-panel.tsx`、`quality/extension/capture.spec.ts`。

### 检查点 EC1

- [ ] 受影响检查与构建通过，演示对应用户路径，记录失败样例、权限和数据流差异。

## E04 字段计划与受控执行

- [ ] **验收／交付**：先看原值/拟填值再执行；模型无任意脚本权限；读回失败不算成功。
- **验证**：合成控件、页面重绘、注入指令、已填值与执行中用户输入。
- **依赖**：E02。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/field-plan.ts`、`apps/extension/fill.ts`、`apps/extension/preview.tsx`、`quality/extension/fill.spec.ts`。

## E05 复杂控件适配

- [ ] **验收／交付**：重复经历、日期、级联、iframe等按支持清单处理；不支持明确降级。
- **验证**：12套表单矩阵；按字段/整表/覆盖率分别报告，适配超出范围则继续拆分站点任务。
- **依赖**：E04。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/adapters/forms.ts`、`apps/extension/adapters/registry.ts`、`quality/extension/forms.spec.ts`、`quality/extension/compatibility.md`。

## E06 会话恢复与有限撤销

- [ ] **验收／交付**：worker重启不重复写；撤销不覆盖用户后续修改；刷新后明确恢复限制。
- **验证**：进程终止、跨页、控件消失、撤销前用户再编辑。
- **依赖**：E04。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/run-store.ts`、`apps/extension/undo.ts`、`apps/extension/recovery.tsx`、`quality/extension/recovery.spec.ts`。

### 检查点 EC2

- [ ] 受影响检查与构建通过，演示对应用户路径，记录失败样例、权限和数据流差异。

## E07 个人浏览筛选

- [ ] **验收／交付**：折叠已投和规则匹配项，显示原因可恢复；仅按需申请站点权限。
- **验证**：误判恢复、虚拟列表、动态列表与私人规则可选同步。
- **依赖**：E03。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/filter.ts`、`apps/extension/rules.tsx`、`apps/api/extension/rules.ts`、`quality/extension/filter.spec.ts`。

## E08 开放题建议与投递确认

- [ ] **验收／交付**：开放题先审核；填表不等于投递；用户最终修改与拟填快照区分。
- **验证**：无回执、自报投递、站点自动保存、重复确认和事实校验。
- **依赖**：E04,E03,T31,T27。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/extension/answers.ts`、`apps/extension/submission.tsx`、`apps/api/extension/observations.ts`、`quality/extension/submission.spec.ts`。

## E09 分浏览器发布与运营

- [ ] **验收／交付**：Chrome/Edge分别验收；代码打包发布；坏适配可关闭；诊断由用户预览确认。
- **验证**：最小权限、撤销登录、更新迁移、隐私数据流、打包审查与完整投递旅程。
- **依赖**：E05,E06,E07,E08。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`quality/extension/release.spec.ts`、`docs/extension-support.md`、`infra/extension/release.md`、`quality/extension/privacy.spec.ts`。

### 检查点 EC3

- [ ] 受影响检查与构建通过，演示对应用户路径，记录失败样例、权限和数据流差异。
