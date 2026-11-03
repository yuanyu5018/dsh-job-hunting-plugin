// send-greeting.js — 对【已打开】的岗位详情页发起沟通并发送招呼语（Boss/猎聘双站点骨架）。
// ⚠️ API 以 `ego-browser skill` 当前版本文档为准。
const CONFIG = {
  spaceName: "job-hunting-apply",
  pageTitle: "p1",                     // 猎聘详情常开在新 tab：先 task.tabs() 确认 label
  greeting: "你好",                    // ← 从画像⑪注入
  contactButton: 'text="立即沟通"',     // Boss直聘；猎聘改为 'text="继续聊"'
  closePopupText: null,                // Boss 可能先弹提示窗，需要时填关闭按钮 text
  sendResumeAfter: false,              // 打招呼后是否紧接着发简历
  resumeFile: "<你的简历文件名>.pdf",   // ← 从画像⑬注入
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

    // 4. 可选：发简历（同 reply-and-send-resume.js 三步流）
    if (CONFIG.sendResumeAfter) {
      await page.click('text="发简历"', { label: "点击发简历" });
      await page.waitForTimeout(2500);
      await page.click(`text=${CONFIG.resumeFile}`, { label: "选择简历" });
      await page.waitForTimeout(800);
      await page.click('loc=css:button:text-is("发送") >> nth=-1', { label: "确认发送简历" });
      console.log(await page
        .waitForFunction(() => document.body.innerText.includes("附件简历请求已发送"), undefined, { timeout: 8000 })
        .then(() => "RESUME SENT").catch(() => "RESUME NOT VERIFIED — snapshot 复核，勿重复点"));
    }
  }
}

// 5. 留证
const shot = await page.screenshot({ path: `${CONFIG.screenshotDir}/greet-${Date.now()}.png` });
console.log({ screenshot: shot });
