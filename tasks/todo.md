# 工程任务与验收清单

日期：2026-09-16。全部未实施；下列复选框不能按原型页面是否存在来勾选。依赖是必要前置，路径均为拟建文件。每项是工作切片；实际超出 5 个主要文件或一次专注工作范围时继续拆分。

[实施规划](plan.md) · [技术方案](../docs/design/找工作工作台-技术实现方案.md)

每项通用完成条件：类型检查与构建通过、受影响测试通过、权限和失败状态有证据、更新契约及变更说明。涉及外部系统的测试先用沙箱或受控样本。

## T01 工程骨架与验证命令

- [ ] **交付**：建立独立正式项目骨架与 dev/staging 配置约定；不覆盖原型。
- **验收**：干净环境能启动占位 Web/API/数据库，缺配置可解释失败。
- **验证**：启动、停止及配置缺失验证。
- **依赖**：—。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`infra/compose.yaml`、`package.json`、`quality/README.md`。

## T02 原生 JSON／YAML 排版试验

- [ ] **交付**：验证同一内容 JSON/YAML 等价输入和中文 Typst 输出。
- **验收**：两种输入输出内容相同，中文可提取，记录字体与版本。
- **验证**：混排、多页、隐藏字段样本比较。
- **依赖**：T01。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`quality/formats/native.yaml`、`workers/render/spikes/native.py`、`quality/formats/native-check.md`。

## T03 LaTeX 工程隔离试验

- [ ] **交付**：验证中文 XeLaTeX 与受限工程编译。
- **验收**：正常工程成功；越界读、shell、联网、死循环失败并回收资源。
- **验证**：正常与恶意样本执行报告。
- **依赖**：T01。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`workers/render/spikes/latex.py`、`infra/render/latex.Dockerfile`、`quality/formats/latex-check.md`。

### 检查点 C01

- [ ] T01–T03 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T04 RenderCV／Typst 兼容试验

- [ ] **交付**：确定 RenderCV 方言与 Typst 包、字体支持范围。
- **验收**：各有真实 PDF/源码产物；缺包、版本不兼容可诊断。
- **验证**：固定版本中英文样本及离线重跑。
- **依赖**：T02。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`workers/render/spikes/rendercv.py`、`workers/render/spikes/typst.py`、`quality/formats/compatibility.md`。

## T05 中文语音供应商试验

- [ ] **交付**：验证 ASR/LLM/TTS 流式链路与费用。
- **验收**：记录手机桌面延迟、技术词错误、断网恢复与单位成本。
- **验证**：真人授权麦克风的国内网络测试。
- **依赖**：T01。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`apps/voice-gateway/spike.ts`、`quality/voice/cases.md`、`quality/voice/report.md`。

## T06 授权隔离试验

- [ ] **交付**：验证个人、公司、猎头与按单授权机制。
- **验收**：跨用户、跨组织、越权角色、撤销权限均拒绝。
- **验证**：使用非数据库所有者连接执行负向集成测试。
- **依赖**：T01。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`apps/api/auth/policy.ts`、`apps/api/db/rls.sql`、`quality/auth/isolation.spec.ts`。

### 检查点 C02

- [ ] T04–T06 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T07 真实登录会话

- [ ] **交付**：手机号登录与安全会话。
- **验收**：验证码限流、注销失效、敏感身份变更复核可用。
- **验证**：过期验证码、重放、CSRF 和会话撤销验证。
- **依赖**：T06。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/auth/session.ts`、`apps/web/auth/page.tsx`、`apps/api/db/identity.sql`、`quality/auth/session.spec.ts`。

## T08 三阶段求职计划

- [ ] **交付**：创建和切换实习、校招、社招计划。
- **验收**：三个入口同等可用，切换不丢失原计划数据。
- **验证**：跨计划读写及刷新恢复测试。
- **依赖**：T07。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/plans/plans.ts`、`apps/web/plans/page.tsx`、`apps/api/db/plans.sql`、`quality/plans.spec.ts`。

## T09 经历与证据库

