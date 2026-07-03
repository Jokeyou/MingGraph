# 🏯 MingGraph · 明朝人物事件交互图谱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Jokeyou/MingGraph/pulls)

> **像 Obsidian 图谱一样拖拽探索明朝三百年，像《明朝那些事儿》一样把故事讲活。**

一个面向历史爱好者的交互式知识图谱——拖一拖、点一点，你会发现**历史比小说更好看**。

---

## ✨ 特性

- 🌌 **星空主题力导向图** — 716 个节点可自由拖拽缩放，Canvas 动态星场 + SVG 节点光晕 + 连线流光粒子
- ⏳ **时间线联动** — 底部 1368-1644 时间轴，17 位皇帝分区，拖动即可筛选朝代
- 📖 **20 个故事卡片** — 参考《明朝那些事儿》风格，从朱元璋乞丐到崇祯煤山
- 🔍 **智能搜索** — 搜人物名自动聚焦 + 高亮关联网络，不切断连线
- 🎨 **四色节点编码** — 人物星光琥珀 / 事件金星 / 地点蓝星 / 机构绿星
- 📱 **零门槛上手** — 打开浏览器就能逛，无需注册登录

## 🎬 快速开始

```bash
git clone https://github.com/Jokeyou/MingGraph.git
cd MingGraph
npm install
npm run dev
# 打开 http://localhost:3456
```

## ⌨️ 操作指南

| 操作 | 效果 |
|------|------|
| 🖱️ 拖拽节点 | 自由移动，关联节点跟随 |
| 🔍 滚轮 | 缩放（6%~800%） |
| 👆 点击节点 | 展开详情面板 + 关联高亮 |
| 👆 双击节点 | 聚焦放大 |
| 🔍 搜索框 | 输入人名自动定位 |
| ⏳ 拖动时间轴 | 按朝代筛选图谱 |
| ⊞ 全景按钮 | 一键查看全图 |
| 📖 底部卡片 | 横向滚动，点击展开故事 |

## 🗺️ 数据来源

- [percent4/knowledge_graph_demo](https://github.com/percent4/knowledge_graph_demo) —《明朝那些事儿》三元组数据，清洗后 716 节点 + 754 关系
- CBDB（中国历代人物传记资料库）— 明代 21.8 万人物，v2 接入

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 14 + TypeScript |
| 图谱 | D3.js v7 forceSimulation |
| 状态 | Zustand |
| 样式 | Tailwind CSS |

## 🤝 一起开发！

这个项目还很早期，**非常欢迎贡献代码、数据、设计或想法**。

### 你可以参与的方向

| 方向 | 适合谁 | 做什么 |
|------|--------|--------|
| 🎨 **前端/交互** | React/D3.js 开发者 | 优化力导向图性能、移动端适配、动画细节 |
| 📊 **数据** | 历史爱好者 / 数据工程师 | 补充人物关系、标注更多故事卡片、接入 CBDB |
| 🎨 **视觉设计** | 设计师 | 星空主题深化、配色方案、UI 组件优化 |
| 📝 **内容** | 明史爱好者 | 写故事卡片、校对人物关系、标注史料来源 |
| 🔧 **工程** | 全栈工程师 | Neo4j 图数据库、ETL 管线、性能优化 |
| 📣 **传播** | 爱分享的人 | B站/小红书宣传、写使用教程、提 feature request |

### 贡献流程

```bash
# 1. Fork 本仓库
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交改动
git commit -m 'feat: add amazing feature'

# 4. 推送到你的 Fork
git push origin feature/amazing-feature

# 5. 提交 Pull Request
```

### 项目结构

```
src/
├── components/
│   ├── ForceGraph.tsx    # D3 力导向图核心
│   ├── Starfield.tsx     # Canvas 动态星空背景
│   ├── Timeline.tsx      # 底部时间线
│   ├── SearchBar.tsx     # 搜索 + 筛选
│   ├── NodeDetail.tsx    # 节点详情面板
│   └── StoryPanel.tsx    # 故事卡片
├── store/index.ts        # Zustand 状态管理
├── types/index.ts        # TypeScript 类型
└── lib/labels.ts         # 标签映射 + 皇帝数据
public/
├── data.json             # 图谱数据 (716节点+754边)
└── stories.json          # 20个故事卡片
```

## 📋 路线图

- [x] v1 基线 — 力导向图 + 时间线 + 20 故事卡片 + 星空主题
- [ ] v1.1 — 初始布局优化、移动端适配、更多故事内容
- [ ] v2 — 地图层（CHGIS）、AI 问答、CBDB 全量数据
- [ ] v3 — 多朝代扩展（三国/宋朝/唐朝）→ DynaGraph

## 📄 License

MIT © [Jokeyou](https://github.com/Jokeyou) — 欢迎随意使用、修改、分发。

---

**⭐ 如果觉得有意思，点个 Star 支持一下！**
