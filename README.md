# TravelMind

TravelMind 是一个 AI 驱动的智能旅游规划助手，主打 Chat 驱动的行程编辑体验。用户可以通过自然语言对话生成、调整和保存旅行计划，并在同一页面中查看聊天、行程卡片和地图信息。

## 项目概览

- 前端：Next.js 14 App Router、Tailwind CSS、Zustand
- 后端：Express.js、Prisma、PostgreSQL
- AI：智谱 GLM-4，基于 LangChain 封装
- 地图：高德地图
- 核心页面：三栏式规划界面，包含聊天、行程时间线和地图标记

## 快速开始

```bash
# 前端
npm run dev

# 后端
cd server
npm run dev
```

运行前请根据本地环境配置前后端所需的 `.env` 文件，包括数据库、智谱 AI 和高德地图相关变量。

## 详细文档

完整的技术架构、目录说明、数据流、CLI 用法和开发约定请查看：

[AGENTS.md](./AGENTS.md)

更完整的产品规格请查看：

[spec.md](./spec.md)
