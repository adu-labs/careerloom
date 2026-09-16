# Careerloom

Turn everyday work into your next career chapter.

**Publicly viewable · Proprietary · All rights reserved.** 公开可查看，不授予开源使用权。参见 [LICENSE](LICENSE)。

Careerloom 是面向职业积累与求职的 AI 工作台：记录工作与学习、整理有依据的成果、生成和管理简历、跟踪机会与投递、准备面试并持续复盘。

当前优先服务中国互联网／技术类实习、校招与社招，后续扩展海外求职与完整英语体验。

## 当前状态

本仓库保存产品研究、技术方案、实施规划和可交互原型。正式服务尚未实现；原型中的身份、交易和部分 AI 功能是演示，不代表生产能力。

Careerloom 为已确定的项目名。历史文档和原型中的“启程 / Qicheng”属于早期名称，暂保留以便追溯。项目归属 `adu-labs`。开发阶段仓库公开，计划在准备正式上线时重新设为私有；公开期间的已有克隆或分叉无法通过修改可见性收回。

## 文档入口

- [产品研究与功能设计](docs/design/找工作工作台-产品研究与功能设计.md)
- [技术实现方案](docs/design/找工作工作台-技术实现方案.md)
- [工作记录与 Agent 工作台](docs/design/工作记录与Agent工作台-产品架构与持续优化.md)
- [浏览器扩展研究](docs/design/浏览器扩展-竞品研究与实现补充.md)
- [实施规划](tasks/plan.md)
- [主体任务](tasks/todo.md)、[扩展任务](tasks/extension.md)、[Agent 工作台任务](tasks/agent-workspace.md)
- [架构决策](docs/decisions/)

## 原型预览

`prototype/dist/` 是当前原型的直接维护文件，纳入版本控制。以下本地预览命令供权利人及取得相应授权的维护者使用；列出命令本身不授予运行或部署许可：

```sh
python3 -m http.server 8080 --directory prototype/dist
```

打开 http://localhost:8080 。原型主要使用浏览器本地数据，详见[原型说明](prototype/README.md)。已有 Sites 部署仍使用其原名称，本次建立仓库不重新部署网站。

## 工程约定

生产实现按规划逐步建立 `apps/`、`packages/`、`workers/` 和 `quality/`。共用 Agent 能力先在简历与面试复盘两个场景验证，再决定是否独立拆仓。

不要提交密钥、真实求职资料、运行缓存或本机部署配置。本项目采用 [Careerloom 专有条款](LICENSE)，不授予通用复制、改作、再分发、运行部署、商用或模型训练许可；GitHub 平台权利、法定例外及另行授权除外。第三方材料与依赖按各自许可证和使用范围管理。

许可申请可通过 [adu-works](https://github.com/adu-works) 或仓库 issue 联系维护者；请勿在公开 issue 中提供机密资料。外部贡献规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。
