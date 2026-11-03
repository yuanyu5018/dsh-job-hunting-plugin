#!/usr/bin/env node
// validate-skill.mjs — 校验 skills/ 下的 bundle 结构：frontmatter 必备字段、引用文件存在。
// 运行: node scripts/validate-skill.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const errors = [];
let checked = 0;

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return data;
}

for (const name of readdirSync(root)) {
  const dir = join(root, name);
  if (!statSync(dir).isDirectory()) continue;
  checked++;
  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(skillPath)) { errors.push(`${name}: missing SKILL.md`); continue; }
  const text = readFileSync(skillPath, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm) { errors.push(`${name}: SKILL.md lacks YAML frontmatter`); continue; }
  if (!fm.name) errors.push(`${name}: frontmatter missing 'name'`);
  if (!fm.description) errors.push(`${name}: frontmatter missing 'description'`);
  if (fm.name && !/^[A-Za-z0-9_-]{1,64}$/.test(fm.name)) errors.push(`${name}: invalid name '${fm.name}'`);
  // 链接引用的本地文件必须存在
  const linkRe = /\]\(([^)#?]+\.(?:md|js|json))\)/g;
  let lm;
  while ((lm = linkRe.exec(text))) {
    const rel = lm[1];
    if (/^https?:/.test(rel)) continue;
    if (!existsSync(join(dir, rel))) errors.push(`${name}: broken link ${rel}`);
  }
  // references 知识包要求带 verified_at
  const refDir = join(dir, "references");
  if (existsSync(refDir)) {
    for (const f of readdirSync(refDir).filter((x) => x.endsWith(".md"))) {
      const rt = readFileSync(join(refDir, f), "utf8");
      if (!/verified_at\s*:/.test(rt.slice(0, 500))) errors.push(`${name}: references/${f} missing verified_at`);
    }
  }
}

if (errors.length) {
  console.error("skill validation FAILED:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`skill validation OK (${checked} skill(s))`);
