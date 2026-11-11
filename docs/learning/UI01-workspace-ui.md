# UI01：从零理解与重建 Careerloom 工作台界面

- 用户批准：2026-11-11，确认当前工作台视觉，并授权完成必要优化后发布。批准范围为 UI01 的原型界面与 T01b 视觉，不将其扩大为 T01a/T01b 后端与连接功能的批准。
- 代码基线：`69d2a91` 之上的 UI01 变更；文末列出最终源码 SHA-256。发布前补充了文字对比度、页面导航焦点、无脚本提示与资源版本号，属于本次授权的界面完善。
- 最后校验：2026-11-11。完整业务交互仍是静态原型，Next.js 当前提供独立连接检查页。
- 对应源码：[展示函数](../../prototype/dist/workspace-ui.js)、[主题样式](../../prototype/dist/workspace-ui.css)、[交互编排](../../prototype/dist/workbench.js)、[基础入口](../../prototype/dist/app.js)、[产品边界](../design/找工作工作台-产品研究与功能设计.md)。

## 1. 目标与先备知识

这项改动解决三个具体问题：装饰占据首页主要空间、页面之间缺少稳定的层级、手机把多个桌面栏目挤在一起。完成本篇练习后，应能把已有业务数据组织成可用的首页，同时保留简历排版、数据保存和原有操作。

需要理解 HTML 的语义元素、CSS 选择器与 Grid、JavaScript 数组和对象、DOM 事件，以及浏览器 localStorage 的基本用途。原型使用普通 JavaScript，不需要 React、TypeScript 编译或 npm 安装。T01b 则使用 React/TypeScript；它的请求状态机与同源接口由独立的 [T01b 审阅文档](../implementation-review/T01b-web-bootstrap.md)解释，本篇只涉及其样式。

本地需 Python 3 提供静态 HTTP 服务；Python 在这里是启动工具，不是主业务 API。正式业务 API 仍采用 NestJS/TypeScript。

## 2. 先理解一次操作如何执行

[index.html](../../prototype/dist/index.html) 依次加载基础样式、工作区主题、展示函数、基础应用、扩展工作台与模板脚本。`workspace-ui.js` 可以先声明函数，但不能在此时读取尚未初始化的 `state`；最终由模板脚本完成扩展后触发 `render()`。

```text
state + 当前 mode
  → workbench.today()
  → renderDashboard()
  → HTML 放入 #app

点击 / change
  → document 上的事件委托
  → 修改原 state
  → persist() 保存本机
  → render() 重建页面
  → 恢复必要的键盘焦点
```

例如点击待办复选框：浏览器先改变 `checked`，工作台的 change 监听器再读取 `data-todo` 找到同一条记录，写入 `done`，保存并重绘。展示函数没有自己的第二份待办状态，因此统计数字和列表不会各自更新、互相矛盾。

重绘会删除原 DOM。若不处理焦点，键盘用户完成一项后会失去当前位置。本实现把焦点交给下一项未完成任务；没有下一项时交给“已完成”摘要；取消完成时交给恢复到列表的那条任务。页面导航同理，焦点进入带可访问名称的主内容区。

## 3. 按可运行的小步从空白搭建

### 第一步：从一个明确的内容入口开始

创建一个包含 `main` 的页面，为它设置稳定 ID。先写标题和一条虚构待办，不放图片或统计。用浏览器检查标题、输入和按钮是否按阅读顺序出现。

在真实项目中，入口在 [renderIntro()](../../prototype/dist/workspace-ui.js)；进入工作台后由 [render()](../../prototype/dist/app.js) 输出固定导航、顶栏和主内容。不要复制真实简历作为练习数据。

预期结果：不依赖接口即可看到页面；Tab 能到达按钮；禁用 JavaScript 时看到启用提示，不是空白页面。

### 第二步：确定状态归属，再计算视图

让 `state.todos` 成为唯一数据来源，用当前 `mode` 过滤。再分为 pending 和 done，而不是把两份数组分别保存。统计投递和面试也先按求职阶段过滤；简历仍采用项目原有的跨阶段共享规则。

核心计算可以写为：