- [ ] **交付**：手动维护经历与私人证据关联。
- **验收**：增改删及字段来源可见，附件仅本人可读。
- **验证**：两账号附件访问和字段校验。
- **依赖**：T08。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/experience/experience.ts`、`apps/web/experience/page.tsx`、`apps/api/db/experience.sql`、`quality/experience.spec.ts`。

### 检查点 C03

- [ ] T07–T09 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T10 用户待办

- [ ] **交付**：用户自行创建分类待办。
- **验收**：分类、日期、完成、删除可用；建议不自动成为任务。
- **验证**：空初始列表、CRUD 和建议确认流程。
- **依赖**：T08。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/tasks/tasks.ts`、`apps/web/today/tasks.tsx`、`apps/api/db/tasks.sql`、`quality/tasks.spec.ts`。

## T11 文件与异步任务底座

- [ ] **交付**：授权上传下载与数据库任务状态。
- **验收**：重复投递不重复副作用；取消和失败可查；文件鉴权生效。
- **验证**：重启 worker、重放、过期下载链接测试。
- **依赖**：T07。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`apps/api/files/files.ts`、`apps/api/jobs/outbox.ts`、`apps/api/db/jobs.sql`、`workers/common/runner.ts`、`quality/jobs.spec.ts`。

## T12 简历模型与可视化编辑

- [ ] **交付**：结构化草稿与字段显隐。
- **验收**：表单可修改、排序、隐藏，自动保存并显示冲突。
- **验证**：两窗口并发和隐藏字段投影测试。
- **依赖**：T09。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`packages/resume/schema.ts`、`apps/api/resumes/draft.ts`、`apps/web/resumes/editor.tsx`、`apps/api/db/resumes.sql`、`quality/resume-edit.spec.ts`。

### 检查点 C04

- [ ] T10–T12 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T13 简历版本与复制

- [ ] **交付**：保存、比较、恢复和复制独立简历。
- **验收**：恢复不改历史；复制可选任意现有简历；新副本无公开授权。
- **验证**：版本差异、并发保存、复制隔离测试。
- **依赖**：T12。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`packages/resume/revisions.ts`、`apps/api/resumes/revisions.ts`、`apps/web/resumes/history.tsx`、`quality/revisions.spec.ts`。

## T14 模板 manifest 与私人库

- [ ] **交付**：内置与自带模板统一管理。
- **验收**：版本和来源明确，自带默认私有，可设默认、移除、导出。
- **验证**：移除模板后旧简历快照不变。
- **依赖**：T11。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`packages/templates/schema.ts`、`apps/api/templates/library.ts`、`apps/web/templates/library.tsx`、`apps/api/db/templates.sql`、`quality/templates.spec.ts`。

## T15 JSON 导入导出

- [ ] **交付**：区分原生内容、模板包与 JSON Resume。
- **验收**：可校验、预览映射、确认、导出；未知扩展保留或报告。
- **验证**：往返语义、错误 schema、作者示例不入个人事实测试。
- **依赖**：T12,T14。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`packages/resume/json-adapter.ts`、`apps/api/imports/json.ts`、`apps/web/imports/json.tsx`、`quality/json-roundtrip.spec.ts`。

### 检查点 C05

- [ ] T13–T15 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T16 YAML 导入导出

- [ ] **交付**：支持原生 YAML 与固定版本 RenderCV 方言。
- **验收**：内容/设计可分开选；无效输入不覆盖最后有效稿。
- **验证**：alias 攻击、未知方言、字段转换测试。
- **依赖**：T15,T04。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`packages/resume/yaml-adapter.ts`、`apps/api/imports/yaml.ts`、`apps/web/imports/yaml.tsx`、`quality/yaml-roundtrip.spec.ts`。

## T17 源码工程导入与编辑

- [ ] **交付**：LaTeX/Typst 文件和 ZIP 工程可编辑。
- **验收**：入口和依赖清晰；源码版本可恢复；不支持映射明确显示。
- **验证**：路径穿越、压缩炸弹、自由源码保存恢复测试。
- **依赖**：T14,T03,T04。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/imports/bundle.ts`、`packages/templates/bundle.ts`、`apps/web/templates/source-editor.tsx`、`quality/source-bundle.spec.ts`。

## T18 原生与 RenderCV 渲染

- [ ] **交付**：后台真实 PDF 预览和导出。
- **验收**：两条路径生成实际结果；预览与下载同产物；任务可取消。
- **验证**：中文字体、分页、溢出、缓存鉴权测试。
- **依赖**：T11,T16。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/render/native.py`、`workers/render/rendercv.py`、`apps/web/resumes/preview.tsx`、`quality/render-native.spec.ts`。

### 检查点 C06

- [ ] T16–T18 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T19 LaTeX／Typst 渲染

