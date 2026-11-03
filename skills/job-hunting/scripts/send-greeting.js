// ⛔ DEPRECATED — 本脚本已废弃，禁止执行。
// 废弃原因（v0.3.2 事故定论）：它包含"点击沟通入口后再手动发送招呼语"的流程，
// 而点击本身已触发平台自动应聘消息 → 手动补发必然造成二连发。
// 正确入口只有一个：scripts/apply-one.js（代码中不存在发送文本的路径）。
throw new Error("DEPRECATED: use apply-one.js — clicking the contact button IS the greeting; never send a second message");
