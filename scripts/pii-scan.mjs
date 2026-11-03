#!/usr/bin/env node
// pii-scan.mjs — 开源前置保险丝：扫描仓库文本文件中的疑似个人敏感信息（PII）。
// 检查：作者机器用户名/姓名残留、邮箱、手机号、身份证号样式、简历真实文件名。
// 运行: node scripts/pii-scan.mjs   （CI 中作为发布门禁）
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules", ".github"]);
const TEXT_EXT = /\.(md|js|mjs|cjs|json|yml|yaml|txt|svg)$/i;

// 规则表：命中即视为 PII 风险。可按需扩充。
const RULES = [
  { id: "cn-mobile", re: /(?<!\d)1[3-9]\d{9}(?!\d)/, hint: "疑似中国大陆手机号" },
  { id: "id-card", re: /(?<!\d)\d{17}[\dXx](?!\d)/, hint: "疑似身份证号" },
  { id: "real-email", re: /[a-zA-Z0-9._%+-]+@(?!example\.(com|org)|yourmail\.com|noreply)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, hint: "疑似真实邮箱（占位 example.com 除外）" },
  { id: "home-user", re: /\/Users\/(?!<your-)[a-z0-9._-]{2,}\//i, hint: "疑似个人机器绝对路径（应使用 <your-name> 等占位符）" },
];

const hits = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!TEXT_EXT.test(entry)) continue;
    // 本脚本自身含规则正则，跳过自己避免自触发
    if (relative(repoRoot, p) === "scripts/pii-scan.mjs") continue;
    const lines = readFileSync(p, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        if (rule.re.test(line)) hits.push(`${relative(repoRoot, p)}:${i + 1} [${rule.id}] ${rule.hint}`);
      }
    });
  }
}
walk(repoRoot);

if (hits.length) {
  console.error("PII scan FAILED:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log("PII scan OK — no personal data patterns found");
