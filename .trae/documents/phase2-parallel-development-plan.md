# 第二阶段并行开发计划

## 一、并行可行性分析

### 1.1 当前项目状态

**已完成部分：**
- ✅ 数据库模型设计（Itinerary, Activity, Meal, Accommodation, Flight, Hotel等）
- ✅ 后端路由框架搭建
- ✅ AI Agent基础框架
- ✅ 意图识别模块
- ✅ 用户偏好系统（2.1模块）

**剩余任务概览：**
- 2.2 天气预测模块（4个任务）
- 2.3 行程路线规划模块（6个任务）
- 2.4 景点推荐模块（5个任务）
- 2.5 餐厅推荐模块（4个任务）
- 2.6 预算规划模块（4个任务）

### 1.2 并行可行性结论

**✅ 可以多任务并行开发！**

根据技术架构分析，第二阶段的剩余任务可以分为**三个并行开发层级**，每个层级内的任务可以同时进行。

---

## 二、并行开发策略

### 2.1 任务分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    第一层：基础设施层                         │
│  （完全独立，可同时开发）                                      │
├─────────────────────────────────────────────────────────────┤
│  任务A: 天气API接入      任务B: 景点API接入                   │
│  任务C: 餐厅API接入      任务D: 地图路径API                   │
│  任务E: 数据结构定义     任务F: 工具函数开发                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    第二层：业务逻辑层                         │
│  （部分依赖第一层，可并行开发）                                │
├─────────────────────────────────────────────────────────────┤
│  任务G: AI行程生成Agent  任务H: 景点推荐逻辑                  │
│  任务I: 餐厅推荐逻辑     任务J: 路线优化算法                  │
│  任务K: 预算计算算法                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    第三层：前端组件层                         │
│  （可与第一、二层并行开发）                                    │
├─────────────────────────────────────────────────────────────┤
│  任务L: WeatherWidget   任务M: ItineraryCard                │
│  任务N: ScheduleTimeline 任务O: BudgetCard                  │
│  任务P: 景点卡片组件     任务Q: 餐厅卡片组件                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 并行开发矩阵

| 开发者 | 第一层任务 | 第二层任务 | 第三层任务 |
|--------|-----------|-----------|-----------|
| 开发者1 | 天气API + 数据结构 | AI行程Agent | WeatherWidget |
| 开发者2 | 景点API + 地图API | 景点推荐逻辑 | ItineraryCard + 景点卡片 |
| 开发者3 | 餐厅API | 餐厅推荐逻辑 | 餐厅卡片 |
| 开发者4 | 工具函数 | 路线优化 + 预算算法 | ScheduleTimeline + BudgetCard |

---

## 三、详细任务分解

### 3.1 第一层：基础设施层（可完全并行）

#### 任务A：天气模块基础设施
**文件清单：**
- `server/src/services/weather.service.ts` - 天气API服务
- `server/src/lib/api/weather.ts` - 和风天气API封装
- `server/src/types/weather.ts` - 天气数据类型定义
- `server/src/routes/weather.routes.ts` - 天气路由实现

**技术要点：**
- 接入和风天气API（需要申请API Key）
- 实现未来7天天气预报查询
- 实现天气数据缓存（Redis）
- 定义WeatherInfo接口

**预估时间：** 4小时

---

#### 任务B：景点模块基础设施
**文件清单：**
- `server/src/services/attraction.service.ts` - 景点服务
- `server/src/lib/api/amap.ts` - 高德地图API封装
- `server/src/types/attraction.ts` - 景点数据类型定义
- `server/src/routes/attraction.routes.ts` - 景点路由实现

**技术要点：**
- 接入高德地图POI搜索API
- 实现景点搜索、详情查询
- 定义Attraction接口（包含评分、价格、开放时间等）
- 实现景点数据缓存

**预估时间：** 5小时

---

#### 任务C：餐厅模块基础设施
**文件清单：**
- `server/src/services/restaurant.service.ts` - 餐厅服务
- `server/src/types/restaurant.ts` - 餐厅数据类型定义
- `server/src/routes/restaurant.routes.ts` - 餐厅路由实现

**技术要点：**
- 复用高德地图POI API（餐饮类）
- 实现餐厅搜索、筛选
- 定义Restaurant接口（包含人均消费、菜系、评分等）
- 实现基于位置的餐厅推荐

