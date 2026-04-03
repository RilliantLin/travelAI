# 旅游规划 AI Agent 产品规格说明书

## 1. 项目概述

### 1.1 项目名称

**TravelMind** - 智能旅游规划助手

### 1.2 项目定位

面向个人旅行者的 AI 驱动旅游规划平台，通过自然语言交互帮助用户完成行程规划、获取实时信息、做出最优决策。

### 1.3 核心价值

* **智能化**：AI 驱动的个性化行程推荐

* **一体化**：天气、路线、景点、餐饮、预算一站式服务

* **可视化**：直观的地图展示和日程呈现

* **非商业化**：仅展示信息，不提供预订功能，保护用户隐私

### 1.4 目标用户

个人旅行者，特别是：

* 自由行爱好者

* 家庭出游者

* 商务旅行中的休闲需求者

***

## 2. 功能规格

### 2.1 核心功能矩阵

| 功能模块   | 功能点       | 优先级 | 说明                |
| ------ | --------- | --- | ----------------- |
| 天气预测   | 未来7天天气预报  | P0  | 显示温度、天气状况、穿衣建议    |
| 天气预测   | 基于天气的行程建议 | P1  | 根据天气推荐室内/室外活动     |
| 行程路线规划 | 多日行程生成    | P0  | 输入目的地和天数，AI生成每日行程 |
| 行程路线规划 | 预留时间管理    | P0  | 每个景点标注游玩时长和交通时间   |
| 行程路线规划 | 路线优化      | P0  | 基于地理位置优化景点顺序      |
| 景点推荐   | 基于偏好推荐    | P0  | 根据预算、兴趣推荐景点       |
| 景点推荐   | 门票/开放时间展示 | P0  | 显示价格、营业时间、评分      |
| 餐厅推荐   | 基于位置推荐    | P0  | 展示人均消费、菜系、评分      |
| 餐厅推荐   | 筛选功能      | P1  | 支持价位、菜系、距离筛选      |
| 预算规划   | 自动费用估算    | P0  | 交通、住宿、餐饮、门票分项估算   |
| 预算规划   | 超标提醒      | P1  | 超过预算时提示用户         |
| 机票展示   | 价格查询      | P0  | 显示航班价格、时间、航空公司    |
| 机票展示   | 价格对比      | P1  | 多航班价格横向对比         |
| 酒店展示   | 价格查询      | P0  | 显示酒店价格、星级、评分      |
| 酒店展示   | 位置展示      | P1  | 在地图上标注酒店位置        |

### 2.2 用户交互流程

```
┌─────────────────────────────────────────────────────────────┐
│                      用户首次使用                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   设置偏好       │
                    │ - 预算范围       │
                    │ - 出行人数       │
                    │ - 饮食偏好       │
                    │ - 交通偏好       │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      日常使用流程                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   聊天输入       │
                    │ "我想去东京玩5天" │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   意图识别       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ 天气查询  │   │ 行程规划  │   │ 预算查询  │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ 获取天气  │   │ 生成行程  │   │ 计算预算  │
       │ 数据API  │   │ AI + 地图 │   │ 费用估算  │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                    ┌─────────────────┐
                    │   多模态输出     │
                    │ - 文字回复       │
                    │ - 行程卡片       │
                    │ - 地图可视化     │
                    │ - 日程表         │
                    └─────────────────┘
```

### 2.3 数据处理规格

#### 2.3.1 用户偏好数据

```typescript
interface UserPreference {
  budgetRange: {
    min: number;      // 最低预算（人民币）
    max: number;      // 最高预算（人民币）
    currency: string; // 货币类型，默认 CNY
  };
  travelerCount: number;              // 出行人数
  dietaryRestrictions: string[];      // 饮食限制，如 ["素食", "清真"]
  preferredTransportation: string;     // 交通偏好：飞机/高铁/自驾/大巴
  travelStyle: "relaxed" | "moderate" | "intensive"; // 旅行节奏
  accessibilityNeeds: boolean;         // 是否有无障碍需求
}
```

#### 2.3.2 行程数据模型

