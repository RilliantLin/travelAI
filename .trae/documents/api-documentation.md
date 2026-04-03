# 旅游规划 AI Agent API 文档

**版本**: 1.0.0  
**基础URL**: `http://localhost:3001`  
**文档更新日期**: 2026-04-03

---

## 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [认证](#认证)
4. [通用说明](#通用说明)
5. [API端点](#api端点)
   - [健康检查](#健康检查)
   - [天气API](#天气-api)
   - [景点API](#景点-api)
   - [餐厅API](#餐厅-api)
   - [路线规划API](#路线规划-api)
   - [行程API](#行程-api)
   - [用户API](#用户-api)
   - [偏好API](#偏好-api)
6. [错误处理](#错误处理)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## 概述

旅游规划 AI Agent API 是一个智能旅游规划系统的后端服务，提供以下核心功能：

- **智能行程生成**: 基于AI生成个性化旅游行程
- **景点推荐**: 根据位置和偏好推荐景点
- **餐厅推荐**: 推荐附近的优质餐厅
- **天气查询**: 提供实时天气和天气预报
- **路线规划**: 支持多种交通方式的路线规划
- **预算管理**: 自动计算和优化旅行预算

### 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **AI**: 智谱AI (LangChain)
- **外部API**: 高德地图、和风天气

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- npm 或 yarn

### 安装和运行

```bash
# 克隆项目
cd travel/server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的API密钥

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

### 验证安装

```bash
# 健康检查
curl http://localhost:3001/health

# API信息
curl http://localhost:3001/api
```

---

## 认证

当前版本API暂不需要认证。未来版本将支持：

- JWT Token认证
- API Key认证
- OAuth 2.0

---

## 通用说明

### 响应格式

所有API响应均采用JSON格式，包含以下字段：

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 时间格式

所有时间字段均采用 ISO 8601 格式：

```
2024-04-03T10:30:00.000Z
```

### 坐标格式

坐标采用高德地图标准（GCJ-02坐标系）：

```json
{
  "lat": 39.909187,
  "lng": 116.397463,
  "address": "北京市东城区天安门"
}
```

---

## API端点

### 健康检查

#### GET /health

检查服务器运行状态。

**请求示例**:
```bash
curl http://localhost:3001/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T09:58:08.420Z"
}
```

#### GET /api

获取API基本信息和可用端点。

**请求示例**:
```bash
curl http://localhost:3001/api
```

**响应示例**:
```json
{
  "message": "旅游规划 AI Agent API",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "itineraries": "/api/itineraries",
    "weather": "/api/weather",
    "attractions": "/api/attractions",
    "restaurants": "/api/restaurants",
    "flights": "/api/flights",
    "hotels": "/api/hotels",
    "agent": "/api/agent"
  }
}
```

---

### 天气 API

天气API提供实时天气和天气预报查询功能。

#### GET /api/weather/current

获取当前天气信息。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | 是 | 城市名称或Location ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/weather/current?location=北京"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "date": "2026-04-03",
    "location": {
      "lat": 39.9042,
      "lng": 116.4074,
      "address": "北京"
    },
    "condition": {
      "code": "100",
      "text": "晴",
      "icon": "100"
    },
    "temperature": {
      "value": 18,
      "unit": "°C",
      "min": 12,
      "max": 22
    },
    "humidity": "45",
    "wind": {
      "speed": "15",
      "direction": "东北风",
      "scale": "3"
    },
    "visibility": "10",
    "pressure": "1015"
  }
}
```

#### GET /api/weather/forecast

获取天气预报。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | 是 | 城市名称或Location ID |
| days | number | 否 | 预报天数（1-15天），默认7天 |

**请求示例**:
```bash
curl "http://localhost:3001/api/weather/forecast?location=北京&days=7"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "location": {
      "lat": 39.9042,
      "lng": 116.4074,
      "address": "北京"
    },
    "forecast": [
      {
        "date": "2026-04-03",
        "week": "周五",
        "conditionDay": {
          "code": "100",
          "text": "晴",
          "icon": "100"
        },
        "conditionNight": {
          "code": "101",
          "text": "多云",
          "icon": "101"
        },
        "temperature": {
          "min": 12,
          "max": 22,
          "unit": "°C"
        },
        "humidity": "45",
        "wind": {
          "speed": "15",
          "direction": "东北风",
          "scale": "3"
        },
        "sunrise": "06:15",
        "sunset": "18:30",
        "uvIndex": "5"
      }
    ],
    "updateTime": "2026-04-03T10:00:00.000Z"
  }
}
```

#### GET /api/weather/:location/:date

获取指定日期的天气。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| location | string | 城市名称 |
| date | string | 日期（YYYY-MM-DD） |

**请求示例**:
```bash
curl "http://localhost:3001/api/weather/北京/2026-04-10"
```

---

### 景点 API

景点API提供景点搜索、详情查询和推荐功能。

#### GET /api/attractions/search

搜索景点。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | 是 | 中心点坐标（lng,lat格式）或城市名 |
| keywords | string | 否 | 搜索关键词，默认"景点" |
| radius | number | 否 | 搜索半径（米），默认无限制 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**请求示例**:
```bash
curl "http://localhost:3001/api/attractions/search?location=116.397428,39.90923&keywords=故宫"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "attractions": [
      {
        "id": "B000A8UIN8",
        "name": "故宫博物院",
        "location": {
          "lat": 39.9163,
          "lng": 116.3972,
          "address": "北京市东城区景山前街4号",
          "city": "北京市",
          "province": "北京市"
        },
        "category": "风景名胜;风景名胜相关;旅游景点",
        "rating": {
          "score": 4.8,
          "count": 12580
        },
        "images": [
          {
            "url": "https://example.com/image1.jpg"
          }
        ],
        "distance": 500
      }
    ],
    "total": 303,
    "hasMore": true
  }
}
```

#### GET /api/attractions/location

根据坐标获取附近景点。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | number | 是 | 纬度 |
| lng | number | 是 | 经度 |
| radius | number | 否 | 搜索半径（米），默认5000 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**请求示例**:
```bash
curl "http://localhost:3001/api/attractions/location?lat=39.9042&lng=116.4074&radius=5000"
```

#### GET /api/attractions/:id

获取景点详情。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 景点ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/attractions/B000A8UIN8"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "B000A8UIN8",
    "name": "故宫博物院",
    "location": {
      "lat": 39.9163,
      "lng": 116.3972,
      "address": "北京市东城区景山前街4号",
      "city": "北京市",
      "province": "北京市"
    },
    "description": "故宫博物院是中国明清两代的皇家宫殿...",
    "category": "风景名胜;风景名胜相关;旅游景点",
    "rating": {
      "score": 4.8,
      "count": 12580
    },
    "price": {
      "amount": 60,
      "currency": "CNY"
    },
    "images": [
      {
        "url": "https://example.com/image1.jpg"
      }
    ],
    "contact": {
      "phone": "010-85007421"
    }
  }
}
```

---

### 餐厅 API

餐厅API提供餐厅搜索和推荐功能。

#### GET /api/restaurants/search

搜索餐厅。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | 是 | 中心点坐标（lng,lat格式）或城市名 |
| keywords | string | 否 | 搜索关键词，默认"餐厅" |
| radius | number | 否 | 搜索半径（米），默认无限制 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**请求示例**:
```bash
curl "http://localhost:3001/api/restaurants/search?location=116.397428,39.90923&keywords=火锅"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "id": "B0FFKJQJ8J",
        "name": "海底捞火锅(王府井店)",
        "location": {
          "lat": 39.9123,
          "lng": 116.4089,
          "address": "北京市东城区王府井大街255号",
          "city": "北京市",
          "province": "北京市"
        },
        "cuisine": "火锅",
        "priceLevel": 3,
        "rating": {
          "score": 4.7,
          "count": 3560
        },
        "images": [
          {
            "url": "https://example.com/image1.jpg"
          }
        ],
        "distance": 300
      }
    ],
    "total": 156,
    "hasMore": true
  }
}
```

#### GET /api/restaurants/location

根据坐标获取附近餐厅。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | number | 是 | 纬度 |
| lng | number | 是 | 经度 |
| radius | number | 否 | 搜索半径（米），默认3000 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**请求示例**:
```bash
curl "http://localhost:3001/api/restaurants/location?lat=39.9042&lng=116.4074&radius=3000"
```

#### GET /api/restaurants/:id

获取餐厅详情。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 餐厅ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/restaurants/B0FFKJQJ8J"
```

---

### 路线规划 API

路线规划API提供路径规划、距离计算和地理编码功能。

#### GET /api/routes/plan

规划路线。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| origin | string | 是 | 起点坐标（lng,lat格式） |
| destination | string | 是 | 终点坐标（lng,lat格式） |
| mode | string | 否 | 交通方式：driving/walking/transit/bicycling，默认driving |

**请求示例**:
```bash
curl "http://localhost:3001/api/routes/plan?origin=116.4074,39.9042&destination=116.3972,39.9163&mode=walking"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "route-0",
        "mode": "walking",
        "distance": 1500,
        "duration": 1200,
        "legs": [
          {
            "start": {
              "location": {
                "lat": 39.9042,
                "lng": 116.4074,
                "address": ""
              },
              "name": "起点",
              "type": "start"
            },
            "end": {
              "location": {
                "lat": 39.9163,
                "lng": 116.3972,
                "address": ""
              },
              "name": "终点",
              "type": "end"
            },
            "distance": 1500,
            "duration": 1200,
            "steps": [
              {
                "instruction": "向北步行100米",
                "distance": 100,
                "duration": 80,
                "road": "王府井大街"
              }
            ]
          }
        ]
      }
    ],
    "origin": {
      "lat": 39.9042,
      "lng": 116.4074,
      "address": ""
    },
    "destination": {
      "lat": 39.9163,
      "lng": 116.3972,
      "address": ""
    }
  }
}
```

#### GET /api/routes/distance

计算多点距离。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| origins | string | 是 | 起点坐标（多个用\|分隔） |
| destination | string | 是 | 终点坐标 |
| type | string | 否 | 距离类型：0-直线/1-驾车/3-步行，默认0 |

**请求示例**:
```bash
curl "http://localhost:3001/api/routes/distance?origins=116.4074,39.9042|116.3972,39.9163&destination=116.4089,39.9123&type=1"
```

#### GET /api/routes/geocode

地理编码（地址转坐标）。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| address | string | 是 | 地址文本 |

**请求示例**:
```bash
curl "http://localhost:3001/api/routes/geocode?address=北京市天安门"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "lat": 39.909187,
    "lng": 116.397463
  }
}
```

---

### 行程 API

行程API提供行程创建、查询、更新和删除功能。

#### POST /api/itineraries

创建新行程（AI生成）。

**请求体**:
```json
{
  "destination": "北京",
  "startDate": "2024-04-10",
  "endDate": "2024-04-12",
  "title": "北京三日游",
  "description": "文化历史之旅",
  "userId": "user-001",
  "preferences": {
    "budgetMin": 1000,
    "budgetMax": 5000,
    "travelStyle": "moderate",
    "interests": ["历史", "文化", "美食"],
    "wakeUpTime": "08:00",
    "sleepTime": "22:00"
  }
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3001/api/itineraries \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "北京",
    "startDate": "2024-04-10",
    "endDate": "2024-04-12",
    "title": "北京三日游",
    "userId": "user-001"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "itinerary-001",
    "userId": "user-001",
    "title": "北京三日游",
    "destination": "北京",
    "startDate": "2024-04-10",
    "endDate": "2024-04-12",
    "totalDays": 3,
    "status": "draft",
    "days": [
      {
        "dayNumber": 1,
        "date": "2024-04-10",
        "summary": "故宫-天安门-王府井",
        "activities": [
          {
            "id": "activity-001",
            "type": "attraction",
            "name": "故宫博物院",
            "location": {
              "lat": 39.9163,
              "lng": 116.3972,
              "address": "北京市东城区景山前街4号"
            },
            "startTime": "09:00",
            "endTime": "12:00",
            "duration": 180,
            "estimatedCost": 60,
            "rating": 4.8
          }
        ],
        "meals": [
          {
            "id": "meal-001",
            "type": "lunch",
            "name": "全聚德烤鸭店",
            "location": {
              "lat": 39.8992,
              "lng": 116.4042,
              "address": "北京市东城区前门大街30号"
            },
            "time": "12:30",
            "duration": 60,
            "estimatedCost": 150
          }
        ]
      }
    ],
    "budget": {
      "total": 3500,
      "breakdown": {
        "attractions": 300,
        "meals": 1200,
        "transportation": 500,
        "accommodation": 1500
      }
    },
    "createdAt": "2026-04-03T10:00:00.000Z",
    "updatedAt": "2026-04-03T10:00:00.000Z"
  }
}
```

#### GET /api/itineraries

获取用户行程列表。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/itineraries?userId=user-001"
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "itinerary-001",
      "userId": "user-001",
      "title": "北京三日游",
      "destination": "北京",
      "startDate": "2024-04-10",
      "endDate": "2024-04-12",
      "totalDays": 3,
      "status": "draft",
      "createdAt": "2026-04-03T10:00:00.000Z"
    }
  ]
}
```

#### GET /api/itineraries/:id

获取行程详情。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/itineraries/itinerary-001"
```

