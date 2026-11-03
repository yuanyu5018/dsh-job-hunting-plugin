import { fileURLToPath } from "node:url";
import * as skillFilesystem from "@deepseek-ai/dsh-skill-filesystem";

/**
 * dsh-job-hunting-plugin — 求职自动化 bundle。
 *
 * 本插件是"外壳"：规则内容全部在 skills/job-hunting/ 里（SKILL.md + references/
 * + scripts/）。挂载方式与 @openviking/dsh-memory-plugin 相同：向 ctx.skills 注册
 * 一个只读 bundled 目录的 filesystem provider，不扫描项目/用户根，避免重复目录。
 */

export const name = "job-hunting-skills";
export const inject = ["skills"];

/** Provider 名，不能与 DSH 自带的 "filesystem" 或 memory plugin 的 "openviking" 冲突。 */
export const SKILL_PROVIDER_NAME = "job-hunting";

/** 随包发布的技能目录。 */
export const SKILLS_DIR = fileURLToPath(new URL("./skills", import.meta.url));

export function buildSkillsConfig() {
  return {
    providerName: SKILL_PROVIDER_NAME,
    includeDefaultRoots: false,
    bundledSkillDir: SKILLS_DIR,
    // 打包技能只在升级时变化；关 watcher 以免 Windows 上占用文件阻碍替换。
    watch: false,
  };
}

export function apply(ctx, config = {}) {
  // 允许用户在 cordis.patch.yml 里按 id `job-hunting-skills` 覆盖 config（如禁用 watch 之外的项）。
  return ctx.plugin(skillFilesystem, { ...buildSkillsConfig(), ...config });
}
