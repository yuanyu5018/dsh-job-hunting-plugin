// apply-one.js — 【唯一允许的打招呼入口】单岗位发起沟通，内置双闸门。
// 用法：agent 每投一个岗位调用一次；CONFIG 由 agent 按当轮上下文填写。
// 闸1: contacted-roster.json 必须存在且非空（否则拒绝一切外发）
// 闸2: applied-jobs.json 里已有同一 jobId（或同公司）→ 跳过不发
// ⚠️ API 以 `ego-browser skill` 当前版本文档为准。
const CONFIG = {
  spaceName: "job-hunting-apply",
  pageLabel: "p3",                       // 岗位详情页所在 Page
  jobId: "<详情页URL中的数字ID>",          // 必填：如 https://www.liepin.com/job/1986114149.shtml → 1986114149
  company: "<岗位所属公司名>",             // 必填：与 roster 比对用
  hr: "<HR称呼，如 罗女士>",               // 必填：汇报用
  greeting: null,                        // 仅 Boss直聘需要手输招呼语时填（画像⑫）；猎聘留 null——点「继续聊」后自动话术即完整招呼，禁止再补任何文本
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

  // 进入沟通窗口
  await page.click(CONFIG.contactButton, { label: "发起沟通" });
  await page.waitForTimeout(4000);
  const snap = await page.snapshot();
  if (/已达到沟通上限|沟通上限/.test(snap)) throw new Error("LIMIT: 今日主动沟通达上限 → 停止整轮投递");

  // 仅显式给了 greeting 才手动输入；否则信任平台自动话术即为完整招呼（铁律：绝不追加第二句）
  if (CONFIG.greeting) {
    const isCE = await page.evaluate(() => !!document.querySelector("div.chat-input"));
    if (isCE) {
      await page.click("loc=css:div.chat-input", { label: "聚焦输入框" });
      await page.keyboard.insertText(CONFIG.greeting);
      await page.keyboard.press("Enter");
    } else {
      console.log("WARN: 未找到 div.chat-input，且不确认其他输入方式 → 不冒险发送，人工处理");
    }
    await page.waitForFunction((t) => [...document.querySelectorAll("p")].some(n => n.textContent.trim() === t), CONFIG.greeting, { timeout: 8000 })
      .then(() => console.log("GREETING SENT"))
      .catch(() => console.log("VERIFY FAILED: snapshot 复核，勿重试点击"));
  } else {
    console.log("AUTO PRESET ONLY: 依赖平台自动话术，未追发任何文本");
  }

  // 记账（成功判据之后才写）
  applied.jobs.push({ jobId: CONFIG.jobId, company: CONFIG.company, hr: CONFIG.hr, at: new Date().toISOString() });
  await fs.writeFile(appliedPath, JSON.stringify(applied, null, 1));
  const shot = await page.screenshot({ path: `${CONFIG.workspaceDir}/applied-${CONFIG.jobId}.png` });
  console.log({ DONE: true, job: CONFIG.jobId, company: CONFIG.company, screenshot: shot });
}
