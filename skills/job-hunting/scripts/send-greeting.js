// send-greeting.js — 对【已打开】的岗位详情页发起沟通并发送招呼语（Boss/猎聘双站点骨架）。
// ⚠️ API 以 `ego-browser skill` 当前版本文档为准。
// ⚠️ 铁律2：本脚本只发招呼语，不在此处发简历——简历由对方积极回应后走 reply-and-send-resume.js。
const CONFIG = {
  spaceName: "job-hunting-apply",
  pageTitle: "p1",                     // 猎聘详情常开在新 tab：先 task.tabs() 确认 label
  greeting: "你好",                    // ← 从画像⑪注入
  contactButton: 'text="立即沟通"',     // Boss直聘；猎聘改为 'text="继续聊"'
  closePopupText: null,                // Boss 可能先弹提示窗，需要时填关闭按钮 text
  screenshotDir: "/absolute/path/workspace",
};

const task = await taskSpace(CONFIG.spaceName);
const page = task.page(CONFIG.pageTitle);

// 0. 有关闭按钮配置的遮罩弹窗先关掉
if (CONFIG.closePopupText) {
  await page.click(CONFIG.closePopupText, { label: "关闭提示弹窗" }).catch(() => {});
  await page.waitForTimeout(1500);
}

// 1. 点沟通入口，并检测限额弹窗
await page.click(CONFIG.contactButton, { label: "发起沟通" });
await page.waitForTimeout(4000);
const snap1 = await page.snapshot();
if (/已达到沟通上限|沟通上限/.test(snap1)) {
  console.log("LIMIT REACHED: 今日主动沟通已达上限 → 停止全部投递，告知用户（换岗位无效）。");
  process.exitCode = 2;
} else {
  // 2. 找输入框：优先 contenteditable（Boss），否则要求人工 snapshot 定位（猎聘）
  const isCE = await page.evaluate(() => !!document.querySelector("div.chat-input"));
  if (isCE) {
    await page.click("loc=css:div.chat-input", { label: "聚焦输入框" });
    await page.keyboard.insertText(CONFIG.greeting);
    await page.keyboard.press("Enter");
  } else {
    console.log("未探测到 div.chat-input。请 snapshot 找到聊天输入框 ref：fill(ref, greeting) + 点发送按钮。");
    console.log(snap1.slice(0, 3000));
  }
  if (isCE) {
    // 3. 验证
    await page.waitForFunction(
      (t) => [...document.querySelectorAll("p")].some((n) => n.textContent.trim() === t),
      CONFIG.greeting,
      { timeout: 8000 },
    );
    console.log("GREETING SENT:", CONFIG.greeting);
    // 到此为止。发简历 = 对方积极回应后由 reply-and-send-resume.js 处理（SKILL.md 铁律2）。
  }
}

// 5. 留证
const shot = await page.screenshot({ path: `${CONFIG.screenshotDir}/greet-${Date.now()}.png` });
console.log({ screenshot: shot });
