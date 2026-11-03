// apply-one.js — 【唯一允许的打招呼入口】单岗位发起沟通，内置双闸门。
// 用法：agent 每投一个岗位调用一次；CONFIG 由 agent 按当轮上下文填写。
// 闸1: contacted-roster.json 必须存在且非空（否则拒绝一切外发）
// 闸2: applied-jobs.json 里已有同一 jobId（或同公司）→ 跳过不发
// ⚠️ API 以 `ego-browser skill` 当前版本文档为准。
const CONFIG = {
  spaceName: "job-hunting-apply",
  pageLabel: "p3",                       // 岗位详情页所在 Page
  jobId: "<详情页URL中的数字ID>",          // 必填：如 https://www.liepin.com/job/1986114149.shtml → 1986114149
  jobName: "<岗位名，用于验证自动消息文案>", // 选填
  company: "<岗位所属公司名>",             // 必填：与 roster 比对用
  hr: "<HR称呼，如 罗女士>",               // 必填：汇报用
  contactButton: 'text="继续聊"',          // Boss 改 'text="立即沟通"'
  workspaceDir: "/absolute/path/to/workspace", // 绝对路径！脚本不继承 shell cwd
};

const fs = await import("node:fs/promises");
const rosterPath = `${CONFIG.workspaceDir}/contacted-roster.json`;
const appliedPath = `${CONFIG.workspaceDir}/applied-jobs.json`;

// ── 闸1：没有名单就没有外发 ───────────────────────────────
let roster;
try {
  roster = JSON.parse(await fs.readFile(rosterPath, "utf8"));
} catch {
  throw new Error("BLOCKED(闸1): contacted-roster.json 不存在/不可读 → 先跑 build-contacted-roster.js，禁止裸发");
}
if (!roster?.companies?.length) throw new Error("BLOCKED(闸1): 名单为空 → 本轮只允许 dry-run");

// ── 闸2：岗位 ID / 公司 已发起过 → 跳过 ───────────────────
let applied = { jobs: [] };
try { applied = JSON.parse(await fs.readFile(appliedPath, "utf8")); } catch {}
const norm = (s) => String(s || "").replace(/[\s()（）·]/g, "");
const dupJob = applied.jobs.find(j => String(j.jobId) === String(CONFIG.jobId));
const dupCompany = applied.jobs.find(j => norm(j.company) === norm(CONFIG.company))
  || roster.companies.find(c => norm(c) === norm(CONFIG.company));
if (dupJob) { console.log(`SKIP(闸2): jobId ${CONFIG.jobId} 本轮已发起过`); }
else if (dupCompany) { console.log(`SKIP(闸2): 公司「${CONFIG.company}」已在投递名单/applied 记录中`); }

if (!dupJob && !dupCompany) {
  const task = await taskSpace(CONFIG.spaceName);
  const page = task.page(CONFIG.pageLabel);

  // 进入沟通窗口——点击本身就是打招呼（平台自动发应聘消息），此后零输入
  await page.click(CONFIG.contactButton, { label: "发起沟通" });
  await page.waitForTimeout(4000);
  const snap = await page.snapshot();
  if (/已达到沟通上限|沟通上限/.test(snap)) throw new Error("LIMIT: 今日主动沟通达上限 → 停止整轮投递");

  // 验证自动消息已出现（聊天窗口内应有我方气泡含"应聘"或岗位名）；不发送任何新文本
  const autoSent = await page.evaluate((job) => {
    const mine = [...document.querySelectorAll('p,div[class*="msg"],div[class*="bubble"]')].map(n => n.textContent.trim());
    return mine.some(t => t.includes('应聘') || (job && t.includes(job)));
  }, CONFIG.jobName || "");
  console.log(autoSent
    ? "AUTO MESSAGE VERIFIED: 点击已构成打招呼，未追发任何文本"
    : "WARN: 未确认到自动消息 → snapshot 人工复核，**严禁手动补发**（补发=二连发事故源头）");

  // 记账（成功判据之后才写）
  applied.jobs.push({ jobId: CONFIG.jobId, company: CONFIG.company, hr: CONFIG.hr, at: new Date().toISOString() });
  await fs.writeFile(appliedPath, JSON.stringify(applied, null, 1));
  const shot = await page.screenshot({ path: `${CONFIG.workspaceDir}/applied-${CONFIG.jobId}.png` });
  console.log({ DONE: true, job: CONFIG.jobId, company: CONFIG.company, screenshot: shot });
}
