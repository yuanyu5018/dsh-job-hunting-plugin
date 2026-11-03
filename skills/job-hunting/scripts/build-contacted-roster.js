// build-contacted-roster.js — 【投递 loop 的第 0 步，不可跳过】
// 从平台消息中心批量提取已有会话的「公司 + HR称呼」，输出 JSON 名单。
// 后续 send-greeting 必须消费本名单：命中 → 跳过。拉取失败 → 本轮降级 dry-run。
// ⚠️ API 以 `ego-browser skill` 当前版本文档为准。
const CONFIG = {
  spaceName: "job-hunting-apply",
  pageLabel: "p1",
  platform: "boss",            // "boss" | "liepin"
  chatUrls: {
    boss: "https://www.zhipin.com/web/geek/chat",
    // 猎聘已实测：IM 域 d.liepin.com/chat 会重定向回首页；官方投递账本才是可靠名单源
    liepin: "https://c.liepin.com/job/record/apply",
  },
  workspaceDir: "/absolute/path/to/workspace", // applied 合并输出用，绝对路径
};

const task = await taskSpace(CONFIG.spaceName);
const page = task.page(CONFIG.pageLabel);

if (CONFIG.chatUrls[CONFIG.platform]) {
  await page.goto(CONFIG.chatUrls[CONFIG.platform], { timeout: 60000 });
} else {
  // 猎聘：先到首页找消息入口；找不到就报错触发降级
  await page.goto("https://www.liepin.com/", { timeout: 60000 });
  await page.waitForTimeout(4000);
  const opened = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href*="message"],a[href*="chat"],[class*="message"]')].find(x => x.offsetParent);
    if (a) { a.click(); return a.href || "clicked"; }
    return null;
  });
  if (!opened) throw new Error("ROSTER FAILED: 猎聘消息入口未定位到 → 按规则本轮必须降级 dry-run");
}
await page.waitForTimeout(5000);

// 滚动加载历史会话（虚拟列表只渲染可见项），直到连续两次快照不再增长或达到上限
let prevCount = -1, rounds = 0;
while (rounds < 8) {
  const grown = await page.evaluate(() => {
    const list = document.querySelector('[class*="chat-list"],[class*="conversation"],[class*="session"]') || document.scrollingElement;
    list.scrollTop = list.scrollHeight;
    return document.querySelectorAll('li,[class*="item"]').length;
  });
  await page.waitForTimeout(1500);
  if (grown === prevCount) break;
  prevCount = grown; rounds++;
}

// Boss 消息页与猎聘投递页的列表项都形如「岗位名【城市】薪资 要求… 公司名 行业规模 (HR称呼) 状态/时间」
const roster = await page.evaluate(() => {
  const items = [...document.querySelectorAll('li,[class*="conversation-item"],[class*="chat-item"]')]
    .map(el => el.innerText?.replace(/\s+/g, " ").trim())
    .filter(t => t && t.length > 4 && t.length < 300);
  const uniq = [...new Set(items)];
  return uniq.map(raw => {
    // 宽松抽取：前段常是 HR 称呼（X女士/X先生/X经理），公司名含「公司/集团/科技/有限」等字样
    const hr = (raw.match(/[\u4e00-\u9fa5]{1,4}(?:女士|先生|经理|主管|总监|老师)/) || [null])[0];
    const company = (raw.match(/[\u4e00-\u9fa5A-Za-z0-9()（）·]{2,20}?(?:公司|集团|科技|咨询|信息|网络|数据|智能|技术|企业)/)?.[0]) || null;
    return { raw, hr, company };
  });
});

if (!roster.length) throw new Error("ROSTER EMPTY: 名单为空但页面正常——可能选择器失效 → 降级 dry-run 并人工核对");

// 落盘 contacted-roster.json：apply-one.js 的闸1依赖此文件存在且非空
const fs = await import("node:fs/promises");
let prev = { companies: [], entries: [] };
try { prev = JSON.parse(await fs.readFile(`${CONFIG.workspaceDir}/contacted-roster.json`, "utf8")); } catch {}
const norm = (s) => String(s || "").replace(/[\s()（）·]/g, "");
const merged = [...prev.companies];
for (const r of roster) if (r.company && !merged.some(c => norm(c) === norm(r.company))) merged.push(r.company);
await fs.writeFile(`${CONFIG.workspaceDir}/contacted-roster.json`,
  JSON.stringify({ updated_at: new Date().toISOString(), companies: merged, entries: roster }, null, 1));
console.log(JSON.stringify({ count: roster.length, totalCompanies: merged.length }, null, 1));
// 同公司不同岗位同样视为已沟通；比对统一走 normalize 后的公司名。
