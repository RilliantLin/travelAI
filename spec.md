# TravelMind 产品规格说明书

## 1. 项目概述

### 1.1 项目名称

**TravelMind** — 智能旅游规划助手

### 1.2 项目定位

面向个人旅行者的 AI 驱动旅游规划平台。核心交互模式是 **Chat 驱动的行程编辑器**：用户通过自然语言与 AI 对话，AI 实时生成和修改行程，三栏同屏展示聊天、行程卡片和地图。

### 1.3 核心价值

- **对话即操作**：不需要手动填表，说"把第二天的象鼻山换成两江四湖"，AI 直接改行程
- **所见即所得**：聊天、行程卡片、地图三栏并排，修改实时可见
- **一体化**：天气、路线、景点、餐饮、住宿、预算整合在一个对话流中
- **非商业化**：仅展示信息和规划，不接入预订支付

### 1.4 目标用户

自由行旅行者、家庭出游者、短途周末游规划者。

---

## 2. 系统架构

### 2.1 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | Next.js | 14.x | App Router |
| UI | React + Tailwind CSS | 18.x / 4.x | 原子化样式 |
| UI 基础组件 | @base-ui/react + CVA | - | Button 等基础组件 |
| 状态管理 | Zustand | latest | 三栏共享状态 |
| 地图 | @amap/amap-jsapi-loader | 1.x | 高德地图 JS API 2.0 |
| 图标 | lucide-react | latest | - |
| 后端 | Express.js | 5.x | API 服务 |
| ORM | Prisma | 6.x | PostgreSQL |
| 缓存 | Redis (ioredis) | - | API 结果缓存 |
| AI | LangChain + 智谱 ChatZhipuAI | - | glm-4-flash 模型 |
| 语言 | TypeScript | 全栈 | 前后端共用类型结构 |

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│        Frontend (Next.js 14 / Vercel)                           │
│        https://travel-ai-navy.vercel.app                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  ChatPanel   │  │ ItineraryPanel   │  │    MapPanel        │  │
│  │  (Zustand)   │  │   (Zustand)      │  │    (Zustand)       │  │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬──────────┘  │
│         │                  │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                            │ Zustand Store                      │
│                   ┌────────┴────────┐                           │
│                   │ itinerary-store │                           │
│                   │   chat-store    │                           │
│                   └────────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │ SSE / REST
              ┌──────────────┴──────────────┐
              │ Express.js API (Railway)     │
              │ travelai-backend-production  │
              │         /api/agent           │
              │         /api/itineraries     │
              │         /api/weather ...     │
              └──────┬──────────┬────────────┘
                     │          │
              ┌──────┴───┐  ┌──┴──────────┐
              │ PlanAgent │  │ External    │
              │ (LangChain│  │ APIs        │
              │  + 智谱)   │  │ (高德/天气)  │
              └──────┬───┘  └─────────────┘
                     │
              ┌──────┴───────┐
              │ Supabase      │
              │ PostgreSQL    │
              │  + Redis      │
              └──────────────┘
```

### 2.3 核心数据流（规划模式）

```
1. 用户在 ChatPanel 输入消息
2. 前端构建 itineraryContext（当前行程压缩摘要）
3. POST /api/agent/plan/stream { message, history, itineraryContext, itineraryId, userId }
4. PlanAgent 将 itineraryContext 注入 system prompt
5. LLM 生成自然语言回复 + <tool_call> 标签
6. 后端解析 tool_call → 执行行程操作（增删改排序）
7. SSE 推送：text chunks → action 事件 → itinerary_snapshot
8. 前端 ChatPanel 接收 SSE：
   - text → 追加到聊天气泡
   - itinerary_snapshot → Zustand applySnapshot()
