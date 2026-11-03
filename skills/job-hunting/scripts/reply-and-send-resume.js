// reply-and-send-resume.js — 对【已打开】的会话执行：简短回复 → 发简历 → 验证 → 留证。
// 前置：会话已在目标 Page 打开（scan 后用 text=<对方消息预览> 点开）。
// 铁律：只回一句短话术，不反问；画像外信息一律不发（改走 follow-ups 流程）。
// ⚠️ 骨架：API 以 `ego-browser skill` 当前版本文档为准；发送前幂等检查不可省略。
const CONFIG = {
  spaceName: "job-hunting-patrol",
  pageLabel: "p1",
  reply: "你好，这是我的简历",      // ← 从画像⑫注入，勿硬编码个人话术
  resumeFile: "<你的简历文件名>.pdf", // ← 从画像⑬注入
  sendResume: true,
  screenshotDir: "/absolute/path/workspace", // 脚本不继承 shell cwd，必须绝对路径
};

const task = await taskSpace(CONFIG.spaceName);
const page = task.page(CONFIG.pageLabel);

// 0. 幂等防重：最后一条消息已是自己发的同样内容 → 跳过（schedule 重放保护）
const lastOwn = await page.evaluate((t) => {
  const mine = [...document.querySelectorAll("p")].filter((n) => n.textContent.trim() === t);
  return mine.length > 0;
}, CONFIG.reply);
if (lastOwn) {
  console.log("SKIP: already replied in this conversation");
  process.exit ? null : null; // 骨架提示：实际可由 agent 控制流程
} else {
  // 1. Boss 真输入区是 div.chat-input[contenteditable]；零尺寸 textarea.input 是陷阱。
  //    猎聘可能是普通 textarea——先探测再选路。
  const isCE = await page.evaluate(() => !!document.querySelector("div.chat-input"));
  if (isCE) {
    await page.click("loc=css:div.chat-input", { label: "聚焦聊天输入框" });
    await page.waitForTimeout(300);
    await page.keyboard.insertText(CONFIG.reply);
    const typed = await page.evaluate(() => document.querySelector("div.chat-input")?.textContent.trim());
    if (typed !== CONFIG.reply) throw new Error(`TEXT MISMATCH, not sending: ${typed}`);
    await page.keyboard.press("Enter");
  } else {
    throw new Error("未找到 div.chat-input：请 snapshot 定位真实输入框后手动走 fill()+点发送");
  }

  // 2. 验证消息发出
  await page.waitForFunction(
    (t) => [...document.querySelectorAll("p")].some((n) => n.textContent.trim() === t),
    CONFIG.reply,
    { timeout: 8000 },
  );
  console.log("MSG SENT:", CONFIG.reply);

  // 3. 发简历三步流
  if (CONFIG.sendResume) {
    await page.waitForTimeout(1500);
    await page.click('text="发简历"', { label: "点击发简历" });
    await page.waitForTimeout(2500);
    await page.click(`text=${CONFIG.resumeFile}`, { label: "选择简历" });
    await page.waitForTimeout(800);
    await page.click('loc=css:button:text-is("发送") >> nth=-1', { label: "确认发送简历" });
    const ok = await page
      .waitForFunction(() => document.body.innerText.includes("附件简历请求已发送"), undefined, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    console.log("RESUME:", ok ? "SENT OK" : "NOT VERIFIED — 需 snapshot 复核，禁止重复点发送");
    if (!ok) console.log(await page.snapshot());
  }
}

// 4. 留证截图
const shot = await page.screenshot({ path: `${CONFIG.screenshotDir}/reply-${Date.now()}.png` });
console.log({ screenshot: shot });