```typescript
interface Itinerary {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  days: DayPlan[];
  estimatedBudget: BudgetSummary;
  createdAt: string;
  updatedAt: string;
}

interface DayPlan {
  dayNumber: number;
  date: string;
  activities: Activity[];
  weather?: WeatherInfo;
  tips?: string;
}

interface Activity {
  id: string;
  type: "attraction" | "restaurant" | "transport" | "hotel" | "free_time";
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime: string;      // 开始时间，如 "09:00"
  endTime: string;        // 结束时间，如 "12:00"
  duration: number;       // 游玩时长（分钟）
  bookingRequired: boolean;
  estimatedCost: number;  // 预估费用
  notes?: string;
}

interface BudgetSummary {
  transportation: number;
  accommodation: number;
  food: number;
  attractions: number;
  miscellaneous: number;
  total: number;
  currency: string;
}
```

### 2.4 API 集成规格

#### 2.4.1 高德地图 API

| 功能    | API 端点                                          | 调用频率    |
| ----- | ----------------------------------------------- | ------- |
| 地理编码  | `https://restapi.amap.com/v3/geocode/geo`       | 60 QPD  |
| 路径规划  | `https://restapi.amap.com/v3/direction/driving` | 100 QPD |
| 距离测量  | `https://restapi.amap.com/v3/distance`          | 100 QPD |
| 关键字搜索 | `https://restapi.amap.com/v3/place/text`        | 100 QPD |

#### 2.4.2 天气 API

| 字段   | 说明                 |
| ---- | ------------------ |
| API  | 和风天气 / 墨迹天气        |
| 数据范围 | 未来 1-7 天天气预报       |
| 更新频率 | 每 3 小时             |
| 显示数据 | 温度、天气状况、湿度、风力、穿衣指数 |

#### 2.4.3 航班/酒店 API

| 数据类型 | API 来源                | 数据内容                |
| ---- | --------------------- | ------------------- |
| 航班   | 第三方聚合 API (如 Amadeus) | 航班号、出发/到达时间、价格、航空公司 |
| 酒店   | 飞猪 / Booking API      | 酒店名称、价格、星级、评分、位置    |

***

## 3. UI/UX 规格

### 3.1 页面结构

#### 3.1.1 路由总览

```
/                        → 首页（AI 聊天助手 ChatWindow）
/profile/preferences     → 用户偏好设置页（表单验证 + 重置）
/itinerary/:id           → 行程详情页（5 Tab：日程 / 地图 / 预算 / 航班 / 酒店）
/itinerary/:id/map       → 地图全览子页面（独立大屏地图视图）
```

#### 3.1.2 顶部导航栏（Navbar）

导航栏组件位于 `src/components/ui/navbar.tsx`，全局固定在页面顶部（sticky），包含以下导航项：

| 路径 | 名称 | 图标 | 说明 |
|------|------|------|------|
| `/` | AI 助手 | 💬 MessageSquare | 首页入口，AI 对话界面 |
| `/profile/preferences` | 偏好设置 | ⚙️ Settings | 旅行偏好配置表单 |

> 导航栏使用 `exact` 匹配逻辑：首页精确匹配 `/`，其他页面使用 `startsWith` 前缀匹配。

#### 3.1.3 页面详情

**① 首页 — AI 助手 (`/`)**
- 文件：`src/app/page.tsx`
- 组件：`ChatWindow`（聊天窗口 + 消息气泡 + 快捷操作 + 输入框）
- 功能：用户通过自然语言与 AI 交互，完成行程规划、天气查询等操作

**② 偏好设置页 (`/profile/preferences`)**
- 文件：`src/app/profile/preferences/page.tsx`
- 功能模块：
  - 预算设置（最低/最高预算、出行人数）
  - 旅行风格选择（休闲 / 适中 / 紧凑）
  - 交通偏好（飞机 / 高铁 / 自驾 / 大巴）
  - 住宿偏好（酒店 / 民宿 / 青年旅舍 / 营地）
  - 饮食限制（多选标签）
  - 偏好活动（多选标签）
  - 无障碍需求开关
- 特性：表单校验、加载/保存状态提示、重置功能