9. ItineraryPanel 和 MapPanel 响应式重渲染
```

### 2.4 生产环境部署

| 模块 | 平台 | 生产地址 / 项目地址 | 说明 |
|------|------|---------------------|------|
| 前端 | Vercel | https://travel-ai-navy.vercel.app | Next.js 14 应用，生产环境通过 `NEXT_PUBLIC_API_URL` 调用 Railway 后端 |
| 后端 | Railway | https://travelai-backend-production-a9fc.up.railway.app | Express API 服务，统一前缀 `/api`，健康检查 `/health` |
| 数据库 | Supabase | https://supabase.com/dashboard/project/dangrltzzfeelbjceroc | 托管 PostgreSQL，后端通过 `DATABASE_URL` 连接 |

---

## 3. 页面与路由

### 3.1 路由总览

```
/                        → 重定向至 /plan/new
/plan/new                → 三栏规划页（新行程，核心页面）
/plan/:id                → 三栏规划页（加载已有行程）
/profile/preferences     → 用户偏好设置
```

### 3.2 导航栏

组件：`src/components/ui/navbar.tsx`，全局 sticky 顶部。根布局 `src/app/layout.tsx` 同时挂载 `HistoryDrawer`，因此历史线路入口在所有页面可用。

| 路径 | 名称 | 图标 |
|------|------|------|
| `/plan/new` | 行程规划 | LayoutDashboard |
| `/profile/preferences` | 偏好设置 | Settings |

左侧「历史线路」按钮使用 `ui-store.isHistoryDrawerOpen` 控制抽屉显隐，点击历史条目跳转 `/plan/:id`。

### 3.3 规划页面（核心）

路由：`/plan/[id]`，文件：`src/app/plan/[id]/page.tsx`

三栏全屏并排布局，高度 `calc(100vh - 3.5rem)`：

```
┌────────────────┬─────────────────────┬──────────────────┐
│                │                     │                  │
│   Chat Panel   │  Itinerary Panel    │    Map Panel     │
│    (~25%)      │     (~40%)          │     (~35%)       │
│   min 280px    │    min 320px        │     flex-1       │
│                │                     │                  │
│  ┌──────────┐  │  ┌───────────────┐  │                  │
│  │ 消息列表  │  │  │ 日期 Tab 切换  │  │  ┌────────────┐ │
│  │          │  │  ├───────────────┤  │  │            │ │
│  │          │  │  │ 住宿卡片      │  │  │  高德地图   │ │
│  │          │  │  │ 交通卡片      │  │  │  + 标记    │ │
│  │          │  │  │ 景点卡片 1    │  │  │  + 路线    │ │
│  │          │  │  │ 交通卡片      │  │  │            │ │
│  │          │  │  │ 景点卡片 2    │  │  │            │ │
│  │          │  │  │ 餐饮信息      │  │  └────────────┘ │
│  ├──────────┤  │  │ ...           │  │                  │
│  │ 快捷操作  │  │  └───────────────┘  │  ┌────────────┐ │
│  ├──────────┤  │                     │  │ 图例       │ │
│  │ 输入框   │  │  ┌───────────────┐  │  └────────────┘ │
│  └──────────┘  │  │ 天气小贴士    │  │                  │
│                │  └───────────────┘  │                  │
└────────────────┴─────────────────────┴──────────────────┘
```

### 3.4 首页

路由：`/`，文件：`src/app/page.tsx`

当前首页不承载独立内容，访问后直接 `redirect("/plan/new")`，让三栏规划页成为默认首屏。

### 3.5 偏好设置页

路由：`/profile/preferences`

表单字段：预算范围、出行人数、旅行风格（休闲/适中/紧凑）、交通偏好、住宿偏好、饮食限制、偏好活动、无障碍需求。支持表单校验和重置。

### 3.6 历史线路抽屉

组件：`src/components/ui/HistoryDrawer.tsx`

- 全局挂载在 `src/app/layout.tsx`
- 打开时调用 `GET /api/itineraries` 拉取最近 50 条行程
- 按更新时间分组：近期、一个月内、更早
- 支持创建新行程，跳转 `/plan/new`
- 点击历史行程后跳转 `/plan/:id` 并关闭抽屉

---

## 4. 行程卡片系统

规划模式中栏的卡片按时间线排列，共三大类：

### 4.1 景点/活动卡片 (ActivityCard)

```
┌─────────────────────────────────────────────────┐
│  [1]  象鼻山景区                    ⭐ 8.8       │
│                                                 │
│       位于桂林象山区象鼻山风景区内                   │
│                                                 │
│  🕐 09:00 - 11:00   2h   🎫 ¥75              │
│  📍 象山区滨江路                                 │
│                                    [替换] [删除] │
└─────────────────────────────────────────────────┘
```

字段：序号、名称、评分、描述（2行截断）、时间段、时长、费用、地址。
操作：hover 时显示替换和删除按钮。
高亮：与地图联动，鼠标悬停时蓝色边框 + ring。

### 4.2 交通卡片 (TransportCard)

```
   🚶 步行  10分钟 · 2.3km
