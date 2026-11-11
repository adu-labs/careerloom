/**
 * 原型展示层：组织首次入口与「今天」，复用 app.js / workbench.js 的状态和事件委托。
 * 函数在业务脚本初始化后调用；这里只读取数据，不持久化、不请求网络、不自动录音。
 * 页面主题不进入简历的 --tpl-* 排版契约，避免界面改版改变用户导出的材料。
 */
function renderIntro() {
  document.title = 'Careerloom · 职业积累与求职工作台';
  const hints = { intern: '实习机会 · 项目经历 · 面试准备', campus: '校招投递 · 笔面试日程 · 定向简历', social: '职业经历 · 新的机会 · 面试复盘' };
  return `<main class="intro" id="main-content" tabindex="-1">
    <header class="intro-head">${brand()}<span class="prototype-label">交互原型 · 本机保存</span></header>
    <section class="intro-main" aria-labelledby="intro-title">
      <span class="intro-kicker">你的职业工作空间</span>
      <h1 id="intro-title">把下一步，安排清楚。</h1>
      <p class="lead">整理经历，跟进机会，练好每一次表达。<br>从你现在的阶段开始。</p>
      <div class="mode-grid">${Object.entries(modes).map(([key, value], index) => `
        <button type="button" class="mode-card" data-mode="${key}">
          <span class="mode-card-top"><span class="mode-icon">${I(value.icon)}</span><span class="mode-number" aria-hidden="true">0${index + 1}</span></span>
          <h2>${value.label}</h2><p>${value.desc}</p><span class="mode-hint">${hints[key]}</span>
          <span class="enter">进入工作台 <span>${I('arrow')}</span></span>
        </button>`).join('')}</div>
      <p class="entry-help">${I('check')} 之后可以随时切换阶段，已有材料会保留。</p>
    </section>
    <section class="intro-features" aria-label="工作台功能">
      ${[['file','你的经历，有序整理','编辑简历、保存版本，按机会选择要呈现的内容。'],['calendar','重要安排，放在一起','待办、投递和面试日程，随时知道下一步。'],['spark','每次准备，都有积累','文字练习、面试复盘，把经验留给下一次。']].map(([icon,title,desc])=>`<div>${I(icon)}<div><h3>${title}</h3><p>${desc}</p></div></div>`).join('')}
    </section>
    <footer class="intro-foot"><span>Careerloom · 职业积累与求职工作台</span><span>演示数据，仅保存在本机；AI 与交易为流程模拟。</span></footer>
  </main>`;
}

/** 保留原 data-todo / data-act 入口；用户文本必须转义，复选框始终有明确名称。 */
function dashboardTask(task) {
  return `<div class="task">
    <input type="checkbox" aria-label="完成 ${E(task.title)}" data-todo="${task.id}" ${task.done ? 'checked' : ''}>
    <div class="grow"><h3 class="${task.done ? 'completed' : ''}">${E(task.title)}</h3><p class="meta"><span>${E(task.category)}</span><span>${I('calendar')} ${E(task.date || '未设日期')}</span></p></div>
    ${act('todo-edit','编辑','text-btn',`data-id="${task.id}"`)}
  </div>`;
}

/**
 * 今天只展示本求职阶段的待办、投递与日程；简历库沿用跨阶段共享的既有规则。
 * 已完成项折叠展示，但可展开后取消完成；不删除数据或改变原有保存逻辑。
 */
