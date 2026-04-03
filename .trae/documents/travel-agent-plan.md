# 旅游规划 AI Agent 实施计划

## 项目概述
个人旅行者使用的旅游规划 AI Agent，提供天气预测、行程路线规划、景点餐厅推荐、预算规划、航班酒店价格展示，通过网页聊天界面交互。

---

## 一、技术架构设计

### 1.1 前端
- **框架**：Next.js 14 (App Router) + TypeScript
- **UI 组件**：Tailwind CSS + shadcn/ui
- **地图组件**：高德地图 Web JS SDK / React-Amap
- **聊天界面**：基于 ChatUI 定制

### 1.2 后端
- **框架**：Node.js + Express / Fastify
- **AI 能力**：LangChain + OpenAI GPT-4
- **数据库**：PostgreSQL (用户数据) + Redis (会话缓存)

### 1.3 外部 API 集成
- **地图服务**：高德地图 API (路径规划、地理编码)
- **天气数据**：和风天气 / 墨迹天气 API
- **航班数据**：去哪儿网 API / 携程 API (或第三方聚合如 Amadeus)
- **酒店数据**：Booking.com API / 飞猪 API

---

## 二、功能模块规划

### 2.1 天气预测模块
- 获取目的地未来 7 天天气预报
- 显示温度、天气状况、穿衣建议
- 根据天气推荐行程安排

### 2.2 行程路线规划模块
- 输入：目的地、出行日期、天数、同行人数
- AI 生成：每日行程时间表（包含预留时间）
- 输出：详细行程单（含景点游玩时长、交通时间）

### 2.3 景点推荐模块
- 基于用户偏好（预算、兴趣类型）推荐景点
- 显示门票价格、开放时间、评分
- 支持用户调整和增删景点

### 2.4 餐厅推荐模块
- 基于位置和价位推荐餐厅
- 显示人均消费、评分、菜系类型
- 支持预订链接跳转

### 2.5 预算规划模块
- 自动估算总费用（交通、住宿、餐饮、门票）
- 分项目明细展示
- 支持预算超标提醒

### 2.6 机票酒店价格展示模块
- 航班查询：显示价格、时间、航空公司（不提供预订）
- 酒店查询：显示价格、星级、评分（不提供预订）
- 价格对比展示

---

## 三、数据流设计

### 3.1 用户输入流程
```
用户输入 → Chat Interface → LangChain Agent → 意图识别
    ↓
意图分类：
- 行程规划 → 调用行程模块
- 天气查询 → 调用天气 API
- 景点推荐 → 调用推荐模块
- 预算查询 → 调用预算模块
- 机票酒店 → 调用第三方 API
```

### 3.2 输出展示流程
```
AI 生成内容 → 格式化处理 → 输出适配器
    ↓
渲染为：
- 行程卡片（JSON 结构化数据）
- 地图可视化（高德地图）
- 日程表（时间线组件）
```

---

## 四、用户偏好系统

### 4.1 偏好数据模型
```typescript
interface UserPreference {
  budgetRange: { min: number; max: number };  // 预算范围
  travelerCount: number;                       // 出行人数
  dietaryRestrictions?: string[];             // 饮食限制
  accessibilityNeeds?: boolean;               // 无障碍需求
  preferredTransportation?: string;           // 交通偏好
  travelStyle?: string;                       // 旅行风格（休闲/紧凑）
}
```

### 4.2 偏好持久化
- 首次使用：引导用户设置偏好
- 后续使用：自动记忆用户偏好
- 支持随时修改

---

## 五、页面与组件设计

### 5.1 页面结构

```
/                        → 首页（AI 聊天助手 ChatWindow）
/profile/preferences     → 用户偏好设置页（表单验证 + 重置）
/itinerary/:id           → 行程详情页（5 Tab：日程 / 地图 / 预算 / 航班 / 酒店）
/itinerary/:id/map       → 地图全览子页面
```

**顶部导航栏（Navbar）：**

| 路径 | 名称 | 说明 |
|------|------|------|
| `/` | AI 助手 | 首页，AI 对话界面 |
| `/profile/preferences` | 偏好设置 | 旅行偏好配置表单 |

**行程详情页 Tab 子导航：**

| Tab | 名称 | 内容组件 |
|-----|------|---------|
| schedule | 日程安排 | ScheduleTimeline 时间线 |
| map | 地图视图 | MapView 地图 + 地点列表 |
| budget | 费用预算 | BudgetCard 预算卡片 |
| flights | 航班信息 | FlightSearchPanel 搜索面板 |
| hotels | 酒店推荐 | HotelSearchPanel 搜索面板 |

### 5.2 核心组件
- `ChatWindow` - 聊天窗口
- `MessageBubble` - 消息气泡
- `ItineraryCard` - 行程卡片
- `MapVisualization` - 地图可视化组件
- `ScheduleTimeline` - 日程时间线
- `WeatherWidget` - 天气组件
- `PriceDisplay` - 价格展示卡片

---

## 六、实施步骤

### 第一阶段：基础架构 (第 1-2 周)
1. 初始化 Next.js 项目，配置 TypeScript + Tailwind CSS
2. 搭建后端 Express 服务，配置 PostgreSQL + Redis
3. 集成 LangChain + OpenAI
4. 实现基础聊天界面框架

### 第二阶段：核心功能 (第 3-5 周)
1. 开发天气预测模块，接入天气 API
2. 开发行程规划模块，AI 生成行程
3. 开发景点餐厅推荐模块
4. 开发预算规划模块
5. 实现偏好系统

### 第三阶段：可视化与外部 API (第 6-8 周)
1. 集成高德地图 SDK，实现地图展示
2. 接入航班 API，实现价格查询
3. 接入酒店 API，实现价格查询
4. 开发行程卡片和日程表组件
5. 优化地图路线可视化

### 第四阶段：测试与优化 (第 9-10 周)
1. 功能测试与 Bug 修复
2. UI/UX 优化
3. 性能优化
4. 部署上线

---

## 七、技术栈清单

| 类别 | 技术选型 |
|------|---------|
| 前端框架 | Next.js 14, React 18 |
| 样式方案 | Tailwind CSS, shadcn/ui |
| 地图服务 | 高德地图 Web JS SDK |
| AI 框架 | LangChain, OpenAI GPT-4 |
| 后端框架 | Express.js |
| 数据库 | PostgreSQL, Redis |
| 天气 API | 和风天气 / 墨迹天气 |
| 航班 API | 去哪儿/携程/Amadeus |
| 酒店 API | 飞猪/Booking |

---

## 八、非功能性要求

- **响应速度**：API 响应 < 3 秒
- **准确性**：行程规划基于实时数据
- **易用性**：无需培训即可上手
- **可扩展性**：模块化设计，便于后续功能扩展
