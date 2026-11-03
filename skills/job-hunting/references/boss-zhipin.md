---
verified_at: 2026-11-03
platform: Boss直聘 (zhipin.com)
---

# Boss直聘 操作知识包

来源：真实会话实测（2026-11-03）。选择器失效时按 SKILL.md 自我修复规程更新本文件并刷新 `verified_at`。

## 关键 URL

- 首页：`https://www.zhipin.com/`（已登录时右上角显示用户昵称，用于登录态自检）
- 岗位搜索（geek 端）：`https://www.zhipin.com/web/geek/job?query=<关键词URL编码>&city=<城市码>`
- 消息/聊天页：`https://www.zhipin.com/web/geek/chat`

常用城市码（补充其他城市欢迎 PR）：

| 城市 | city code |
|---|---|
| 广州 | `101280100` |
| 北京 | `101010100` |
| 上海 | `101020100` |
| 深圳 | `101280600` |
| 杭州 | `101210100` |

## 筛选条件落地（F2 第 2 步用）

Boss直聘搜索页左侧/顶部有筛选栏，对应画像项的操作路径：

- **活跃度**：搜索结果筛选区「活跃 HR」或岗位卡片上的 HR 头像旁标签（如"刚刚在线""今日活跃""3日内活跃""7日内活跃""一个月内活跃"）。
  - 优先用筛选器点选下限档位；无筛选器时逐条读卡片标签，低于画像⑯档位的跳过。
  - 卡片文本示例定位：`text="今日活跃"` 等；具体容器以 snapshot 为准。
- **公司规模**：筛选区「公司规模」选项——`20人以下 / 20-99人 / 100-499人 / 500-999人 / 1000-9999人 / 10000人以上`。
  画像⑰是人数下限语义（如"100人以上"）时勾选覆盖该下限的所有档位组合。
- **其他条件**（行业/融资阶段/双休等画像⑱自由文本）：筛选区同名控件。

## 「已沟通识别」（硬性排除：只投未沟通过的）

- **主判据**：岗位卡片的沟通按钮文案。未发起过 → 「立即沟通」；**已发起过 → 按钮变为「继续聊」「已投递」或类似状态词**。见到非初始态文案直接跳过。
- 列表页 `page.evaluate()` 批量提取每张卡片的按钮文案 + 岗位标题 + 公司名，先过滤再逐个点开，省 tab 开销。
- **兜底核对（必做）**：猎聘的"继续聊"实测是常驻按钮不可靠，Boss 同理可能被改版击穿——投递 loop 开始前先进消息页 `/web/geek/chat` 批量提取已有会话的公司+HR 名单，候选命中名单一律跳过。**按钮判据与名单兜底取并集：任一命中即视为已沟通**。
- 同公司不同岗位默认也算已沟通（同一 HR 收件箱）；用户明说"按岗位区分"才放宽。
- 拿不准（按钮文案不认识、名单拉取失败）→ 不投，记入"待人工确认"清单；名单整体失败则本轮降级 dry-run。**宁可漏投，不可重发**。

## 平台限制

- **每天主动沟通上限 ≈ 150**。触发后弹「您已达到沟通上限——您今天已与 N 位 BOSS 沟通，休息一下，明天再来吧～」。
  此时任何岗位都发不出去：**立即停止全部投递动作**并告知用户，换岗位重试无效且危险。
- 点「立即沟通」可能先弹提示窗（福利/引导弹窗），先关掉再操作。

## 聊天输入框陷阱（最重要）

- 页面里存在一个**零尺寸的 `textarea.input`**——隐藏组件，`fill()` 它没有任何效果。
- 真正的输入区是 **`div.chat-input[contenteditable="true"]`**。
- contenteditable 的写法：`click` 聚焦 → `keyboard.insertText()` → 校验 DOM 文本 → `Enter` 发送：

```js
await page.click("loc=css:div.chat-input", { label: "聚焦聊天输入框" });
await page.waitForTimeout(300);
await page.keyboard.insertText(reply);
// 发送前必须校验文本已进入编辑器，防止错发/空发
const typed = await page.evaluate(() => document.querySelector('div.chat-input')?.textContent.trim());
if (typed === reply) await page.keyboard.press("Enter");
else throw new Error(`TEXT MISMATCH: ${typed}`);
```

- **发送成功判据**：消息列表出现该文本——

```js
await page.waitForFunction(
  (t) => [...document.querySelectorAll('p')].some(n => n.textContent.trim() === t),
  reply, { timeout: 8000 },
);
```

## 会话列表与打开会话

- 筛选 tab：`text="未读"` / `text="全部"`（点击切换）。
- 「未读」为空且显示"30 天内暂无未读联系人"→ 说明都点开过但未必回复；切「全部」，按每条会话**最后发言方**判断待回复。
- 打开某条会话最稳的方式：用对方消息预览文本点击，如
  `page.click("text=<对方消息片段>", { label: "打开会话" })`。
  `.conversation-item` 等 CSS 类名不可靠（SPA 混淆类名会变）。
- 列表不刷新时：`page.reload()` + `waitForTimeout(6000)` 再 snapshot。

## 发简历流程（三步）

1. `page.click('text="发简历"', ...)` — 弹出简历选择面板。
2. `page.click("text=<简历文件名>", ...)` — 选中目标 PDF（画像默认项；多候选取最新）。
3. `page.click('loc=css:button:text-is("发送") >> nth=-1', ...)` — 点面板里的发送按钮。
   **`nth=-1`（最后一个）是关键**：页面上有多个"发送"按钮，输入区旁的那个不是目标。
4. **成功判据**：页面出现 **「附件简历请求已发送」**：

```js
await page.waitForFunction(() => document.body.innerText.includes('附件简历请求已发送'), undefined, { timeout: 8000 });
```

5. 未见判据 → snapshot 复核状态；仍不确定就报告用户，**不要重复点发送**。

## 打招呼入口

- 岗位详情页按钮：**「立即沟通」**。
- 注意：发起沟通时系统可能自动附带一条默认话术（平台预设招呼语），属正常现象，不要再补发同义内容。

## 快照技巧

- 列表页 ref（@91、@137 这类）只在当前页面状态有效；页面变化（切 tab、开弹窗）后重新 snapshot。
- SPA 渲染慢：导航/点击后留 4–6s 再 snapshot。