```js
const todos = state.todos.filter(task => task.mode === mode);
const pending = todos.filter(task => !task.done);
const done = todos.filter(task => task.done);
```

预期结果：切换阶段后只看到该阶段的待办；同一条任务完成时，未完成计数减一，已完成摘要计数加一。空列表提供实际可用的“添加待办”入口，不自动制造任务。

### 第三步：复用事件契约

按钮继续使用原有 `data-act`、导航使用 `data-page`、复选框使用 `data-todo`。这些属性是视图与事件处理的约定；改变名字却不更新监听器会产生“看起来能点、实际无反应”的控件。

[dashboardTask()](../../prototype/dist/workspace-ui.js) 负责单条任务的 HTML，[workbench.js](../../prototype/dist/workbench.js) 负责状态更新。展示函数接收或读取状态，返回字符串；保存、副作用和角色规则继续留在业务脚本。

预期结果：原来的编辑、保存、导入、角色切换仍由同一套处理器执行。按钮新增时，应优先链接已有操作，不用一个只弹成功提示的假流程替代真实原型行为。

### 第四步：用 Grid 表达区域关系

首页是四个有意义的区域：待办、日历、岗位推荐、简历工作区。桌面用两列，手机按这个顺序堆叠。用 grid-template-areas 明确关系，避免用大量宽度百分比与负边距凑布局。

内容列使用 `minmax(0, ...)`。其中的 0 允许网格收缩，否则长标题、输入或表格的最小内容宽度可能撑开整页。表格、看板、简历选择器需要横向滚动时，让局部容器 `overflow: auto`；不把整页溢出藏起来。

预期结果：1440px 可以同时看到任务与日程；390px 日历铺满内容宽度；320px 按钮可换行，页面本身不横向滚动。

### 第五步：统一外观，保留材料契约

[workspace-ui.css](../../prototype/dist/workspace-ui.css) 加载在基础组件之后，集中定义界面色、字级、控件与响应式约束。历史变量 `--blue` 是兼容别名，实际含义是操作色，不要求它必须为蓝色。

用户简历使用另一组 `--tpl-*` 变量控制字体、颜色、行高和页边距。工作台主题不能覆盖它们，否则一次 UI 改版会悄悄改变导出材料。[templates.js](../../prototype/dist/templates.js) 中的 `resumePaper` 包装器负责模板样式，编辑器外壳只负责工具与背景。

预期结果：导入主题色 `#aa4b36` 的虚构模板，简历章节标题仍保持该颜色，工作台导航使用自己的主题色。

### 第六步：补全边界和发布资源

为表单、搜索和图标按钮提供名称，为 dialog 关联标题，为主区域提供跳转目标。低对比的小字号只会在截图里显得轻，在实际阅读中容易看不清；本轮统一加深次要文字，并按计算后的背景颜色检查。

`prefers-reduced-motion` 让要求减少动态效果的用户直接滚动。`noscript` 提供无脚本提示。发布前统一更新脚本和样式的查询版本，减少旧缓存混用新旧界面的可能。不要更改 localStorage 键或站点来源来“解决缓存”，那会让原有材料看起来消失。

## 4. 实际使用的 JavaScript 与 CSS 知识

- 模板字符串用反引号组合 HTML，`${...}` 插入表达式；它不会自动转义。`E()` 把动态文本中的 `<`、引号等转换成安全文本。正文、标题和 aria-label 都必须考虑这一点。
- `map()` 把数据转为 HTML 片段，`join('')` 拼接。忘记 join 会把数组的逗号带进页面。`filter()` 创建视图数组，不删除原记录。
- `Object.entries(modes)` 把对象变成键值对，解构 `[key, value]` 让模式 ID 与显示文本一起使用，避免复制三套不一致的入口。
- `?.` 只在左侧为 null/undefined 时停止后续访问；它不等于运行时数据验证。找到任务后更新它，仍依赖 ID 存在这个交互不变量。
- `??` 在原工作台迁移函数中只为缺失字段补默认值，保留 false 和空数组。换成 `||` 可能误把有效的 false 当成缺失。
- CSS 自定义属性继承，选择器与加载顺序决定覆盖。这里让工作区主题覆盖基础界面，却让模板专用属性继续管理材料；无范围的大选择器和随意加 `!important` 容易破坏这个边界。
- `tabindex="-1"` 允许代码把焦点交给区域，同时不把区域加入正常 Tab 顺序。可访问名称让读屏软件知道进入了哪个页面。