**③ 行程详情页 (`/itinerary/[id]`)**
- 文件：`src/app/itinerary/[id]/page.tsx`
- 包含 5 个 Tab 子导航（通过 `TabNav` 组件切换）：

| Tab ID | 名称 | 图标 | 内容 |
|--------|------|------|------|
| `schedule` | 日程安排 | 📅 Calendar | `ScheduleTimeline` 时间线组件，按天展示活动 |
| `map` | 地图视图 | 📍 MapPinned | `MapView` 内嵌地图 + 日程筛选按钮 + 地点卡片列表 |
| `budget` | 费用预算 | 💰 Wallet | `BudgetCard` 预算概览卡片 |
| `flights` | 航班信息 | ✈️ Plane | `FlightSearchPanel` 航班搜索面板 |
| `hotels` | 酒店推荐 | 🏨 Hotel | `HotelSearchPanel` 酒店搜索面板 |

**④ 地图全览页 (`/itinerary/[id]/map`)**
- 文件：`src/app/itinerary/[id]/map/page.tsx`
- 功能：独立的全屏地图视图，支持按天筛选地点标记
- 入口：从行程详情页的地图 Tab 或直接通过 URL 访问
- 组件：`MapView`（大屏高度 `calc(100vh - 200px)`）+ 地点网格列表

#### 3.1.4 页面导航关系图

```
                    ┌──────────────┐
                    │   Navbar     │
                    │ (全局导航栏)   │
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼             ▼
    ┌───────────┐ ┌────────────┐ ┌──────────────┐
    │   首页     │ │  偏好设置   │ │ (其他页面...)  │
    │   (/)     │ │(/preferences│ │              │
    │           │ │    )       │ │              │
    │ChatWindow │ │偏好表单     │ │              │
    │   │       │ │           │ │              │
    │   ▼       │ │           │ │              │
    │生成行程→   │ │           │ │              │
    │跳转详情   │ │           │ │              │
    └───────────┘ └────────────┘ └──────────────┘
         │
         ▼
    ┌─────────────────────────────────────┐
    │        行程详情页 (/itinerary/[id])   │
    │  ┌─────────────────────────────────┐ │
    │  │  ItineraryOverview (概览头部)    │ │
    │  ├─────────────────────────────────┤ │
    │  │  TabNav (5个Tab)                │ │
    │  ├─────────────────────────────────┤ │
    │  │  schedule / map / budget /      │ │
    │  │  flights / hotels               │ │
    │  └─────────────────────────────────┘ │
    │              │                       │
    │              ▼ (地图Tab内或URL直连)     │
    │  ┌─────────────────────────────────┐ │
    │  │  地图全览页 (/itinerary/[id]/map)│ │
    │  │  MapView (全屏) + 地点列表      │ │
    │  └─────────────────────────────────┘ │
    └─────────────────────────────────────┘
```

### 3.2 布局规格

#### 3.2.1 聊天页面布局

```
┌────────────────────────────────────────────────────┐
│  Header (Logo + 用户头像 + 设置入口)                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │              Chat Messages Area               │  │
│  │  ┌─────────┐                                 │  │
│  │  │ AI Msg  │  (行程卡片、地图、天气组件)       │  │
│  │  └─────────┘                                 │  │
│  │                     ┌───────────────┐         │  │
│  │                     │   User Msg    │         │  │
│  │                     └───────────────┘         │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  Quick Actions: [天气] [景点推荐] [预算] [行程]     │
├────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐    │
│  │  Input Area (Multi-line textarea)          │    │
│  └────────────────────────────────────────────┘    │
│                              [Send] [Mic] [Image]  │
└────────────────────────────────────────────────────┘
```

#### 3.2.2 行程详情页布局

