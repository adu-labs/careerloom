/**
 * 本机快照的读取边界。保留原数据键；无法解析或结构损坏时，展示恢复入口并锁住写入，
 * 避免一次自动保存用演示样例覆盖原始材料。这里不上传、不记录原始内容。
 */
const PROTOTYPE_STORAGE_KEY = 'qicheng-prototype-v1';
let storageRecovery = null;

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * 检查渲染必需的集合形状，不进行静默“修复”或丢弃记录。
 * 空简历库有效；后续版本新增的可选集合允许缺省，由既有 migrate() 补齐。
 * 此校验用于发现损坏快照，不替代正式业务模型验证或权限控制。
 */
function validStoredWorkspace(value) {
  if (!isRecord(value) || ![null, 'intern', 'campus', 'social'].includes(value.mode)) return false;
  const objects = ['resumes', 'applications', 'orders', 'reviews', 'partners'];
  const strings = ['favorites', 'tasksDone', 'purchases', 'invites'];
  if (objects.some(key => !Array.isArray(value[key]) || !value[key].every(isRecord))) return false;
  if (strings.some(key => !Array.isArray(value[key]) || !value[key].every(item => typeof item === 'string'))) return false;
  const optional = ['todos', 'opportunities', 'trashedResumes', 'posts', 'publicJobs', 'sessions', 'recruitmentApplications', 'talentRequests', 'events', 'privateTemplates'];
  if (optional.some(key => value[key] !== undefined && (!Array.isArray(value[key]) || !value[key].every(isRecord)))) return false;
  const validResume = resume => typeof resume.id === 'string'
    && Array.isArray(resume.experiences) && resume.experiences.every(isRecord)
    && Array.isArray(resume.versions) && resume.versions.every(version => isRecord(version)
      && isRecord(version.snapshot) && Array.isArray(version.snapshot.experiences)
      && version.snapshot.experiences.every(isRecord));
  if (![...value.resumes, ...(value.trashedResumes || [])].every(validResume)) return false;
  if (value.sessions?.some(session => !Array.isArray(session.questions) || !session.questions.every(isRecord)
    || !Array.isArray(session.answers) || !session.answers.every(answer => typeof answer === 'string'))) return false;
  if (value.interest !== undefined && (!isRecord(value.interest)
    || ['direction', 'cities', 'terms'].some(key => typeof value.interest[key] !== 'string'))) return false;
  return true;
}

/** 读取失败时保留原文；只有用户确认重置后，才允许用新状态覆盖存储。 */
function readStoredWorkspace(fallback) {
  let raw;
  try {
    raw = localStorage.getItem(PROTOTYPE_STORAGE_KEY);
  } catch {
    // 浏览器禁止存储时仍允许会话内使用；后续 persist() 会给出不能保存的提示。
    return clone(fallback);
  }
  if (raw === null) return clone(fallback);
  try {
    const parsed = JSON.parse(raw);
    if (!validStoredWorkspace(parsed)) throw new Error('Invalid workspace snapshot');
    return parsed;
  } catch {
    storageRecovery = { raw };
    return clone(fallback);
  }
}

/** 恢复页只解释情况，不把可能敏感或含 HTML 的存储原文插入页面。 */
function renderStorageRecovery() {
  document.title = '本机数据恢复 · Careerloom';
  return `<main class="intro" id="main-content" tabindex="-1">
    <header class="intro-head">${brand()}<span class="prototype-label">本机数据保护</span></header>
    <section class="intro-main"><h1>暂时无法读取本机材料</h1>
      <p class="lead">已保留原始数据，并暂停保存，避免覆盖你的材料。<br>建议先下载备份，再决定是否重置此浏览器中的演示。</p>
      <div class="row">${act('storage-export','下载原始数据备份','btn primary')}${act('reset','重置本机演示','btn')}</div>
      <p class="note" style="margin-top:24px">备份可能包含你的私人材料，请保存在自己信任的位置。此页面不会上传数据。</p>
    </section>
  </main>`;
}