- [ ] **交付**：将源码接入隔离正式 worker。
- **验收**：真实编辑改变 PDF；锁定依赖；源工程可导出。
- **验证**：超时资源清理、断网依赖、错误定位测试。
- **依赖**：T17,T18。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/render/latex.py`、`workers/render/typst.py`、`infra/render/policy.yaml`、`quality/render-source.spec.ts`。

## T20 新建简历流程

- [ ] **交付**：选模板、选任意已有内容或空白、命名创建。
- **验收**：模板可来自内置/私有/已获权市场；取消不创建。
- **验证**：Esc、关闭、回退、重复点击与示例内容隔离测试。
- **依赖**：T13,T14,T18。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`apps/web/resumes/create.tsx`、`apps/api/resumes/create.ts`、`quality/resume-create.spec.ts`。

## T21 回收站与材料快照

- [ ] **交付**：删除恢复与冻结 PDF/模板/内容。
- **验收**：旧材料稳定；删除关闭展示；源文件与 PDF 哈希关联。
- **验证**：模板升级、内容修改、删除后历史材料测试。
- **依赖**：T13,T18。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/resumes/trash.ts`、`apps/api/resumes/artifacts.ts`、`apps/web/resumes/trash.tsx`、`quality/artifacts.spec.ts`。

### 检查点 C07

- [ ] T19–T21 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T22 招聘展示与分享授权

- [ ] **交付**：按版本、角色、字段管理可见范围。
- **验收**：默认私有；只有社招可授予猎头；撤销后立即拒绝读取。
- **验证**：联系方式独立授权、链接撤销和跨角色测试。
- **依赖**：T21,T06。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/grants/grants.ts`、`apps/web/resumes/sharing.tsx`、`apps/api/db/grants.sql`、`quality/grants.spec.ts`。

## T23 四格式验收集

- [ ] **交付**：完成四格式从导入到恢复导出的整体验证。
- **验收**：四格式均有中文/中英样本；已知不支持项有报告。
- **验证**：逐格式真实编辑、下载、重新导入和版本恢复。
- **依赖**：T15,T16,T19,T20,T21。
- **预计范围**：S，2 个主要文件。
- **建议文件**：`quality/formats/acceptance.spec.ts`、`quality/formats/report.md`。

## T24 机构核验与邀请

- [ ] **交付**：负责人录入核验结果和邀请。
- **验收**：付费不自动核验；HR 属于具体公司；到期撤销权限。
- **验证**：伪造组织、重复邀请、核验撤回测试。
- **依赖**：T07。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/partners/verification.ts`、`apps/web/admin/partners.tsx`、`apps/api/db/partners.sql`、`quality/verification.spec.ts`。

### 检查点 C08

- [ ] T22–T24 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T25 公共岗位发布与管理

- [ ] **交付**：管理员/核验招聘方提交岗位审核。
- **验收**：岗位有来源、官网链接和生命周期；普通用户无法发布。
- **验证**：岗位审核、关闭、跨公司修改拒绝测试。
- **依赖**：T24。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/jobs/publishing.ts`、`apps/web/recruiter/jobs.tsx`、`apps/api/db/published-jobs.sql`、`quality/job-publish.spec.ts`。

## T26 岗位检索与推荐

- [ ] **交付**：全部公共招聘与个人推荐分开。
- **验收**：阶段偏好过滤、推荐理由、不感兴趣可用。
- **验证**：过期岗位、错阶段、官方链接与详情返回测试。
- **依赖**：T25,T08。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/indexer/jobs.ts`、`apps/api/jobs/discovery.ts`、`apps/web/jobs/page.tsx`、`quality/job-discovery.spec.ts`。

## T27 私人机会与投递

- [ ] **交付**：个人记录与实际投递状态。
- **验收**：私人记录不公开；投递关联材料快照；可记外部来源。
- **验证**：收藏不等于投递、历史岗位修改和重复提交测试。
- **依赖**：T26,T21。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`apps/api/opportunities/opportunities.ts`、`apps/api/applications/applications.ts`、`apps/web/opportunities/page.tsx`、`apps/api/db/applications.sql`、`quality/applications.spec.ts`。

### 检查点 C09

- [ ] T25–T27 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T28 内推伙伴与公司页