```

轻量连接线样式，不占独立卡片空间。穿插在景点卡片之间。

支持模式：walking / bus / subway / taxi / train / flight / driving / cycling，各有独立图标和颜色。

显示：交通方式、时长、距离（可选）、费用（可选）、班次详情（可选）。

### 4.3 住宿卡片 (AccommodationCard)

```
┌─────────────────────────────────────────────────┐
│  🏨  住宿                          ⭐ 4.5       │
│      全季酒店（桂林两江四湖景区店）                  │
│      酒店   ¥288/晚                             │
│  📍 桂林市秀峰区中山中路                           │
└─────────────────────────────────────────────────┘
```

蓝色渐变背景区分于景点卡片。字段：名称、类型、每晚价格、评分、地址。

### 4.4 餐饮信息 (MealEntry)

内联轻量展示：`🍴 桂林米粉（早餐） 08:00 · ¥15/人`

按早餐/午餐/晚餐穿插在活动时间线中。

### 4.5 日时间线 (DayTimeline)

组合以上卡片，一天的完整渲染顺序：

```
住宿卡片（当日入住）
早餐信息
景点卡片 1
  交通卡片（→ 景点2）
午餐信息（穿插在中间）
景点卡片 2
  交通卡片（→ 景点3）
景点卡片 3
晚餐信息
天气小贴士
```

---

## 5. AI Agent 系统

### 5.1 双 Agent 架构

| Agent | 文件 | 用途 | 使用场景 |
|-------|------|------|----------|
| TravelAgent | `server/src/agent/index.ts` | 纯对话（chatStream + 意图识别） | 后备聊天接口 / 兼容接口 |
| **PlanAgent** | `server/src/agent/plan-agent.ts` | 对话 + 行程操作（tool_call） | 规划模式 `/plan/[id]` 页面 |
| ItineraryAgent | `server/src/agent/itinerary-agent.ts` | 行程数据生成（POI + 天气 + 预算） | 被 PlanAgent 内部调用 |

### 5.2 PlanAgent 工作流程

```
输入: userInput + conversationHistory + itineraryContext
  │
  ▼
组装 system prompt（角色定义 + 工具说明 + 当前行程状态）
  │
  ▼
调用 LLM (getChatModel → glm-4-flash)
  │
  ▼
解析返回文本：
  ├── 自然语言部分 → 分块 SSE 推送 (type: "text")
  └── <tool_call>...</tool_call> → 依次执行
        │
        ▼
      工具执行结果更新内存中的 currentItinerary
        │
        ▼
      推送 (type: "itinerary_snapshot", data: 完整行程)