#### PUT /api/itineraries/:id

更新行程。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程ID |

**请求体**:
```json
{
  "title": "北京文化深度游",
  "description": "深度体验北京历史文化",
  "status": "confirmed"
}
```

**请求示例**:
```bash
curl -X PUT http://localhost:3001/api/itineraries/itinerary-001 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "北京文化深度游",
    "status": "confirmed"
  }'
```

#### DELETE /api/itineraries/:id

删除行程。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 行程ID |

**请求示例**:
```bash
curl -X DELETE http://localhost:3001/api/itineraries/itinerary-001
```

**响应示例**:
```json
{
  "success": true,
  "message": "Itinerary deleted successfully"
}
```

---

### 用户 API

用户API提供用户信息管理功能。

#### GET /api/users/:id

获取用户信息。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 用户ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/users/user-001"
```

---

### 偏好 API

偏好API提供用户偏好设置功能。

#### GET /api/preferences/:userId

获取用户偏好。

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户ID |

**请求示例**:
```bash
curl "http://localhost:3001/api/preferences/user-001"
```

---

## 错误处理

### 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### 常见错误码

| HTTP状态码 | 错误类型 | 说明 |
|-----------|---------|------|
| 400 | Bad Request | 请求参数缺失或格式错误 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误示例

#### 参数缺失 (400)

```json
{
  "success": false,
  "error": "Location is required"
}
```

#### 资源不存在 (404)

```json
{
  "success": false,
  "error": "Attraction not found"
}
```

#### 服务器错误 (500)

```json
{
  "success": false,
  "error": "Failed to create itinerary"
}
```

---

## 最佳实践

### 1. 参数编码

使用URL编码传递中文参数：

```bash
# 正确
curl "http://localhost:3001/api/attractions/search?location=116.4074,39.9042&keywords=%E6%95%85%E5%AE%AB"