- [ ] **交付**：维护代码、适用岗位、合同权益与有效期。
- **验收**：内推详情可返回岗位；复制不标记投递成功；失效提示。
- **验证**：有效期、来源关联、无权限编辑与返回路径测试。
- **依赖**：T25,T24。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/referrals/referrals.ts`、`apps/web/companies/referrals.tsx`、`apps/web/admin/referrals.tsx`、`quality/referrals.spec.ts`。

## T29 面试日程与周历

- [ ] **交付**：新增编辑面试和切换日期。
- **验收**：今天/周切换反映同一日程；真实与模拟状态分离。
- **验证**：跨日时区、改期、取消、选择日期测试。
- **依赖**：T27。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/interviews/events.ts`、`apps/web/interviews/calendar.tsx`、`apps/api/db/interviews.sql`、`quality/calendar.spec.ts`。

## T30 岗位来源同步

- [ ] **交付**：授权企业数据源增量同步。
- **验收**：重复数据不重复创建，过期与失败可见，不确定合并待审。
- **验证**：重复拉取、外部删除、网络失败与来源回溯测试。
- **依赖**：T25,T11。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/indexer/job-sync.ts`、`apps/api/jobs/sources.ts`、`apps/web/admin/sources.tsx`、`quality/job-sync.spec.ts`。

### 检查点 C10

- [ ] T28–T30 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T31 AI 持久工作流

- [ ] **交付**：按任务保存步骤、预算、权限与来源。
- **验收**：断点恢复、取消、重试幂等；工具不能越权。
- **验证**：提示注入、进程重启、预算超限与重复队列测试。
- **依赖**：T11,T06。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`workers/ai/harness.ts`、`workers/ai/tools.ts`、`apps/api/ai/tasks.ts`、`packages/contracts/ai.ts`、`quality/harness.spec.ts`。

## T32 定向改写与英文简历

- [ ] **交付**：生成待审差异与独立英文草稿。
- **验收**：隐藏事实不送模型；事实数字保留；用户确认才保存新版本。
- **验证**：授权样本评测、拒绝建议、原稿并发变更测试。
- **依赖**：T31,T13。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/ai/resume.ts`、`apps/web/resumes/ai-review.tsx`、`packages/resume/fact-check.ts`、`quality/resume-ai.spec.ts`。

## T33 Markdown 私密复盘

- [ ] **交付**：编辑、自动保存、恢复、导出复盘。
- **验收**：刷新恢复；Markdown 预览不执行脚本；可关联面试。
- **验证**：并发写入、XSS、导出与版本恢复测试。
- **依赖**：T08,T11。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/reviews/reviews.ts`、`apps/web/reviews/editor.tsx`、`apps/api/db/reviews.sql`、`quality/reviews.spec.ts`。

### 检查点 C11

- [ ] T31–T33 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T34 面经发布与题源许可

- [ ] **交付**：私人内容复制为独立公开草稿。
- **验收**：匿名、审核、撤回、抽题授权分别可用；模拟来源不伪装真面试。
- **验证**：不自动发布、再编辑重审和授权撤回测试。
- **依赖**：T33。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`apps/api/community/posts.ts`、`apps/web/community/editor.tsx`、`apps/web/admin/moderation.tsx`、`apps/api/db/community.sql`、`quality/community.spec.ts`。

## T35 中文检索与权限过滤

- [ ] **交付**：公开面经和私人复盘分域检索。
- **验收**：支持全文/标签，结果与摘要均鉴权；撤权立即拒绝。
- **验证**：中文标注查询集、索引延迟与跨账号搜索测试。
- **依赖**：T33,T34。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/indexer/content.ts`、`apps/api/search/search.ts`、`apps/web/search/results.tsx`、`quality/search.spec.ts`。

## T36 题单生成与自定义题

- [ ] **交付**：从许可来源组卷或只用自定义题。
- **验收**：来源可追溯，补充题明确，自定义-only 不混题。
- **验证**：来源不足、撤回、去重、题数和方向覆盖测试。
- **依赖**：T35,T31,T29。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/ai/questions.ts`、`apps/api/interviews/question-set.ts`、`apps/web/interviews/setup.tsx`、`quality/questions.spec.ts`。

### 检查点 C12

- [ ] T34–T36 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T37 文字模拟与追问

- [ ] **交付**：题单驱动轮次与可控追问。
- **验收**：暂停恢复、提前结束、实际回答保存；追问遵守用户设置。
- **验证**：重复消息、未作答、供应商失败与刷新恢复测试。
- **依赖**：T36。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/interviews/session.ts`、`apps/web/interviews/chat.tsx`、`workers/ai/interviewer.ts`、`quality/mock-text.spec.ts`。