function renderDashboard() {
  const todos = state.todos.filter(task => task.mode === mode);
  const pending = todos.filter(task => !task.done);
  const done = todos.filter(task => task.done);
  const applications = state.applications.filter(item => item.mode === mode && !['已结束', 'Offer'].includes(item.stage));
  const events = ownEvents().filter(event => event.status === '待参加');
  const resume = state.resumes.find(item => item.id === selectedResume) || state.resumes[0];
  const stats = [
    ['待办事项',pending.length,'today','check','逐项推进今天的安排'],
    ['进行中的投递',applications.length,'applications','bag','跟进每一个机会'],
    ['待参加面试',events.length,'practice','calendar','提前留出准备时间'],
    ['我的简历',state.resumes.length,'resumes','file','按不同方向整理']
  ];
  return `<div class="dashboard-heading">
      <div><p class="workspace-eyebrow">${E(modes[mode].plan)}</p><h1>今天，向前一步。</h1><p class="dashboard-subtitle">${pending.length ? `还有 <strong>${pending.length}</strong> 项待办，按你的节奏逐项推进。` : '今天的安排，由你来定。'}</p></div>
      ${act('todo-new',I('plus')+' 添加待办','btn primary')}
    </div>
    <div class="stats">${stats.map(([title,count,target,icon,hint], index)=>`<button class="card stat stat-${index}" ${index === 0 ? 'data-act="focus-tasks"' : `data-page="${target}"`}><span class="stat-top"><span>${title}</span><span class="stat-icon">${I(icon)}</span></span><strong>${count}</strong><span class="stat-bottom">${hint}${I('arrow')}</span></button>`).join('')}</div>
    <div class="dashboard-grid">
        <section class="card task-card" id="my-tasks" tabindex="-1" aria-labelledby="tasks-title">
          <div class="section-head"><div class="row"><h2 id="tasks-title">待办清单</h2><span class="section-count">${pending.length}</span></div>${act('todo-new',I('plus')+' 添加','text-btn')}</div>
          ${pending.length ? pending.map(dashboardTask).join('') : `<div class="task-empty"><span class="empty-symbol">${I('check')}</span><h3>${done.length ? '待办都处理好了' : '给今天留一个小目标'}</h3><p>${done.length ? '可以回顾已完成的事，或者安排下一步。' : '准备一场面试、修改一段经历，从一件小事开始。'}</p>${act('todo-new',done.length ? '添加新待办' : '添加第一项待办','btn sm')}</div>`}
          ${done.length ? `<details class="completed-tasks"><summary>已完成 <span>${done.length}</span></summary>${done.map(dashboardTask).join('')}</details>` : ''}
        </section>

      ${weekCalendar()}
        <section class="card recommendations" aria-labelledby="recommended-title">
          <div class="section-head"><h2 id="recommended-title">值得看看</h2><button class="text-btn" data-page="jobs">全部岗位 ${I('arrow')}</button></div>
          <div class="recommend-grid">${recommendedJobs().map(company=>`<button class="recommend-job" data-act="job" data-id="${company.id}"><div class="row">${logo(company)}<div class="grow"><h3>${E(company.job)}</h3><p class="meta">${E(company.name)} · ${E(company.city)}</p></div>${I('chevron')}</div><div class="recommend-bottom"><span>${E(company.salary)}</span><span>${E(company.skills)}</span></div></button>`).join('')}</div>
          <div class="recommend-caption"><span>根据方向与城市排序 · 演示推荐</span>${act('interest','调整偏好','text-btn')}</div>
        </section>
        <section class="card resume-shortcut"><div class="row"><span class="square-icon">${I('file')}</span><div><h3>简历工作区</h3><p class="meta">${resume ? `${resume.versions.length} 个版本 · 保存在本机` : '从整理经历开始'}</p></div></div><p>${resume ? E(resume.name) : '创建属于你的第一份简历'}</p><button class="text-btn" data-page="resumes">${resume ? '继续编辑' : '整理简历'} ${I('arrow')}</button></section>
    </div>
    <section class="quick-start" aria-label="快捷开始">
      <span>快捷开始</span><button data-page="resumes">${I('file')} 整理简历 ${I('arrow')}</button>${act('opportunity-new',I('bag')+' 记录机会 '+I('arrow'))}<button data-page="practice">${I('spark')} 面试练习 ${I('arrow')}</button>
    </section>`;
}