```

### 5.3 工具定义 (8 个)

定义文件：`server/src/agent/tools.ts`

| 工具 | 参数 | 说明 |
|------|------|------|
| `generate_itinerary` | destination, days, startDate?, travelStyle? | 生成完整多日行程 |
| `add_activity` | dayIndex, name, type?, duration?, description?, estimatedCost? | 添加景点/活动 |
| `remove_activity` | dayIndex, activityName | 删除活动 |
| `replace_activity` | dayIndex, oldActivityName, newName, newType?, newDuration?, newDescription?, newEstimatedCost? | 替换活动 |
| `modify_activity` | dayIndex, activityName, changes{startTime?, endTime?, duration?, estimatedCost?, description?} | 修改属性 |
| `set_transport` | dayIndex, from, to, mode, duration?, cost?, details? | 设置交通方案 |
| `set_accommodation` | dayIndex, name, type?, estimatedCost?, rating?, address? | 设置住宿 |
| `reorder_day` | dayIndex, activityNames[] | 调整活动顺序 |

### 5.4 Tool Call 协议

LLM 通过 prompt 约定输出格式（非原生 function calling）：

```
<tool_call>
{"name": "replace_activity", "arguments": {"dayIndex": 1, "oldActivityName": "象鼻山", "newName": "两江四湖夜游"}}
</tool_call>
```

后端用正则 `/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g` 提取并 JSON.parse 执行。一条回复中可包含多个 tool_call。

### 5.5 行程上下文注入

每轮对话，前端 `ChatPanel.buildItineraryContext()` 压缩当前行程为文本：

```
当前行程：桂林7日游（2026-04-09 ~ 2026-04-15，共7天）
预算: ¥6000
第1天(2026-04-09): 深圳→桂林(08:00-14:00)、七星景区(15:00-17:00)
第2天(2026-04-10): 象鼻山景区(09:00-11:00)、叠彩山(14:00-16:00)；住宿:全季酒店
...
```

该摘要追加到 system prompt 末尾，让 LLM 理解当前行程全貌后再决定如何回复和操作。

---

## 6. SSE 流协议

### 6.1 端点

`POST /api/agent/plan/stream`

请求体：

```typescript
{
  message: string;          // 用户输入
  history: ChatMessage[];   // 对话历史
  itineraryContext?: string; // 行程摘要文本
  itineraryId?: string;     // 已有行程 ID
  userId?: string;          // 用户 ID，默认 demo-user-001
}
```

### 6.2 事件类型

| type | 说明 | 前端处理 |
|------|------|----------|
| `text` | `{"type":"text","content":"好的，我帮你..."}` | 追加到聊天气泡 |
| `action` | `{"type":"action","action":"set_loading"}` | 显示行程面板 loading |
| `action` | `{"type":"action","action":"loading_done"}` | 隐藏 loading |
| `itinerary_snapshot` | `{"type":"itinerary_snapshot","data":{完整 Itinerary JSON}}` | `applySnapshot()` 更新 Zustand Store |

流结束标记：`data: [DONE]`

### 6.3 后备聊天端点（保留）

| 端点 | 说明 |
|------|------|
| `POST /api/agent/chat` | 非流式聊天 |
| `POST /api/agent/chat/stream` | 流式聊天（仅 text） |
| `POST /api/agent/intent` | 意图识别 |

---

## 7. 状态管理

### 7.1 ItineraryStore

文件：`src/stores/itinerary-store.ts`

```typescript
interface ItineraryState {
  itinerary: Itinerary | null;       // 当前行程（三栏的单一数据源）
  activeDay: number;                  // 当前选中天数索引
  highlightedActivityId: string | null; // 高亮活动（地图联动）
  isLoading: boolean;
  error: string | null;

  // 整体操作
  setItinerary: (data: Itinerary | null) => void;
  applySnapshot: (itinerary: Itinerary) => void;

  // 天级操作
  setActiveDay: (day: number) => void;
  updateDay: (dayIndex: number, dayPlan: DayPlan) => void;

  // 活动级操作
  addActivity: (dayIndex: number, activity: Activity) => void;
  removeActivity: (dayIndex: number, activityId: string) => void;
  replaceActivity: (dayIndex: number, oldId: string, newActivity: Activity) => void;
  modifyActivity: (dayIndex: number, activityId: string, changes: Partial<Activity>) => void;
  reorderActivities: (dayIndex: number, activityIds: string[]) => void;

  // 住宿
  setAccommodation: (dayIndex: number, accommodation: AccommodationPlan) => void;

