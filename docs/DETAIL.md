# Job Hunting Automation — Detail

DSH plugin that ships the `job-hunting` skill: profile-driven job applications and HR message replies on Boss Zhipin and Liepin, operated through your logged-in Ego Lite browser.

## How it works

- **Bundle shell**: registers a read-only bundled skills provider (`@deepseek-ai/dsh-skill-filesystem` with `includeDefaultRoots: false`). All behavior lives in `skills/job-hunting/SKILL.md` as instructions; no custom tools or host daemons are installed.
- **Profile (F1)**: an onboarding questionnaire collects education/salary/reason-for-leaving/greeting-style answers plus a red-line list. Stored in OpenViking when available, otherwise a local `job-profile.json`. The agent never invents facts outside the profile.
- **Reply decision tree (F3)**: invitations get a short reply + resume; questions covered by the profile are answered verbatim; anything else gets a holding phrase and is queued for you in `follow-ups.md`.
- **Scheduled patrol (F7/F11)**: "开启值守" creates DSH schedule reminders (weekday windows, per-round caps, random delays, no night runs). Schedules bind to the session that created them.
- **Site knowledge packs**: selectors, traps (e.g. Boss's zero-size hidden textarea), and success assertions live in `references/*.md` with a `verified_at` date. Broken selectors self-heal via snapshot exploration and are meant to be shared back via PR.

## Requirements

- Ego Lite running and the target platform logged in
- Optional: OpenViking memory plugin for cross-device profiles

## Disclaimer

Automation may violate platform terms of service. Built-in guardrails reduce risk but do not circumvent platform limits; users are responsible for their own accounts.