**预估时间：** 4小时

---

#### 任务D：地图路径规划基础设施
**文件清单：**
- `server/src/lib/api/route.ts` - 路径规划API封装
- `server/src/services/route.service.ts` - 路线服务
- `server/src/types/route.ts` - 路线数据类型定义

**技术要点：**
- 接入高德地图路径规划API
- 实现多点路径规划
- 计算距离和时长
- 支持多种交通方式（步行、驾车、公交）

**预估时间：** 4小时

---

#### 任务E：数据结构定义
**文件清单：**
- `server/src/types/itinerary.ts` - 行程数据结构
- `server/src/types/budget.ts` - 预算数据结构
- `server/src/types/common.ts` - 通用数据结构

**技术要点：**
- 完善Itinerary接口（参考spec.md）
- 定义BudgetSummary接口
- 定义通用的Location、TimeSlot等接口
- 确保类型定义与数据库模型一致

**预估时间：** 2小时

---

#### 任务F：工具函数开发
**文件清单：**
- `server/src/lib/utils/distance.ts` - 距离计算工具
- `server/src/lib/utils/time.ts` - 时间处理工具
- `server/src/lib/utils/budget.ts` - 预算计算工具
- `server/src/lib/utils/format.ts` - 格式化工具

**技术要点：**
- 实现经纬度距离计算（Haversine公式）
- 实现时间格式化、时区处理
- 实现费用累加、货币转换
- 实现地址、电话格式化

**预估时间：** 3小时

---

### 3.2 第二层：业务逻辑层（部分并行）

#### 任务G：AI行程生成Agent
**文件清单：**
- `server/src/agent/itinerary-agent.ts` - 行程生成Agent
- `server/src/agent/prompts/itinerary-prompt.ts` - 行程生成Prompt
- `server/src/services/itinerary.service.ts` - 行程服务

**技术要点：**
- 基于LangChain实现行程生成Agent
- 集成景点、餐厅、天气数据
- 实现多日行程规划逻辑
- 支持用户偏好应用
- 实现行程持久化

**依赖：** 任务A、B、C（需要天气、景点、餐厅数据）

**预估时间：** 8小时

---

#### 任务H：景点推荐逻辑
**文件清单：**
- `server/src/services/recommendation.service.ts` - 推荐服务（已存在，需扩展）
- `server/src/lib/recommendation/attraction-scorer.ts` - 景点评分算法

**技术要点：**
- 实现基于偏好的景点筛选
- 实现景点评分排序算法
- 考虑因素：预算、兴趣、距离、评分、开放时间
- 实现个性化推荐权重

**依赖：** 任务B（景点数据）

**预估时间：** 5小时

---

#### 任务I：餐厅推荐逻辑
**文件清单：**
- `server/src/services/recommendation.service.ts` - 推荐服务（扩展）
- `server/src/lib/recommendation/restaurant-scorer.ts` - 餐厅评分算法

**技术要点：**
- 实现基于位置和价位的筛选
- 实现餐厅评分排序
- 考虑因素：距离、价位、菜系、评分、营业时间
- 实现与行程的关联推荐

**依赖：** 任务C（餐厅数据）

**预估时间：** 4小时

---

#### 任务J：路线优化算法
**文件清单：**
- `server/src/lib/optimization/route-optimizer.ts` - 路线优化算法
- `server/src/lib/optimization/tsp-solver.ts` - TSP问题求解器

**技术要点：**
- 实现基于地理位置的景点排序
- 使用贪心算法或模拟退火算法
- 考虑交通时间和游玩时长
- 支持多种交通方式优化

**依赖：** 任务D（路径规划API）

**预估时间：** 6小时

---

#### 任务K：预算计算算法
**文件清单：**
- `server/src/lib/budget/calculator.ts` - 预算计算器
- `server/src/lib/budget/estimator.ts` - 费用估算器

**技术要点：**
- 实现分项费用计算（交通、住宿、餐饮、景点、其他）
- 实现预算超标检测
- 实现费用优化建议
- 支持多人预算分摊

**依赖：** 任务A、B、C（需要各项费用数据）

**预估时间：** 5小时

---