  // UI
  setHighlightedActivity: (id: string | null) => void;
}
```

### 7.2 ChatStore

文件：`src/stores/chat-store.ts`

```typescript
interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  linkedItineraryId: string | null;  // 关联的行程 ID
  userId: string;                     // 固定 demo-user-001

  initialize: () => void;            // 从 localStorage 恢复历史
  addUserMessage: (content: string) => ChatMessage[];
  appendStreamingContent: (chunk: string) => void;
  finalizeAssistantMessage: (fullMessage: string) => void;
  clearChat: () => void;
}
```

消息持久化：最近 50 条存入 `localStorage` key `travel-chat-history`。

---

## 8. 数据模型

### 8.1 前端类型（`src/types/itinerary.ts`）

```typescript
interface Itinerary {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;           // YYYY-MM-DD
  endDate: string;
  totalDays: number;
  days: DayPlan[];
  budget?: BudgetSummary;
  status: "draft" | "confirmed" | "completed" | "cancelled";
  description?: string;
  coverImage?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DayPlan {
  dayNumber: number;
  date: string;
  activities: Activity[];
  meals: MealPlan[];
  accommodation?: AccommodationPlan;
  weather?: WeatherInfo;
  tips?: string;
  summary?: string;
}

interface Activity {
  id: string;
  type: "attraction" | "restaurant" | "hotel" | "transport" | "other";
  name: string;
  location: Location;            // { lat, lng, address?, name? }
  description?: string;
  startTime: string;             // "09:00"
  endTime: string;               // "11:00"
  duration: number;              // 分钟
  estimatedCost?: number;
  bookingRequired: boolean;
  rating?: number;
  imageUrl?: string;
  notes?: string;
}

interface MealPlan {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  location: Location;
  time: string;
  duration: number;
  estimatedCost: number;
  cuisine?: string;
}

interface AccommodationPlan {
  id: string;
  name: string;
  location: Location;
  type: string;                  // "酒店" | "民宿" | ...
  checkIn: string;
  checkOut: string;
  estimatedCost: number;         // 每晚价格
  rating?: number;
  amenities?: string[];
}

interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  breakdown: { category: string; amount: number; percentage: number; }[];
  currency: string;
}
```

### 8.2 地图类型（`src/types/map.ts`）

```typescript
interface MarkerData {
  id: string;
  position: [number, number];   // [lng, lat]
  type: "attraction" | "restaurant" | "hotel" | "start" | "end" | "waypoint";
  title: string;
  description?: string;
  color?: string;
}

