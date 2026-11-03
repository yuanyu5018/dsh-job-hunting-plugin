# 求职自动化 — 插件详情

随包发布 `job-hunting` skill：通过你已登录的 Ego Lite 浏览器，在 Boss直聘/猎聘上执行画像驱动的投递与 HR 消息回复。

## 工作方式

- **外壳极薄**：仅注册一个只读 bundled skills provider（`dsh-skill-filesystem`，关闭默认根扫描）。全部行为都在 `skills/job-hunting/SKILL.md` 的指令里，不注入自定义工具、不驻留宿主进程。
- **画像（F1）**：首次使用发起前置问卷——统招/学信网/期望薪资/离职原因/打招呼话术/红线话题清单。存 OpenViking（可用时）或本地 `job-profile.json`。画像之外的事实**绝不编造**。
- **回复决策树（F3）**：邀约 → 短回应+发简历；画像内问题 → 原文作答；其余 → 缓冲话术并记入 `follow-ups.md` 等你接管。
- **定时值守（F7/F11）**："开启值守"创建 DSH schedule 提醒（工作日时间窗、单轮限量、随机间隔、深夜不跑）。提醒绑定创建它的会话。
- **站点知识包**：选择器、陷阱（如 Boss 零尺寸隐藏 textarea）、成功判据在 `references/*.md`，带 `verified_at` 日期。失效时自我修复并欢迎 PR 回传。

## 前置条件

- Ego Lite 正在运行且目标平台已登录
- （可选）OpenViking memory plugin，用于画像跨设备同步

## 免责声明

自动化可能违反平台用户协议，封号风险由使用者自担；内置护栏用于降低风险而非规避平台限制。