```
┌────────────────────────────────────────────────────┐
│  Header (返回 + 行程名称 + 分享/导出按钮)           │
├────────────────────────────────────────────────────┤
│  Summary Bar: 目的地 | 日期 | 预算 | 人数           │
├────────────────────────────────────────────────────┤
│  Tab Nav: [日程] [地图] [预算] [航班] [酒店]         │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │              Content Area                     │  │
│  │  - 日程 Tab: 时间线组件                        │  │
│  │  - 地图 Tab: 高德地图 + 路线展示               │  │
│  │  - 预算 Tab: 饼图 + 明细列表                   │  │
│  │  - 航班 Tab: 航班卡片列表                       │  │
│  │  - 酒店 Tab: 酒店卡片列表                      │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3.3 视觉规格

#### 3.3.1 色彩系统

| 用途             | 色值      | 说明        |
| -------------- | ------- | --------- |
| Primary        | #2563EB | 主色调，按钮、链接 |
| Primary Dark   | #1D4ED8 | 悬停状态      |
| Secondary      | #10B981 | 成功状态、确认   |
| Accent         | #F59E0B | 警告、提示     |
| Error          | #EF4444 | 错误状态      |
| Background     | #F8FAFC | 页面背景      |
| Surface        | #FFFFFF | 卡片背景      |
| Text Primary   | #1E293B | 主文本       |
| Text Secondary | #64748B | 次要文本      |
| Border         | #E2E8F0 | 边框颜色      |

#### 3.3.2 字体系统

| 用途      | 字体    | 字号         |
| ------- | ----- | ---------- |
| H1      | Inter | 28px / 700 |
| H2      | Inter | 24px / 600 |
| H3      | Inter | 20px / 600 |
| Body    | Inter | 16px / 400 |
| Small   | Inter | 14px / 400 |
| Caption | Inter | 12px / 400 |

#### 3.3.3 间距系统

* 基础单位：4px

* 间距阶梯：4, 8, 12, 16, 24, 32, 48, 64px

* 卡片圆角：12px

* 按钮圆角：8px

* 输入框圆角：8px

#### 3.3.4 阴影系统

```css
/* 卡片阴影 */
.card-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);

/* 悬浮阴影 */
.hover-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);