## T38 流式语音与断线恢复

- [ ] **交付**：ASR/LLM/TTS 与文字同会话。
- **验收**：用户启用麦克风；可修订转写；重连无重复轮次；文字降级。
- **验证**：设备实测、网络切断、打断、权限拒绝测试。
- **依赖**：T37,T05。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/voice-gateway/session.ts`、`apps/web/interviews/audio.ts`、`packages/contracts/voice.ts`、`quality/mock-voice.spec.ts`。

## T39 自动复盘归档

- [ ] **交付**：先保存真实问答再生成派生总结。
- **验收**：跳过补写仍归档；未作答明确；重试不重复建文档。
- **验证**：结束并发、模型失败、参考答案与实际回答分离测试。
- **依赖**：T37,T33,T31。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/ai/recap.ts`、`apps/api/interviews/finish.ts`、`apps/web/interviews/finish.tsx`、`quality/recap.spec.ts`。

### 检查点 C13

- [ ] T37–T39 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T40 复盘 AI 建议与成长视图

- [ ] **交付**：提出知识、表达、解题与练习方向。
- **验收**：用户选择插入；原文不覆盖；跨复盘只检索本人授权内容。
- **验证**：事实/来源评测、插入撤销、私密范围测试。
- **依赖**：T35,T39。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`workers/ai/review-coach.ts`、`apps/web/reviews/assistant.tsx`、`apps/web/reviews/progress.tsx`、`quality/review-ai.spec.ts`。

## T41 HR 候选人与组织协作

- [ ] **交付**：组织内处理岗位申请和授权展示。
- **验收**：成员离职失权；仅本组织申请可管理；联系权限独立。
- **验证**：跨公司、离职、撤回展示与最小字段测试。
- **依赖**：T25,T27,T22。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/recruiter/candidates.ts`、`apps/web/recruiter/candidates.tsx`、`apps/api/recruiter/members.ts`、`quality/recruiter.spec.ts`。

## T42 猎头社招推荐流程

- [ ] **交付**：独立猎头入口和按公司推荐授权。
- **验收**：仅社招，核验有效；推荐指定公司前有用户授权。
- **验证**：校招查询拒绝、授权撤销和合同到期测试。
- **依赖**：T24,T22,T27。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/hunters/recommendations.ts`、`apps/web/hunters/workspace.tsx`、`apps/api/db/recommendations.sql`、`quality/hunters.spec.ts`。

### 检查点 C14

- [ ] T40–T42 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T43 人工服务预约与材料授权

- [ ] **交付**：简历修改/模拟/辅导创建服务单。
- **验收**：三阶段可用，金额规则版本冻结，材料按单明确选择。
- **验证**：改约取消、未授权材料和人工模拟上下文测试。
- **依赖**：T24,T29,T22。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/services/orders.ts`、`apps/web/services/booking.tsx`、`apps/api/db/service-orders.sql`、`quality/service-orders.spec.ts`。

## T44 服务方安全协作页

- [ ] **交付**：免完整账号的受限链接接单交付。
- **验收**：链接过期/重发/撤销有效，只见当前单；交付可确认。
- **验证**：令牌重放、越单下载、撤销会话测试。
- **依赖**：T43。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/services/links.ts`、`apps/web/cooperate/page.tsx`、`apps/api/services/delivery.ts`、`quality/cooperate.spec.ts`。

## T45 订单、支付与账本

- [ ] **交付**：统一订单、支付确认和追加账务。
- **验收**：验签与金额校验，重复事件只入账一次，退款可追溯。
- **验证**：沙箱回调重放、乱序、退款与断电事务测试。
- **依赖**：T11,T24。
- **预计范围**：M，5 个主要文件。
- **建议文件**：`apps/api/billing/orders.ts`、`apps/api/billing/webhook.ts`、`apps/api/billing/ledger.ts`、`apps/api/db/billing.sql`、`quality/billing.spec.ts`。

### 检查点 C15

- [ ] T43–T45 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T46 市场上架与权利检查

