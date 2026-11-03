---
verified_at: 2026-11-03
platform: 猎聘 (liepin.com)
---

# 猎聘 操作知识包

来源：真实会话实测（2026-11-03）。选择器失效时按 SKILL.md 自我修复规程更新本文件并刷新 `verified_at`。

## 登录态自检

- 已登录时首页显示「你好，<姓氏>先生/女士」样式的问候。

## 搜索的坑（与 Boss 最大的差异）

- **搜索 URL 直达会被重定向回首页**：`https://www.liepin.com/s/?key=<词>&city=<市>` 打开后跳回 home，参数丢失。
- 正确做法：在**首页搜索框**输入关键词后回车：

```js
await page.fill("@<搜索框ref>", "智能体");
await page.keyboard.press("Enter");
await page.waitForTimeout(6000);
```

- **结果页和详情页依次开在新标签页**：回车后搜索结果出现在新 Page（如 p2）；点岗位后职位详情又开新 Page（如 p3）。
  每一步之后都要检查 tabs 并切换：

```js
const tabs = await task.tabs();
console.log(tabs.map(t => ({ label: t.label, url: t.url, active: t.active })));
const page = task.page("p2"); // 或 p3
```

## 城市筛选

- 默认结果是全国的，需要点城市 chip 里的目标城市。
- 裸 `text="广州"` 会匹配多处导致歧义报错；用精确 li 匹配：

```js
await page.click('loc=css:li:text-is("广州")', { label: "筛选广州城市" });
```

## 打招呼 / 投递入口

- 详情页按钮：**「继续聊」**（区别于 Boss 的「立即沟通」）。
- 点击后打开聊天窗口；猎聘聊天输入框通常就是普通 textarea，可直接 `fill()` + 点发送按钮
  （Boss 的 contenteditable 陷阱在这里不存在，但仍以当次 snapshot 为准）。
- **发送成功判据**：消息出现在聊天窗口且带时间戳；状态"未读"表示等待对方查看。
- 同样注意：发起沟通时系统自动附带默认话术，属正常。

## 通用建议

- 每步 `waitForTimeout(4000~6000)` 给 SPA 留渲染时间再 snapshot。
- 快照里优先使用 ref（@N）而非自造 CSS 选择器。
