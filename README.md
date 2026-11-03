# dsh-job-hunting-plugin

> ⚠️ **免责声明（请先阅读）**
> 本项目是个人效率工具，通过操作**你自己已登录**的浏览器会话来辅助求职沟通。自动化投递可能违反 Boss直聘、猎聘等平台的用户协议，**账号风控与封号风险由使用者自行承担**。项目内置了限额感知、频控、深夜停跑等护栏（见下），但护栏用于降低风险，不用于规避平台限制；请勿将其用于批量轰炸、刷量等滥用场景。

DeepSeek Harness（DSH）求职自动化插件：让 agent 在你的 [Ego Lite](https://ego.app) 浏览器里**代你投简历、打招呼、按你教的规矩回复 HR**。

## 它做什么

- **F1 前置问卷**：首次使用时一次性收集你的画像——统招/学信网/期望薪资/离职原因/打招呼话术/红线话题……存进 OpenViking（或本地文件），之后所有对外回复都由画像驱动，**绝不编造你没说过的信息**。
- **F2 主动投递**：搜索岗位 → 匹配预检（学历/英语/薪资硬冲突自动跳过并列出原因）→ 打招呼 → 发简历。Boss 日限 150 触顶即停。
- **F3 未读回复决策树**：邀约 → "你好，这是我的简历" + 发简历（不反问）；画像内问题 → 原文作答；画像外 → 缓冲话术 + 记入待补充清单等你接管。
- **F7 定时值守**："开启值守"一句话建立工作日 4 个时间窗的自动巡检；单轮限量、随机间隔、深夜不跑。
- **站点知识包**：Boss直聘 / 猎聘的选择器、陷阱、成功判据各自独立成文档，**欢迎为更多平台贡献知识包**。

## 前置条件

1. [DeepSeek Harness](https://github.com/deepseek-ai)（`dsh web` 或 Desktop）
2. [Ego Lite 浏览器](https://ego.app) 已安装并运行，且目标招聘平台**已登录**
3. （可选）OpenViking memory plugin——装了则画像跨设备同步，不装则自动降级为本机文件存储

## 安装

```bash
dsh plugin --profile web add @dsh-community/dsh-job-hunting-plugin
```

或在 Desktop：**Plugins → Add plugin → 输入包名 → Install**，然后打开开关。

## 使用

开一个新会话，直接说：

```
帮我投简历
```

agent 会先跑启动自检（Ego Lite、登录态），没有画像时发起 F1 问卷。之后：

| 你说 | 它做 |
|---|---|
| "搜广州的智能体岗位，投 10 个" | F2 投递 loop，输出结果表格 |
| "看看有没有新消息，按我的规矩回" | F3 扫描未读 + 决策树回复 |
| "开启值守" / "暂停值守" | F11 建立/清理 schedule 提醒 |
| "把我的期望薪资改成 25-35k" | 更新画像对应字段 |

## 已知限制

- agent 是回合制的：值守依赖 DSH 会话内的定时提醒，会话删除需重新"上岗"；Ego Lite 未运行时该轮自动跳过。
- 招聘网站改版会使选择器失效：skill 内置自我修复规程（探索→回写知识包），也欢迎提 PR（模板要求附实测截图）。
- `minimal` agent preset 无 skill 工具，看不到本技能。

## 开发

```bash
git clone https://github.com/<your-org>/dsh-job-hunting-plugin
cd dsh-job-hunting-plugin
npm run check          # 结构校验 + PII 扫描 + node --check
```

规则内容全部在 `skills/job-hunting/`（SKILL.md + references/ + scripts/）；外层只是 DSH bundle 挂载壳。调试期可直接把该目录拷到 `~/.dsh/skills/` 热加载迭代。

## License

Apache-2.0