interface RouteData {
  id: string;
  origin: [number, number];
  destination: [number, number];
  mode: "driving" | "walking" | "transit" | "bicycling";
  distance?: number;
  duration?: number;
}
```

---

## 9. API 集成

### 9.1 后端 REST 路由

统一前缀 `/api`，挂载于 `server/src/routes/index.ts`：

| 路由 | 说明 |
|------|------|
| `/api/agent` | AI Agent（chat / stream / intent / plan/stream） |
| `/api/itineraries` | 行程 CRUD |
| `/api/users` | 用户管理 |
| `/api/preferences` | 偏好设置 |
| `/api/weather` | 天气查询 |
| `/api/attractions` | 景点搜索 |
| `/api/restaurants` | 餐厅搜索 |
| `/api/flights` | 航班查询 |
| `/api/hotels` | 酒店查询 |
| `/api/routes` | 路线规划 |

### 9.2 外部 API

| API | 用途 | 封装文件 |
|-----|------|----------|
| 高德地图 REST API v3 | 地理编码、POI 搜索、路径规划、距离测量 | `server/src/lib/api/amap.ts` |
| 高德地图 JS API 2.0 | 前端地图渲染、标记、路线 | `src/components/map/AMapProvider.tsx` |
| 天气 API | 未来7天天气预报 | `server/src/lib/api/weather.ts` |
| 航班 API | 航班价格、时间查询 | `server/src/lib/api/flight.ts` |
| 酒店 API | 酒店价格、评分查询 | `server/src/lib/api/hotel.ts` |

API 结果通过 Redis 缓存，TTL 默认 24 小时（地理编码 7 天）。

---

## 10. 视觉规格

### 10.1 色彩系统

| 用途 | 色值 | Tailwind |
|------|------|----------|
| 主色调 | #2563EB | blue-600 |
| 悬停 | #1D4ED8 | blue-700 |
| 成功 | #10B981 | emerald-500 |
| 警告 | #F59E0B | amber-500 |
| 错误 | #EF4444 | red-500 |
| 页面背景 | #F8FAFC | gray-50 |
| 卡片背景 | #FFFFFF | white |
| 主文本 | #1E293B | gray-900 |
| 次要文本 | #64748B | gray-500 |
| 边框 | #E2E8F0 | gray-200 |

### 10.2 卡片类型颜色标识

| 卡片类型 | 序号/图标颜色 | 背景 |
|----------|-------------|------|
| 景点活动 | red-600 | white |
| 交通连接 | 按模式：绿(步行) 蓝(公交) 紫(地铁) 橙(打车) 青(火车) 天蓝(飞机) | 透明 |
| 住宿 | blue-600 | blue-50 渐变 |
| 餐饮 | orange-600 | 透明 |

### 10.3 地图标记颜色

| 类型 | 颜色 | 图标 |
|------|------|------|
| 景点 | #EF4444 | 📍 |
| 餐厅 | #F59E0B | 🍜 |
| 酒店 | #2563EB | 🏨 |
| 起点/终点 | #10B981 | 🚩 |
| 途经点 | #64748B | 📍 |

### 10.4 间距与圆角

- 基础单位：4px
- 间距阶梯：4, 8, 12, 16, 24, 32, 48, 64px
- 卡片圆角：12px (rounded-xl)
- 按钮圆角：8px (rounded-lg)
- 输入框圆角：12px (rounded-xl)
- 字体：Inter (通过 next/font/google 加载)

---

## 11. 目录结构

```
travel/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # 根布局（Navbar + 全局样式）
│   │   ├── page.tsx                          # 首页重定向至 /plan/new
│   │   ├── globals.css                       # Tailwind 全局样式
│   │   ├── plan/
│   │   │   └── [id]/
│   │   │       └── page.tsx                  # 三栏规划页面（核心）
│   │   └── profile/
│   │       └── preferences/
│   │           └── page.tsx                  # 偏好设置表单
│   ├── stores/
│   │   ├── itinerary-store.ts                # Zustand 行程 Store
│   │   ├── chat-store.ts                     # Zustand 聊天 Store
│   │   └── ui-store.ts                       # 全局 UI Store（历史抽屉等）
│   ├── components/
│   │   ├── plan/                             # 规划模式组件
│   │   │   ├── ChatPanel.tsx                 # 左栏：聊天 + 上下文构建 + SSE 流处理
│   │   │   ├── ItineraryPanel.tsx            # 中栏：行程头部 + 日期 Tab + 卡片时间线
│   │   │   ├── MapPanel.tsx                  # 右栏：从 Store 生成标记 + 联动高亮
│   │   │   ├── ActivityCard.tsx              # 景点/活动卡片
│   │   │   ├── TransportCard.tsx             # 交通连接卡片
│   │   │   ├── AccommodationCard.tsx         # 住宿卡片
│   │   │   ├── DayTimeline.tsx               # 日时间线（组合上述卡片 + 餐饮）
│   │   │   └── index.ts
│   │   ├── chat/                             # 聊天子组件
│   │   │   ├── MessageBubble.tsx             # 消息气泡
│   │   │   ├── ChatInput.tsx                 # 自适应输入框
│   │   │   ├── QuickActions.tsx              # 8 个快捷操作按钮
│   │   │   └── index.ts
│   │   ├── map/                              # 地图组件
│   │   │   ├── AMapProvider.tsx              # 高德地图 Context Provider
│   │   │   ├── MapView.tsx                   # 地图视图容器（标记 + 控件 + 图例）
│   │   │   └── Marker.tsx                    # 标记点组件（颜色按类型）
│   │   └── ui/                               # 基础 UI
│   │       ├── button.tsx                    # Button（@base-ui + CVA）
│   │       ├── navbar.tsx                    # 全局导航栏
│   │       └── HistoryDrawer.tsx             # 历史线路抽屉
│   ├── lib/
│   │   ├── api/
│   │   │   ├── chat.ts                       # sendPlanStreamMessage
│   │   │   ├── itinerary.ts                  # getItinerary / createItinerary / updateItinerary / deleteItinerary
│   │   │   └── preference.ts                 # 偏好 CRUD
│   │   └── utils.ts                          # cn() 类名合并
│   └── types/
│       ├── itinerary.ts                      # Itinerary / DayPlan / Activity / MealPlan / AccommodationPlan
│       ├── map.ts                            # MarkerData / RouteData / MapContextValue
│       ├── preference.ts
│       └── css.d.ts
├── server/
│   ├── src/
│   │   ├── index.ts                          # Express 服务入口 (port 3001)
│   │   ├── agent/
│   │   │   ├── plan-agent.ts                 # PlanAgent（对话 + tool_call + 行程操作）
│   │   │   ├── tools.ts                      # 8 个工具 Schema 定义 + prompt 格式生成
│   │   │   ├── index.ts                      # TravelAgent（经典纯对话）
│   │   │   ├── itinerary-agent.ts            # ItineraryAgent（行程生成引擎）
│   │   │   ├── llm.ts                        # 智谱 ChatZhipuAI 模型（普通/流式/结构化）
│   │   │   ├── intent.ts                     # 意图识别（Zod Schema）
│   │   │   └── prompts/
│   │   │       └── index.ts                  # System Prompt 模板集合
│   │   ├── routes/
│   │   │   ├── index.ts                      # 路由聚合
│   │   │   ├── agent.routes.ts               # /chat, /chat/stream, /intent, /plan/stream
│   │   │   ├── itinerary.routes.ts           # CRUD
│   │   │   └── ...                           # user / preference / weather / attraction / restaurant / flight / hotel / route
│   │   ├── controllers/                      # 控制器层（9 个 controller）
│   │   ├── services/
│   │   │   └── recommendation.service.ts     # 推荐服务
│   │   ├── lib/
│   │   │   ├── api/                          # 外部 API 封装
│   │   │   │   ├── amap.ts                   # 高德地图（地理编码/POI/路径/距离）
│   │   │   │   ├── weather.ts                # 天气预报
│   │   │   │   ├── flight.ts                 # 航班数据
│   │   │   │   └── hotel.ts                  # 酒店数据
│   │   │   ├── budget/
│   │   │   │   └── calculator.ts             # 预算计算
│   │   │   ├── optimization/
│   │   │   │   └── route-optimizer.ts        # 路线优化
│   │   │   ├── recommendation/
│   │   │   │   ├── attraction-scorer.ts      # 景点评分
│   │   │   │   └── restaurant-scorer.ts      # 餐厅评分
│   │   │   └── utils/
│   │   │       ├── time.ts                   # 时间工具（formatDate / minutesToTime / getDaysBetween）
│   │   │       ├── budget.ts                 # 预算估算（estimateBudget）
│   │   │       ├── distance.ts               # 距离计算
│   │   │       └── format.ts                 # 格式化工具
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts
│   │   │   └── request.middleware.ts
│   │   └── types/                            # 后端类型（与前端结构对齐）
│   └── prisma/
│       ├── schema.prisma                     # 数据库模型
│       └── migrations/
├── AGENTS.md                                 # AI 编码助手上下文文件
├── spec.md                                   # 本文件
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── .eslintrc.json
├── .prettierrc
└── docker-compose.yml
```

---

## 12. 环境变量

### 生产环境

| 变量 | 建议值 / 来源 | 部署位置 | 说明 |
|------|---------------|----------|------|
| `NEXT_PUBLIC_API_URL` | `https://travelai-backend-production-a9fc.up.railway.app/api` | Vercel | 前端调用后端 API 的基础地址 |
| `NEXT_PUBLIC_AMAP_KEY` | 高德地图 Web JS API Key | Vercel | 前端地图渲染 |
| `NEXT_PUBLIC_AMAP_SECURITY_CODE` | 高德地图安全密钥 | Vercel | 高德 JS API 安全配置 |
| `PORT` | Railway 自动注入 | Railway | 后端监听端口，代码默认回退到 3001 |
| `ZHIPU_API_KEY` | 智谱 API Key | Railway | PlanAgent / TravelAgent 调用智谱模型 |
| `DATABASE_URL` | Supabase PostgreSQL 连接串 | Railway | Prisma 连接 Supabase 数据库 |
| `REDIS_URL` | Redis 连接串，可选 | Railway | API 缓存；未配置时默认 `redis://localhost:6379` |
| `AMAP_API_KEY` | 高德地图 Web 服务 API Key | Railway | 后端地理编码、POI、路线等服务 |
| `QWEATHER_API_KEY` | 和风天气 API Key，可选 | Railway | 天气查询 |
| `QWEATHER_API_HOST` | 和风天气 API Host，可选 | Railway | 天气接口域名配置 |

