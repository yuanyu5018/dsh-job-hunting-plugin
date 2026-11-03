// scan-unreplied.js — 打开平台消息页，输出会话列表快照供决策树分类。
// 用法: ego-browser nodejs < scan-unreplied.js   （或整段贴进 heredoc）
// ⚠️ 本脚本是骨架：ego-browser API 以 `ego-browser skill` 输出的当前版本文档为准。
const CONFIG = {
  spaceName: "job-hunting-patrol",       // 复用同一 TaskSpace；换任务改名
  chatUrl: "https://www.zhipin.com/web/geek/chat", // 猎聘走首页入口，见 references/liepin.md
};

const task = await taskSpace(CONFIG.spaceName);
console.log({ spaceId: task.spaceId });
const page = task.page("p1");
await page.goto(CONFIG.chatUrl, { timeout: 60000 });
await page.waitForTimeout(6000);
console.log({ url: await page.url(), title: await page.title() });

// 先看「未读」筛选
let snap = "";
try {
  await page.click('text="未读"', { label: "点击未读筛选" });
  await page.waitForTimeout(4000);
  snap = await page.snapshot();
  console.log("=== 未读 ===\n" + snap);
} catch (e) {
  console.log("unread tab failed:", e.message);
}

// 「暂无未读联系人」时切回「全部」，由调用方（agent）按最后发言方逐条判断待回复
if (/暂无未读/.test(snap)) {
  await page.click('text="全部"', { label: "切回全部会话" });
  await page.waitForTimeout(3000);
  console.log("=== 全部 ===\n" + (await page.snapshot()));
}
// 下一步：对判定为"对方最后发言"的会话，用其消息预览文本 text=<预览> 点开，
// 再执行 reply-and-send-resume.js 的流程。