### 3.3 第三层：前端组件层（可与前两层并行）

#### 任务L：WeatherWidget组件
**文件清单：**
- `src/components/weather/WeatherWidget.tsx` - 天气组件
- `src/components/weather/WeatherIcon.tsx` - 天气图标
- `src/lib/api/weather.ts` - 天气API调用

**技术要点：**
- 显示未来7天天气预报
- 显示温度、天气状况、穿衣建议
- 实现天气图标映射
- 支持折叠/展开

**预估时间：** 4小时

---

#### 任务M：ItineraryCard组件
**文件清单：**
- `src/components/itinerary/ItineraryCard.tsx` - 行程卡片
- `src/components/itinerary/ActivityItem.tsx` - 活动项组件

**技术要点：**
- 显示单日行程概览
- 显示景点、餐厅、交通信息
- 支持点击展开详情
- 显示时间和费用

**预估时间：** 5小时

---

#### 任务N：ScheduleTimeline组件
**文件清单：**
- `src/components/itinerary/ScheduleTimeline.tsx` - 时间线组件
- `src/components/itinerary/TimelineItem.tsx` - 时间线项

**技术要点：**
- 显示全天时间安排
- 时间轴可视化
- 支持拖拽调整时间
- 显示交通时间

**预估时间：** 6小时

---

#### 任务O：BudgetCard组件
**文件清单：**
- `src/components/budget/BudgetCard.tsx` - 预算卡片
- `src/components/budget/BudgetChart.tsx` - 预算图表

**技术要点：**
- 显示预算概览
- 分项费用展示（饼图或条形图）
- 预算超标提醒
- 支持费用明细查看

**预估时间：** 5小时

---

#### 任务P：景点卡片组件
**文件清单：**
- `src/components/attraction/AttractionCard.tsx` - 景点卡片
- `src/components/attraction/AttractionList.tsx` - 景点列表

**技术要点：**
- 显示景点图片、名称、评分
- 显示门票价格、开放时间
- 支持收藏功能
- 显示在地图上的位置

**预估时间：** 4小时

---

#### 任务Q：餐厅卡片组件
**文件清单：**
- `src/components/restaurant/RestaurantCard.tsx` - 餐厅卡片
- `src/components/restaurant/RestaurantList.tsx` - 餐厅列表

**技术要点：**
- 显示餐厅图片、名称、评分
- 显示人均消费、菜系
- 显示营业时间、距离
- 支持收藏功能

**预估时间：** 4小时

---

## 四、并行执行方案

### 4.1 方案一：4人并行（推荐）

**时间线：** 总计约 2-3 天

```
Day 1 (8小时)
├─ 开发者1: 任务A(天气) + 任务E(数据结构)           [4h + 2h]
├─ 开发者2: 任务B(景点) + 任务D(地图)               [5h + 4h]
├─ 开发者3: 任务C(餐厅) + 任务F(工具函数)           [4h + 3h]
└─ 开发者4: 任务L(WeatherWidget) + 任务P(景点卡片)  [4h + 4h]

Day 2 (8小时)
├─ 开发者1: 任务G(AI行程Agent)                      [8h]
├─ 开发者2: 任务H(景点推荐) + 任务J(路线优化)       [5h + 6h]
├─ 开发者3: 任务I(餐厅推荐) + 任务K(预算算法)       [4h + 5h]
└─ 开发者4: 任务M(ItineraryCard) + 任务Q(餐厅卡片)  [5h + 4h]

Day 3 (8小时)
├─ 开发者1: 任务N(ScheduleTimeline)                 [6h]
├─ 开发者2: 集成测试 + API联调                      [8h]
├─ 开发者3: 任务O(BudgetCard)                       [5h]
└─ 开发者4: 前端集成 + 样式调整                     [8h]
```

### 4.2 方案二：2人并行

**时间线：** 总计约 5-6 天

```
Day 1-2: 第一层基础设施
├─ 开发者1: 任务A + B + E (天气、景点、数据结构)    [11h]
└─ 开发者2: 任务C + D + F (餐厅、地图、工具函数)    [11h]

Day 3-4: 第二层业务逻辑
├─ 开发者1: 任务G + H + J (AI Agent、景点推荐、路线优化) [19h]
└─ 开发者2: 任务I + K (餐厅推荐、预算算法)          [9h]

Day 5-6: 第三层前端组件
├─ 开发者1: 任务L + M + N (天气、行程卡片、时间线)  [15h]
└─ 开发者2: 任务O + P + Q (预算、景点、餐厅卡片)    [13h]
```