生产资源：

- 前端 Vercel：https://travel-ai-navy.vercel.app
- 后端 Railway：https://travelai-backend-production-a9fc.up.railway.app
- Supabase 项目：https://supabase.com/dashboard/project/dangrltzzfeelbjceroc

### 前端 `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_AMAP_KEY=你的高德地图 Web JS API Key
NEXT_PUBLIC_AMAP_SECURITY_CODE=你的高德安全码
```

### 后端 `server/.env`

```
PORT=3001
ZHIPU_API_KEY=你的智谱 API Key
DATABASE_URL=postgresql://user:password@localhost:5432/travelmind
REDIS_URL=redis://localhost:6379
AMAP_API_KEY=你的高德地图 Web 服务 API Key
QWEATHER_API_KEY=你的和风天气 API Key
QWEATHER_API_HOST=你的和风天气 API Host
```

---

## 13. 开发与运行

```bash
# 安装依赖
npm install
cd server && npm install

# 数据库初始化
cd server
npx prisma migrate dev
npx prisma generate

# 启动开发服务器
npm run dev              # 前端 :3000
cd server && npm run dev # 后端 :3001

# 使用生产环境变量本地调试
npm run dev:prd
cd server && npm run dev:prd

# 生产构建
npm run build
cd server && npm run build