- [ ] **交付**：模板/示例/资料分型发布审核。
- **验收**：授权、文件、依赖和示例脱敏确认；未知权利不自动放行。
- **验证**：内容类型、恶意工程、模板升级不改旧商品版本测试。
- **依赖**：T14,T23,T24。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/market/listings.ts`、`apps/web/market/publish.tsx`、`apps/web/admin/market.tsx`、`quality/market-publish.spec.ts`。

## T47 模板购买与独立导入

- [ ] **交付**：付款获得约定版本，导入独立可改副本。
- **验收**：前端成功页不能发权益；作者经历不入买家事实；退款规则可执行。
- **验证**：重复支付、无权下载、退款、模板撤架测试。
- **依赖**：T46,T45,T20。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/market/entitlements.ts`、`apps/web/market/purchase.tsx`、`apps/api/market/import.ts`、`quality/market-purchase.spec.ts`。

## T48 返现审核与服务商对账

- [ ] **交付**：10元反馈返现与佣金应收分别处理。
- **验收**：服务单唯一返现；无好评前提；证据争议不自动扣款。
- **验证**：重复证据、双方金额不一致、退款冲正、余额对账测试。
- **依赖**：T44,T45。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/services/rewards.ts`、`apps/api/services/settlements.ts`、`apps/web/admin/settlement.tsx`、`quality/settlement.spec.ts`。

### 检查点 C16

- [ ] T46–T48 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T49 合作权益与运营审计

- [ ] **交付**：线下核验/付款结果与线上权益同步。
- **验收**：费用不代替核验；到期策略可见；敏感访问与手动改账有审计。
- **验证**：权限到期、运营越权、审计脱敏与导出测试。
- **依赖**：T42,T48,T28。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/partners/entitlements.ts`、`apps/web/admin/operations.tsx`、`apps/api/audit/events.ts`、`quality/operations.spec.ts`。

## T50 通知与提醒偏好

