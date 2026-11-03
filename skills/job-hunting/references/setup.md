---
verified_at: 2026-11-03
---

# Ego Lite / ego-browser 安装与排查

本 skill 的所有页面操作依赖 [ego-lite](https://ego.app) 浏览器及其 `ego-browser` CLI。

## 安装（macOS）

```bash
curl -fsSL https://cdn.ego.app/setup/macos/install.sh | sh
```

或参考 ego-browser Skill 目录里的 `references/install-macos.md` / `install-windows.md`。

安装后 CLI 通常位于：

1. `~/.local/bin/ego-browser`（PATH 里优先）
2. App bundle 内 Helper：`~/.local/share/ego/active_version_dir/Helpers/ego-browser`
   （不同版本路径可能变化，用 `find "/Applications/ego lite.app" -name ego-browser` 兜底）

## 自检顺序

```bash
command -v ego-browser && ego-browser --version
```

失败时依次尝试上述两个路径；都找不到 → 引导用户安装。**不要**自行下载安装脚本并执行——只打印指引让用户决定。

## 常见连接问题

- `ego-browser nodejs` 报连不上浏览器 → 确认 Ego Lite **应用正在运行**（值守轮按 SKILL.md 护栏应安静退出）。
- 版本升级后 API 变化 → 重新跑 `ego-browser skill` 获取当前版本的使用指南；指南末尾有 `[ego-browser:skill] end of guide` 标记，缺失说明输出被截断，落盘分段读。
- 用户明确要求使用特定 profile 时才碰 profile 选择，否则一律用默认。
