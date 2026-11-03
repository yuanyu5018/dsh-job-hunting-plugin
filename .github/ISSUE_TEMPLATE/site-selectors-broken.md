---
name: "站点选择器失效 / Site selectors broken"
description: "某个平台的页面结构变了，知识包需要更新"
labels: ["site-knowledge", "bug"]
body:
  - type: dropdown
    id: platform
    attributes:
      label: 平台
      options: [Boss直聘, 猎聘, 其他]
  - type: textarea
    id: symptom
    attributes:
      label: 现象
      description: 哪个操作失败？报错信息或卡住的步骤
      placeholder: 例如 Boss「发简历」按钮点击后无响应，snapshot 显示弹窗结构变化
    validations:
      required: true
  - type: textarea
    id: fix
    attributes:
      label: 你探索到的新选择器（可选）
      description: snapshot 片段 + 可用选择器；附实测截图更佳（欢迎直接提 PR）
  - type: input
    id: verified-date
    attributes:
      label: 验证日期
      placeholder: "YYYY-MM-DD"
