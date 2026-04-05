# TravelMind — 智能旅游规划助手

完整产品规格见 `spec.md`。

## 项目简介

AI 驱动的旅游规划平台，核心特性是 **Chat 驱动的行程编辑器**——用户通过自然语言对话，AI 实时生成和修改行程，三栏同屏展示聊天、行程卡片和地图。

技术栈：Next.js 14 (App Router) + Express.js + Prisma + 智谱 GLM-4 (LangChain) + 高德地图 + Zustand。

## 架构概要

### 两套模式并存

| 模式 | 路由 | 说明 |
|------|------|------|
| 经典模式 | `/` 聊天 → `/itinerary/[id]` 详情 | 聊天与行程分离，聊天生成行程后跳转独立页面查看 |
| **规划模式** | `/plan/[id]` | 三栏并排（聊天 25% + 行程卡片 40% + 地图 35%），AI 通过 tool_call 直接操控行程 |

规划模式是主力功能。经典模式保留兼容。

### 核心数据流（规划模式）

```
用户输入 → ChatPanel
              ↓ sendPlanStreamMessage()
        POST /api/agent/plan/stream
              ↓
        PlanAgent (LLM + <tool_call> 解析)
              ↓ 执行 tool → 更新内存行程
        SSE 返回: text chunks + itinerary_snapshot
              ↓
        ChatPanel.onAction() → Zustand applySnapshot()
              ↓ 共享 Store
    ItineraryPanel (卡片渲染)  +  MapPanel (地图标记)
```

每轮对话前端把当前行程压缩为文本摘要注入 system prompt，让 AI 知道"现在行程长什么样"。

## 目录结构

```
src/
├── app/
│   ├── page.tsx                    # 首页（经典聊天 + 规划入口）
│   ├── plan/[id]/page.tsx          # 三栏规划页面（核心）
│   ├── itinerary/[id]/page.tsx     # 经典行程详情页（5 Tab）
│   └── profile/preferences/        # 偏好设置
├── stores/
│   ├── itinerary-store.ts          # Zustand 行程 Store（三栏共享状态）
│   └── chat-store.ts              # Zustand 聊天 Store
├── components/
│   ├── plan/                       # 规划模式组件
│   │   ├── ChatPanel.tsx           # 左栏聊天（构建上下文 + SSE 流处理）
│   │   ├── ItineraryPanel.tsx      # 中栏行程（日期 Tab + 卡片时间线）
│   │   ├── MapPanel.tsx            # 右栏地图（从 Store 读取标记）
│   │   ├── ActivityCard.tsx        # 景点卡片（评分/时间/费用/操作按钮）
│   │   ├── TransportCard.tsx       # 交通卡片（步行/公交/火车/飞机等）
│   │   ├── AccommodationCard.tsx   # 住宿卡片
│   │   └── DayTimeline.tsx         # 日时间线（组合上述卡片）
│   ├── chat/                       # 经典聊天组件（ChatWindow 等）
│   ├── itinerary/                  # 经典行程详情组件
│   ├── map/                        # 地图组件（AMapProvider / MapView / Marker）
│   ├── flight/                     # 航班组件
│   ├── hotel/                      # 酒店组件
│   └── ui/                         # 基础 UI（Button / Navbar）
├── lib/api/
│   ├── chat.ts                     # 聊天 API（含 sendPlanStreamMessage）
│   ├── itinerary.ts                # 行程 CRUD API
│   └── ...                         # flight / hotel / preference
└── types/                          # TypeScript 类型定义

server/
├── src/
│   ├── agent/
│   │   ├── plan-agent.ts           # 统一 PlanAgent（LLM + tool_call 解析 + 行程操作）
│   │   ├── tools.ts                # 8 个工具定义（generate/add/remove/replace/modify/transport/accommodation/reorder）
│   │   ├── index.ts                # 经典 TravelAgent（纯聊天）
│   │   ├── itinerary-agent.ts      # ItineraryAgent（行程生成，被 PlanAgent 内部调用）
│   │   ├── llm.ts                  # 智谱 ChatZhipuAI 模型配置
│   │   ├── intent.ts               # 意图识别（经典模式用）
│   │   └── prompts/                # System Prompt 模板
│   ├── routes/
│   │   ├── agent.routes.ts         # POST /chat, /chat/stream, /intent, /plan/stream
│   │   └── ...                     # itinerary / weather / attractions 等 REST 路由
│   ├── controllers/                # 控制器层
│   ├── lib/api/                    # 外部 API 封装（高德 / 天气 / 航班 / 酒店）
│   ├── lib/utils/                  # 工具函数（time / budget / distance）
│   └── types/                      # 后端类型定义
└── prisma/                         # 数据库 ORM（schema + migrations）
```

## 关键设计决策

### Tool Call 协议

LLM 不使用原生 function calling API，而是通过 prompt 约定 `<tool_call>{"name":"...","arguments":{...}}</tool_call>` 格式。后端正则解析后执行。这样做是为了兼容智谱 glm-4-flash 的能力边界，同时保留未来升级到原生 function calling 的空间。

### SSE 混合流

`POST /api/agent/plan/stream` 返回三种事件类型：
- `{"type":"text","content":"..."}` — 文本流，追加到聊天气泡
- `{"type":"action","action":"set_loading"|"loading_done"}` — UI 状态控制
- `{"type":"itinerary_snapshot","data":{...}}` — 完整行程 JSON，前端直接 applySnapshot 覆盖

### 状态管理

Zustand Store 是三栏的唯一数据源。ChatPanel 写入 snapshot → ItineraryPanel 和 MapPanel 响应式渲染。不用 React Context 是因为 Zustand 无需 Provider 嵌套，跨组件访问更简洁。

## 开发命令

```bash
# 前端
npm run dev          # Next.js dev server (port 3000)

# 后端
cd server
npm run dev          # Express dev server (port 3001)

# 数据库
cd server
npx prisma migrate dev    # 运行迁移
npx prisma studio         # 数据库可视化

# 类型检查
npx tsc --noEmit                     # 前端
cd server && npx tsc --noEmit        # 后端
```

## 环境变量

后端 `server/.env` 需要配置：
- `ZHIPU_API_KEY` — 智谱 AI API Key
- `NEXT_PUBLIC_AMAP_KEY` / `NEXT_PUBLIC_AMAP_SECURITY_CODE` — 高德地图（前端 `.env.local`）
- `DATABASE_URL` — PostgreSQL 连接串
- `REDIS_URL` — Redis 连接串（可选，用于 API 缓存）

## 编码约定

- 前端使用 Tailwind CSS 原子类，不写独立 CSS 文件
- 组件用 named export，页面用 default export
- 类型定义集中在 `types/` 目录，前后端各自维护但结构对齐
- API 客户端在 `src/lib/api/`，所有请求走 `NEXT_PUBLIC_API_URL`（默认 `http://localhost:3001/api`）
- 后端路由统一前缀 `/api`，RESTful 风格
- Zustand Store 在 `src/stores/`，一个功能一个 store 文件