/* 模态框阴影 */
.modal-shadow: 0 25px 50px rgba(0,0,0,0.25);
```

### 3.4 组件规格

#### 3.4.1 行程卡片 (ItineraryCard)

```
┌─────────────────────────────────────────┐
│ 📍 东京 (Day 1)                    03/15 │
│─────────────────────────────────────────│
│ 🕐 09:00 - 12:00                         │
│ 🏯 浅草寺                                │
│    台东区浅草2-3-1                        │
│    🎫 免费  |  ⏱️ 3小时                   │
│─────────────────────────────────────────│
│ 🕐 12:30 - 14:00                         │
│ 🍜 牛角食堂                               │
│    台东区浅草1-4-5                        │
│    💰 ¥50/人  |  ⏱️ 1.5小时               │
└─────────────────────────────────────────┘
```

#### 3.4.2 天气组件 (WeatherWidget)

```
┌───────────────────────────┐
│ 🌤️ 东京 3月15日            │
│───────────────────────────│
│  ☀️ 晴                    │
│  🌡️ 18°C - 24°C           │
│  💧 湿度 45%               │
│  👕 适宜出行               │
└───────────────────────────┘
```

#### 3.4.3 预算卡片 (BudgetCard)

```
┌─────────────────────────────────────────┐
│ 💰 预算概览                              │
│─────────────────────────────────────────│
│  交通        ¥2,400  ████████░░  40%    │
│  住宿        ¥1,800  ██████░░░░  30%    │
│  餐饮        ¥900    ███░░░░░░░  15%    │
│  景点        ¥600    ██░░░░░░░░  10%    │
│  其他        ¥300    █░░░░░░░░░   5%    │
│─────────────────────────────────────────│
│  总计        ¥6,000                     │
└─────────────────────────────────────────┘
```

#### 3.4.4 地图标记样式

| 类型    | 图标    | 颜色           |
| ----- | ----- | ------------ |
| 景点    | 📍    | #EF4444 (红色) |
| 餐厅    | 🍜    | #F59E0B (橙色) |
| 酒店    | 🏨    | #2563EB (蓝色) |
| 起点/终点 | 🚩    | #10B981 (绿色) |
| 交通    | ✈️/🚗 | #64748B (灰色) |

***

## 4. 技术架构

### 4.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                    (Next.js 14 + React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Chat UI   │  │Map View  │  │Cards     │  │Charts    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │ HTTPS
        ┌────────────────────┴────────────────────┐
        │                  API Gateway            │
        │              (Express.js / Next.js API) │
        └────────────────────┬────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AI Agent    │    │  External    │    │  Data        │
│  (LangChain) │    │  APIs        │    │  Services    │
│  + OpenAI    │    │  (高德/天气/  │    │  (PostgreSQL │
│              │    │   航班/酒店)  │    │   + Redis)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 4.2 技术栈清单

| 层级     | 技术选型         | 版本     | 说明          |
| ------ | ------------ | ------ | ----------- |
| 前端框架   | Next.js      | 14.x   | App Router  |
| UI 框架  | React        | 18.x   | 组件化开发       |
| 语言     | TypeScript   | 5.x    | 类型安全        |
| 样式     | Tailwind CSS | 3.x    | 原子化 CSS     |
| UI 组件库 | shadcn/ui    | latest | 基于 Radix    |
| 地图 SDK | React-Amap   | 2.x    | 高德地图封装      |
| AI 框架  | LangChain    | 0.1.x  | AI Agent 开发 |
| LLM    | OpenAI GPT-4 | -      | 对话生成        |
| 后端框架   | Express.js   | 4.x    | API 服务      |
| 数据库    | PostgreSQL   | 15.x   | 持久化存储       |
| 缓存     | Redis        | 7.x    | 会话缓存        |
| 天气 API | 和风天气         | -      | 天气预报        |
| 地图 API | 高德地图         | -      | 地图服务        |
| 航班 API | Amadeus      | -      | 航班数据        |
| 酒店 API | 飞猪/Booking   | -      | 酒店数据        |

### 4.3 目录结构
```
travel/
├── src/                                    # Next.js 前端源码
│   ├── app/                                # App Router 页面
│   │   ├── layout.tsx                      # 根布局（全局导航栏 Navbar）
│   │   ├── page.tsx                        # 首页（AI 聊天助手 ChatWindow）
│   │   ├── globals.css                     # 全局样式（Tailwind）
│   │   ├── itinerary/
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # 行程详情页（5 Tab：日程/地图/预算/航班/酒店）
│   │   │       └── map/
│   │   │           └── page.tsx            # 地图全览子页面
│   │   └── profile/
│   │       └── preferences/
│   │           └── page.tsx                # 用户偏好设置页（表单验证）
│   ├── components/                         # React 组件
│   │   ├── ui/                             # 基础 UI 组件
│   │   │   ├── button.tsx                  # Button 组件（@base-ui + CVA）
│   │   │   └── navbar.tsx                  # 全局导航栏组件
│   │   ├── chat/                           # 聊天界面组件
│   │   │   ├── ChatWindow.tsx              # 主聊天窗口（SSE 流式输出 + localStorage 持久化）
│   │   │   ├── MessageBubble.tsx           # 消息气泡（用户/AI 双向 + 打字动画）
│   │   │   ├── ChatInput.tsx               # 输入框（自适应高度 + Enter 发送）
│   │   │   ├── QuickActions.tsx            # 快捷操作按钮（8 个意图入口）
│   │   │   └── index.ts                    # 统一导出
│   │   ├── itinerary/                      # 行程详情组件
│   │   │   ├── ItineraryOverview.tsx       # 行程概览头部（标题/状态/预算摘要）
│   │   │   ├── ScheduleTimeline.tsx        # 日程时间线（活动+餐饮+住宿卡片）
│   │   │   ├── BudgetCard.tsx              # 预算卡片（进度条+超预算警告+明细）
│   │   │   ├── TabNav.tsx                  # Tab 导航组件
│   │   │   └── index.ts                    # 统一导出
│   │   ├── flight/                         # 航班相关组件
│   │   │   ├── FlightCard.tsx              # 航班卡片
│   │   │   ├── FlightPriceComparison.tsx   # 价格对比
│   │   │   ├── FlightSearchPanel.tsx       # 搜索面板
│   │   │   └── index.ts                    # 统一导出
│   │   ├── hotel/                          # 酒店相关组件
│   │   │   ├── HotelCard.tsx               # 酒店卡片
│   │   │   ├── HotelSearchPanel.tsx        # 搜索面板
│   │   │   └── index.ts                    # 统一导出
│   │   └── map/                            # 地图相关组件
│   │       ├── AMapProvider.tsx            # 高德地图 Provider
│   │       ├── MapView.tsx                 # 地图视图容器
│   │       ├── Marker.tsx                  # 标记点组件
│   │       ├── RouteDisplay.tsx            # 路线展示
│   │       └── index.ts                    # 统一导出
│   ├── lib/                                # 工具库与 API 客户端
│   │   ├── api/                            # 后端 API 客户端封装
│   │   │   ├── chat.ts                     # 聊天 API（普通/SSE 流式/意图识别）
│   │   │   ├── itinerary.ts                # 行程 CRUD API
│   │   │   ├── flight.ts                   # 航班查询 API
│   │   │   ├── hotel.ts                    # 酒店查询 API
│   │   │   └── preference.ts               # 用户偏好 API
│   │   └── utils.ts                        # 工具函数（cn 类名合并）
│   └── types/                              # TypeScript 类型定义
│       ├── css.d.ts                        # CSS 模块声明
│       ├── flight.ts                       # 航班类型
│       ├── hotel.ts                        # 酒店类型
│       ├── itinerary.ts                    # 行程类型（Itinerary / DayPlan / Activity 等）
│       ├── map.ts                          # 地图类型（MarkerData / RouteData 等）
│       └── preference.ts                   # 偏好类型（含常量枚举）
├── server/                                 # Express.js 后端服务
│   ├── src/
│   │   ├── index.ts                        # 服务入口
│   │   ├── agent/                          # AI Agent 系统
│   │   │   ├── index.ts                    # TravelAgent 类（chat / chatStream / suggestions）
│   │   │   ├── llm.ts                      # LLM 模型配置（普通/流式/结构化）
│   │   │   ├── intent.ts                   # 意图识别模块（Zod Schema 校验）
│   │   │   ├── itinerary-agent.ts          # 行程规划 Agent
│   │   │   └── prompts/
│   │   │       └── index.ts                # System Prompt 模板
│   │   ├── config/                         # 配置模块
│   │   │   ├── database.ts                 # 数据库连接
│   │   │   ├── redis.ts                    # Redis 连接
│   │   │   └── index.ts                    # 配置统一导出
│   │   ├── controllers/                    # 控制器层
│   │   │   ├── attraction.controller.ts     # 景点控制器
│   │   │   ├── flight.controller.ts         # 航班控制器
│   │   │   ├── hotel.controller.ts          # 酒店控制器
│   │   │   ├── itinerary.controller.ts      # 行程控制器
│   │   │   ├── preference.controller.ts     # 偏好控制器
│   │   │   ├── restaurant.controller.ts     # 餐厅控制器
│   │   │   ├── route.controller.ts          # 路线控制器
│   │   │   ├── user.controller.ts           # 用户控制器
│   │   │   └── weather.controller.ts        # 天气控制器
│   │   ├── routes/                         # API 路由层
│   │   │   ├── index.ts                    # 路由聚合
│   │   │   ├── agent.routes.ts             # Agent 路由（POST chat / chat.stream / intent）
│   │   │   ├── attraction.routes.ts         # 景点路由
│   │   │   ├── flight.routes.ts             # 航班路由
│   │   │   ├── hotel.routes.ts              # 酒店路由
│   │   │   ├── itinerary.routes.ts          # 行程路由（CRUD）
│   │   │   ├── preference.routes.ts         # 偏好路由
│   │   │   ├── restaurant.routes.ts         # 餐厅路由
│   │   │   ├── route.routes.ts              # 路线路由
│   │   │   ├── user.routes.ts               # 用户路由
│   │   │   └── weather.routes.ts            # 天气路由
│   │   ├── services/                       # 业务服务层
│   │   │   └── recommendation.service.ts    # 推荐服务
│   │   ├── lib/                            # 内部工具库
│   │   │   ├── api/                        # 外部 API 封装
│   │   │   │   ├── amap.ts                 # 高德地图 API
│   │   │   │   ├── flight.ts               # 航班数据 API
│   │   │   │   ├── hotel.ts                # 酒店数据 API
│   │   │   │   └── weather.ts              # 天气数据 API
│   │   │   ├── budget/                     # 预算计算
│   │   │   │   └── calculator.ts
│   │   │   ├── optimization/               # 优化算法
│   │   │   │   └── route-optimizer.ts      # 路线优化器
│   │   │   ├── recommendation/             # 推荐引擎
│   │   │   │   ├── attraction-scorer.ts    # 景点评分
│   │   │   │   └── restaurant-scorer.ts    # 餐厅评分
│   │   │   └── utils/                      # 通用工具
│   │   │       ├── budget.ts
│   │   │       ├── distance.ts
│   │   │       ├── format.ts
│   │   │       └── time.ts
│   │   ├── middleware/                      # 中间件
│   │   │   ├── error.middleware.ts         # 错误处理中间件
│   │   │   ├── request.middleware.ts       # 请求处理中间件
│   │   │   └── index.ts
│   │   └── types/                          # 后端类型定义
│   │       ├── attraction.ts
│   │       ├── budget.ts
│   │       ├── common.ts
│   │       ├── flight.ts
│   │       ├── hotel.ts
│   │       ├── itinerary.ts
│   │       ├── restaurant.ts
│   │       ├── route.ts
│   │       └── weather.ts
│   ├── prisma/                              # 数据库 ORM
│   │   ├── schema.prisma                    # 数据模型定义
│   │   └── migrations/                      # 迁移文件
│   ├── .env.example                         # 环境变量模板
│   ├── package.json
│   └── tsconfig.json
├── public/                                  # 静态资源
├── .eslintrc.json                           # ESLint 配置
├── .prettierrc                              # Prettier 配置
├── components.json                          # shadcn/ui 配置
├── docker-compose.yml                       # Docker 编排
├── next.config.mjs                          # Next.js 配置
├── postcss.config.mjs                       # PostCSS 配置
├── tailwind.config.ts                       # Tailwind CSS 配置
├── tsconfig.json                            # TypeScript 配置
└── package.json                             # 项目依赖
```

***

## 5. 验收标准

### 5.1 功能验收

| 功能   | 验收条件           | 测试方法          |
| ---- | -------------- | ------------- |
| 天气查询 | 输入城市返回7天预报     | 输入"东京天气如何"    |
| 行程生成 | 输入目的地和天数生成完整行程 | 输入"去东京5天"     |
| 景点推荐 | 根据偏好推荐3个以上景点   | 设置预算后查询景点     |
| 餐厅推荐 | 显示人均价格和评分      | 输入"东京餐厅推荐"    |
| 预算计算 | 自动计算并显示分项费用    | 创建行程后查看预算     |
| 机票展示 | 显示价格和时间（不跳转）   | 输入"东京航班"      |
| 酒店展示 | 显示价格和评分（不跳转）   | 输入"东京酒店"      |
| 地图展示 | 显示景点标记和路线      | 行程详情页查看地图     |
| 日程表  | 显示每日时间安排       | 行程详情页切换日程 Tab |
| 偏好设置 | 保存并应用用户偏好      | 设置后验证推荐结果     |

### 5.2 性能指标

| 指标     | 要求      | 说明         |
| ------ | ------- | ---------- |
| 首屏加载   | < 3s    | LCP < 3.0s |
| API 响应 | < 5s    | AI 生成可能较慢  |
| 地图加载   | < 2s    | 地图瓦片加载完成   |
| 交互响应   | < 100ms | 按钮点击反馈     |

### 5.3 兼容性要求

| 平台      | 最低版本                 |
| ------- | -------------------- |
| Chrome  | 90+                  |
| Safari  | 14+                  |
| Firefox | 88+                  |
| Edge    | 90+                  |
| 移动端     | iOS 14+, Android 10+ |

### 5.4 可用性要求

* 所有交互元素有明显hover/active状态

* 地图支持触屏拖拽和缩放

* 行程卡片支持点击展开详情

* 聊天消息支持复制和分享

* 支持键盘导航（Tab 顺序）