原型没有静态类型编译。若后续迁入 TypeScript，任务与模板应定义接口，但接口也不能替代文件导入时的运行时校验。T01b 已使用 `ConnectionState` 联合类型区分检查中、成功与失败，其行为未被本次样式更新替换。

## 5. 决策、替代方案与失效条件

本轮参考了 [Mota](https://dribbble.com/shots/23200911-Mota-UX-UI-web-application-design-for-remote-work) 的工作区分工、[Taskly](https://dribbble.com/shots/26031962-Taskly-Task-Management-Dashboard) 的任务层级，以及 [Olack 求职界面](https://dribbble.com/shots/26937816-Job-Application-Dashboard-UI-Design) 的信息扫描方式。没有引入这些作品的图片或源码。

采用既有 CSS 和事件委托，因为目标是改善当前原型且不增加安装成本。若页面继续增长，全部重绘容易丢失焦点、滚动和未保存输入；届时应逐步用组件和明确的数据契约替换，而不是继续堆叠全局函数包装器。

保留文字导航，因为职业工作台有多个中文模块，纯图标容易降低可发现性。保留编辑器、表格、看板各自的结构，因为它们服务不同操作，统一外观不等于统一成卡片列表。

没有把展示图片加入首页。当前主要目标是处理任务，图片会增加首屏高度与下载量。将来确有说明价值时可以加入，但要先明确它帮助用户做什么。

## 6. 测试与从症状排查

已于 2026-11-11 执行：

| 检查 | 实际结果 |
| --- | --- |
| 4 个原型脚本 `node --check`、`git diff --check` | 通过，发布完善后再次检查 |
| Web typecheck、build、test | 通过，既有测试 10/10；最后发布完善只修改静态原型 |
| 10 页 × 6 宽度（1440/1280/1024/768/390/320） | 60 组无整页横向溢出、无捕获的脚本异常 |
| 企业/猎头/服务方/管理端 × 3 宽度 | 24 组无整页横向溢出 |
| 待办、简历显隐/版本、搜索/收藏/详情、投递三视图 | 实际操作通过 |
| 模板导入、Markdown 编辑预览、模拟问答保存与暂停恢复 | 合成样例通过；未开启麦克风或朗读 |
| 发布完善：文字对比度、键盘导航、存储异常、无脚本提示 | 主要 9 页抽查未发现低于目标对比度的工作区文字；键盘进入“我的简历”后焦点在具名 main；合成存储异常有提示；禁用 JavaScript 有说明 |
| 当前投递日历 | 实际使用共享周日历，显示 2026-11-09—15；旧审阅文档把未生效的基础月历描述成限制，已在本篇纠正 |

对比度抽查排除用户控制的简历排版、装饰头像与禁用控件，不代表完整无障碍认证。尚未验证 Safari、Firefox、真实触摸设备与屏幕阅读器。

复现静态原型：

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory prototype/dist
```

源码检查需要 Node.js 24.14.0：

```sh
node --check prototype/dist/workspace-ui.js
node --check prototype/dist/app.js
node --check prototype/dist/workbench.js
node --check prototype/dist/templates.js
```

Web 验证仍使用 `npm run typecheck --workspace @careerloom/web`、`npm run build --workspace @careerloom/web`、`npm run test --workspace @careerloom/web`。首次需按根 README 安装依赖。测试需要本机端口权限；沙箱曾因 listen EPERM 取消测试，允许后 10 项通过，不能把取消描述为成功。

排查时从可见症状出发：按钮无响应先核对 data 属性与事件名；统计错误先核对 mode 过滤和唯一状态；页面横向溢出先找最宽元素的父容器；材料变色先检查 --tpl-* 是否被全局规则覆盖；发布后还是旧界面先检查资源版本与发布源码 SHA，不清空用户资料。

## 7. 独立重建练习

在临时目录创建一个只含三条虚构任务的页面。先只渲染列表，再加入完成处理、数量统计、阶段过滤，最后加入两个响应式区域和空态。不要复制整份业务代码。

成功判据：完成任务后计数同步；从已完成区取消后恢复；刷新保留；切换阶段互不混入；320px 无整页溢出；纯键盘可以进入清单并连续完成任务。模拟存储写入失败时，应提示数据只留在当前页面，而不是仍声称已保存。

自测问题：为什么不保存 pending 数组？为什么重绘后需要恢复焦点？为什么自定义模板必须保留单独的变量？能解释这些问题，再开始扩展。

## 8. 扩展练习

给待办增加“只看今天”筛选，默认仍显示全部未完成事项。只增加视图状态，不改写任务日期，不删除其他日期的记录。

提示：先验证未设置日期、今天、过去日期和未来日期四种虚构样例，再计算过滤结果。空态应说明当前筛选没有事项，并提供恢复全部的入口。参考已有的模式过滤和 `dayKey()`；不要用 UTC 字符串截断来代替用户本地日期。

## 9. 发布、限制与后续

静态发布复用原 Sites 项目、域名和仅本人访问范围。只把 `prototype/dist/` 的 8 个静态文件同步到 Sites 的 `dist/`，通过原生源码工作流提交、推送并打包；不复制测试浏览器存储、截图、凭证或后端环境。

需要回滚时，重新部署原站点之前保存的版本；本机资料由浏览器保存，不能用删除存储作为回滚。此版本没有数据库迁移。线上发布的是交互原型，未接入真实 AI、支付、鉴权或云保存；角色切换不构成安全边界。

发布记录（2026-11-11）：

- Sites 返回 `succeeded`，网址：[Careerloom](https://qicheng-career-workbench.hlb424559864.chatgpt.site)，沿用仅本人可见的访问范围。
- Sites 源码提交：`57475915584d7c83195c6e2d6fa8f1d9c3c9ae2f`；发布项目 `appgprj_6aaa510f0b8c81919e050c2ae7c4218c`。
- 已发布版本 **v4**。保存版本 `appgprj_6aaa510f0b8c81919e050c2ae7c4218c~appgver_fc26089e17a08191b4abd02f8c7c920c`；部署 `appgdep_6af467c8ae008191ad32d38975a95dfe`。
- 包中 8 个静态文件与本仓库逐一 SHA-256 比较一致；通过 Sites 原生私有发布操作发布。源码打包时再次执行 4 项 JavaScript 语法检查。原生成功结果确认发布，不把本地预览当作线上结果。
- 发布完善后追加 10 页 × 3 宽度（1440/390/320）共 30 组检查，无整页溢出与捕获的脚本异常。

按用户已批准流程，本篇完成后对应 UI01 临时审阅文档从当前版本移除；T01a、T01b 的审阅文档和未批准状态继续保留。

后续维护：Q01 对本机存储和模板导入增加了保护，修改了部分原型文件；下表保留 UI01 获批基线，当前变更见 [Q01 审阅记录](../implementation-review/Q01-prototype-reliability.md)，不沿用 UI01 批准覆盖新行为。

## 10. 精确源码基线

```text
13402ff34929fac07a6d1542cfaaab415985f83fce45ddf2c0230037da31f8bf  prototype/dist/workspace-ui.js
65a007818dbb382ff3aba92d327e9d065c56abeb42908aaa93e34ee0ce7c0964  prototype/dist/workspace-ui.css
7544ba09e05064041a9199bccb32df6d652ab420599ac2644dd90788aca4b997  prototype/dist/app.js
a7b43a523704e1dbc9c65fe547f3760af94bf56091218ad7ce38dd857e933d88  prototype/dist/workbench.js
bdc719f50dd0d5d8f528d89d558603948ddbe4228acd2909047044a5045da457  prototype/dist/index.html
caaade1b4bb2a1614705da3285d15bc9e587cb630341e9126b37df1e96806bf9  prototype/dist/favicon.svg
677a9c74b01f1fc32a4839b6437118f96ea68859ec99af070d6254a6313f30f1  apps/web/app/page.tsx
fc46921fc71b969978eda675c43967fc27b6a2ffd875998350d6856640213093  apps/web/app/globals.css
```