### 4.3 方案三：单人开发

**时间线：** 总计约 10-12 天

按层级顺序开发，每层内部可并行的小任务可穿插进行。

---

## 五、关键技术决策

### 5.1 API Key管理

**需要申请的API Key：**
1. **和风天气API** - https://dev.qweather.com/
   - 免费版：1000次/天
   - 需要申请Key并配置到环境变量

2. **高德地图API** - https://lbs.amap.com/
   - Web服务API（后端使用）
   - JS API（前端使用）
   - 免费版：配额充足

**环境变量配置：**
```env
# server/.env
QWEATHER_API_KEY=your_key_here
AMAP_API_KEY=your_key_here
AMAP_WEB_KEY=your_web_key_here
```

### 5.2 数据缓存策略

**Redis缓存设计：**
```
weather:{city}:{date}        → 天气数据（TTL: 3小时）
attractions:{city}:{page}    → 景点列表（TTL: 24小时）
attraction:{id}              → 景点详情（TTL: 7天）
restaurants:{location}:{page} → 餐厅列表（TTL: 24小时）
restaurant:{id}              → 餐厅详情（TTL: 7天）
route:{hash}                 → 路线数据（TTL: 24小时）
```

### 5.3 错误处理

**统一错误处理：**
- API调用失败：返回降级数据或错误提示
- 数据解析失败：记录日志，返回默认值
- 网络超时：设置合理超时时间，支持重试

### 5.4 测试策略

**单元测试：**
- 工具函数测试（距离计算、时间处理、预算计算）
- API封装测试（Mock外部API）
- 推荐算法测试

**集成测试：**
- API端点测试
- 数据库操作测试
- Agent对话测试

---

## 六、风险与应对

### 6.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| API Key申请延迟 | 阻塞开发 | 先用Mock数据开发，后续替换真实API |
| API调用限制 | 功能受限 | 实现缓存策略，减少重复调用 |
| AI生成质量不稳定 | 用户体验差 | 优化Prompt，添加结果验证 |
| 地图加载慢 | 性能问题 | 实现懒加载，优化地图配置 |

### 6.2 依赖风险

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 任务G依赖A/B/C | 延迟 | 并行开发时优先完成A/B/C |
| 前端组件依赖后端API | 阻塞 | 先定义接口规范，并行开发 |
| 数据库模型变更 | 影响多个模块 | 提前锁定数据模型，减少变更 |

---

## 七、验收标准

### 7.1 功能验收

- [ ] 天气查询：输入城市返回7天预报
- [ ] 行程生成：输入目的地和天数生成完整行程
- [ ] 景点推荐：根据偏好推荐景点并排序
- [ ] 餐厅推荐：显示人均价格和评分
- [ ] 预算计算：自动计算并显示分项费用
- [ ] 路线优化：景点顺序合理，减少往返

### 7.2 性能验收

- [ ] API响应时间 < 5秒
- [ ] 天气查询支持缓存
- [ ] 地图加载 < 2秒
- [ ] 前端组件渲染流畅

### 7.3 代码质量

- [ ] TypeScript类型完整
- [ ] 错误处理完善
- [ ] 代码注释清晰
- [ ] 遵循项目代码规范

---

## 八、后续优化方向

完成第二阶段后，可以考虑：

1. **性能优化**
   - 实现API请求合并
   - 优化数据库查询
   - 前端代码分割

2. **功能增强**
   - 支持行程导出（PDF、图片）
   - 支持行程分享
   - 支持多语言

3. **用户体验**
   - 添加加载动画
   - 优化移动端适配
   - 添加操作引导

---

## 九、总结

**并行开发可行性：✅ 完全可行**

**推荐方案：** 4人并行，2-3天完成

**关键成功因素：**
1. 提前申请API Key
2. 明确接口规范，前后端并行开发
3. 优先完成基础设施层任务
4. 做好任务依赖管理
5. 保持代码质量和沟通协作