# 错误（可能导致乱码）
curl "http://localhost:3001/api/attractions/search?location=116.4074,39.9042&keywords=故宫"
```

### 2. 坐标格式

统一使用高德地图坐标格式（GCJ-02）：

```
经度,纬度
116.4074,39.9042
```

### 3. 分页查询

大数据量查询时使用分页：

```bash
curl "http://localhost:3001/api/attractions/search?location=北京&page=1&pageSize=20"
```

### 4. 错误处理

始终检查响应中的 `success` 字段：

```javascript
const response = await fetch('/api/attractions/search?location=北京');
const data = await response.json();

if (!data.success) {
  console.error('API Error:', data.error);
  return;
}

// 处理成功响应
console.log('Attractions:', data.data.attractions);
```

### 5. 性能优化

- 使用Redis缓存减少API调用
- 批量查询时使用距离矩阵API
- 合理设置搜索半径避免过多结果

---

## 常见问题

### Q1: 为什么天气API返回404？

**A**: 可能原因：
1. 和风天气API密钥未配置或无效
2. 城市名称不正确
3. API配额已用完

**解决方案**:
- 检查 `.env` 文件中的 `QWEATHER_API_KEY`
- 使用标准城市名称或Location ID
- 检查API配额使用情况

### Q2: 景点搜索返回空数组？

**A**: 可能原因：
1. 搜索半径内没有景点
2. 关键词不匹配
3. 坐标格式错误

**解决方案**:
- 增大搜索半径
- 使用更通用的关键词
- 确认坐标格式为 `lng,lat`

### Q3: 行程生成失败？

**A**: 可能原因：
1. 智谱AI API密钥无效
2. 外部API调用失败
3. 数据库连接问题

**解决方案**:
- 检查 `ZHIPU_API_KEY` 配置
- 查看服务器日志获取详细错误信息
- 确认数据库和Redis连接正常

### Q4: 如何处理中文参数编码问题？

**A**: 使用 `encodeURIComponent()` 编码中文参数：

```javascript
const keywords = encodeURIComponent('故宫');
const url = `/api/attractions/search?location=北京&keywords=${keywords}`;
```

### Q5: API响应速度慢怎么办？

**A**: 优化建议：
1. 使用Redis缓存
2. 减少不必要的API调用
3. 使用分页避免大数据量查询
4. 检查网络连接和服务器性能

---

## 联系方式

如有问题或建议，请联系：

- **项目地址**: `/Users/pc/Documents/trae_projects/travel`
- **文档位置**: `.trae/documents/api-documentation.md`
- **测试脚本**: `server/test-phase2-api.js`

---

**最后更新**: 2026-04-03  
**API版本**: 1.0.0  
**文档版本**: 1.0.0