# 类型检查
npx tsc --noEmit                     # 前端
cd server && npx tsc --noEmit        # 后端

# 代码格式化
npm run format
```

---

## 14. 验收标准

### 14.1 功能验收

| 功能 | 验收条件 | 测试方法 |
|------|----------|----------|
| 行程生成 | 对话"帮我规划桂林7日游"后，中栏显示7天行程卡片 | 在 `/plan/new` 页面输入 |
| 活动替换 | 对话"把第2天的象鼻山换成两江四湖"后，卡片更新 | 在已有行程上对话 |
| 活动删除 | 对话"删掉第3天的千层天梯"后，卡片消失 | 在已有行程上对话 |
| 添加活动 | 对话"第1天加一个叠彩山"后，新卡片出现 | 在已有行程上对话 |
| 设置住宿 | 对话"第2天住全季酒店"后，住宿卡片显示 | 在已有行程上对话 |
| 地图联动 | 切换日期 Tab，地图标记跟随切换 | 点击不同天数 Tab |
| 卡片高亮 | 鼠标悬停卡片，地图对应标记高亮 | hover 交互 |
| 天气查询 | 输入"桂林天气"，AI 回复天气信息 | 聊天输入 |
| 预算 | 生成行程后预算摘要出现在行程面板头部 | 查看行程头部 |
| 偏好设置 | 表单保存后偏好数据持久化 | 填写并保存 |

### 14.2 性能指标

| 指标 | 要求 |
|------|------|
| 首屏加载 | < 3s |
| SSE 首个 token | < 3s |
| AI 完整回复 | < 15s |
| 行程 snapshot 渲染 | < 200ms |
| 地图加载 | < 2s |
| 交互响应 | < 100ms |

### 14.3 兼容性

| 平台 | 最低版本 |
|------|----------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 88+ |
| Edge | 90+ |
| 移动端 | iOS 14+, Android 10+（降级为 Tab 切换模式） |