- [ ] **交付**：面试改期、服务进度与任务结果通知。
- **验收**：用户选择渠道与时间；取消日程停止提醒；AI不自动建待办。
- **验证**：幂等发送、退订、时区与失败重试测试。
- **依赖**：T29,T43。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/api/notifications/notifications.ts`、`apps/web/settings/notifications.tsx`、`workers/common/reminders.ts`、`quality/notifications.spec.ts`。

## T51 浏览器填表受控试验

正式交付另见 [E01–E09](extension.md)；本项仅是早期验证，应在 M2/M3 启动，不能作为完整扩展已交付的依据。

- [ ] **交付**：本人确认的简历字段辅助填表。
- **验收**：显式触发、字段预览、最终提交确认；复制不算成功投递。
- **验证**：受控测试站字段映射、隐藏经历、误填撤销测试。
- **依赖**：T21,T27。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`apps/extension/manifest.json`、`apps/extension/fill.ts`、`apps/extension/panel.tsx`、`quality/autofill.spec.ts`。

### 检查点 C17

- [ ] T49–T51 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T52 原型数据迁移

- [ ] **交付**：用户主动导出后预览导入。
- **验收**：演示身份/订单/付款不迁移为真实状态；无效内容报告。
- **验证**：旧版本样例、重复导入、取消和源文本重新校验。
- **依赖**：T23,T33,T27。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`packages/resume/prototype-import.ts`、`apps/web/imports/legacy.tsx`、`quality/legacy-import.spec.ts`。

## T53 全角色浏览器验收

- [ ] **交付**：执行技术方案14节完整旅程。
- **验收**：三阶段和各角色闭环通过，关闭返回/取消/日期切换可用。
- **验证**：桌面手机、键盘、空态/错误态、跨账号浏览器验证。
- **依赖**：T30,T40,T41,T42,T47,T48,T50,T51,T52,E09,I02,A12,A13。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`quality/e2e/journeys.spec.ts`、`quality/e2e/accessibility.spec.ts`、`quality/e2e/report.md`。

## T54 恢复、负载与费用验收

- [ ] **交付**：演练数据库/文件恢复与异步重放。
- **验收**：达到经确认的容量、RPO/RTO与预算；历史材料可重现。
- **验证**：备份恢复、worker故障、供应商故障和费用账核对。
- **依赖**：T49,T53。
- **预计范围**：M，4 个主要文件。
- **建议文件**：`infra/recovery/runbook.md`、`quality/load/scenarios.ts`、`quality/recovery/report.md`、`quality/cost/report.md`。

### 检查点 C18

- [ ] T52–T54 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## T55 生产发布与运营交接

- [ ] **交付**：准备发布回滚、客服审核与争议流程。
- **验收**：阻断问题清零、秘密配置隔离、监控告警与负责人明确。
- **验证**：staging全流程、回滚演练和小流量验证。
- **依赖**：T54。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`infra/release/runbook.md`、`docs/operations.md`、`quality/release-checklist.md`。

### 检查点 C19

- [ ] T53–T55 对应路径演示、模块测试、构建与失败恢复记录齐全；记录产品反馈及未达标项。

## 需求覆盖索引

| 需求 | 任务 |
|---|---|
| 三阶段、经历库、待办与周历 | T08–T10、T29 |
| 四格式、自带模板、任意简历复制、取消与版本 | T12–T23 |
| 英文简历与定向改写 | T31–T32 |
| 岗位来源、推荐、公司内推、私人机会与投递 | T24–T30 |
| 招聘展示、企业 HR、社招猎头 | T22、T24、T41–T42 |
| 语音/文字模拟、自定义题、自动归档 | T36–T39 |
| Markdown 复盘、检索、AI 建议、面经社区 | T33–T35、T40 |
| 人工修改/模拟/辅导、免完整账号协作 | T43–T44 |
| 模板市场、支付、退款、10元返现、服务商费用 | T45–T48 |
| 负责人线下对接、线上权益与审计 | T24、T28、T49 |
| 通知、填表、数据迁移、可靠上线 | T50–T55 |

扩展正式建设补充：[E01–E09](extension.md)，纳入 T53 全角色验收依赖。


## I01 国际化数据与文案基础（国内阶段）

- [ ] **交付／验收**：界面语言、市场、内容语言和时区独立；文案 key 化；电话、地址、货币周期和日期支持地区配置。
- **验证**：中文用户申请海外岗位、英语用户申请国内岗位、中英文长度、不同币种精度及夏令时边界样例。
- **依赖**：T08。
- **预计范围**：M，4 个主要文件；应用各页面时随相关任务增补文案，不集中成一次大改。
- **建议文件**：`packages/contracts/locale.ts`、`apps/api/db/localization.sql`、`apps/web/i18n/messages.ts`、`quality/i18n-foundation.spec.ts`。

## I02 英文简历与语言隔离验收（国内阶段）

- [ ] **交付／验收**：可直接新建英文简历或翻译中文版本；语言切换不改原文，字体排版、显隐与独立版本均正确。
- **验证**：英文／中英混排导出、未知专名确认、源版本关联、隐藏事实和搜索语言样例。
- **依赖**：I01,T23,T32。
- **预计范围**：M，3 个主要文件。
- **建议文件**：`quality/i18n-resume.spec.ts`、`quality/formats/english-fixtures.json`、`quality/i18n-report.md`。

### 检查点 IC1

- [ ] I01、I02 达标后进入国内 T53 完整验收；不要求海外岗位已经接入。

## I03 英文完整体验（海外阶段工作包）

- [ ] **交付／验收**：完整英文 UI、通知与错误，英文 AI/语音模拟与复盘，跨时区日程可用。
- **验证**：英文用户全旅程、英语口音与术语、断线转写、夏令时日程、所有可见文案覆盖检查。
- **依赖**：I02,T38,T40,T50。
- **预计范围**：工作包，实施前拆为 UI 文案、AI 评测、语音评测与时区验收的 S/M 任务，不按一次小任务估时。
- **建议涉及目录**：`apps/web/i18n/`、`workers/ai/`、`apps/voice-gateway/`、`quality/i18n/`。

## I04 海外市场与扩展适配（海外阶段工作包）

- [ ] **交付／验收**：选定市场有可追溯岗位源和实际验证的表单适配；资格回答由用户确认，语言与地区不互相推断。
- **验证**：目标地区岗位、金额／周期、英语表单和许可问答；数据路由、供应商可用性及合作方服务范围验证。
- **依赖**：I03,E09,T30。
- **预计范围**：工作包；选定市场后按数据源／站点拆成不超过 5 个主要文件的任务，不承诺全球通用。
- **建议涉及目录**：`workers/indexer/`、`apps/extension/adapters/`、`apps/api/partners/`、`quality/markets/`。

### 检查点 IC2

- [ ] I03、I04 子任务和目标市场验收全部通过后才标记该海外市场正式支持。

工作记录、AI 默认入口与运行反馈闭环见 [A01–A13](agent-workspace.md)，纳入国内完整平台验收；其中观测 A08 随首个真实 Agent 建设。
