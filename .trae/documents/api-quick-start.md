# API 快速开始指南

本指南将帮助您快速上手使用旅游规划 AI Agent API。

---

## 目录

1. [环境准备](#环境准备)
2. [快速测试](#快速测试)
3. [常见使用场景](#常见使用场景)
4. [代码示例](#代码示例)
5. [故障排查](#故障排查)

---

## 环境准备

### 1. 检查服务状态

首先确认服务器正在运行：

```bash
curl http://localhost:3001/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T09:58:08.420Z"
}
```

### 2. 获取API信息

查看可用的API端点：

```bash
curl http://localhost:3001/api
```

---

## 快速测试

### 测试天气API

```bash
# 查询北京当前天气
curl "http://localhost:3001/api/weather/current?location=北京"
```

### 测试景点搜索

```bash
# 搜索故宫附近的景点
curl "http://localhost:3001/api/attractions/search?location=116.397428,39.90923&keywords=%E6%95%85%E5%AE%AB"
```

### 测试餐厅搜索

```bash
# 搜索附近的餐厅
curl "http://localhost:3001/api/restaurants/search?location=116.397428,39.90923&keywords=%E7%81%AB%E9%94%85"
```

### 测试路线规划

```bash
# 规划步行路线
curl "http://localhost:3001/api/routes/plan?origin=116.4074,39.9042&destination=116.3972,39.9163&mode=walking"
```

### 测试行程生成

```bash
# 创建新行程
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

---

## 常见使用场景

### 场景1: 查询天气并规划行程

**步骤**:

1. 查询目的地天气
2. 根据天气情况选择景点
3. 生成行程

**示例代码**:

```bash
# 1. 查询北京未来3天天气
curl "http://localhost:3001/api/weather/forecast?location=北京&days=3"

# 2. 搜索室内景点（如果天气不好）
curl "http://localhost:3001/api/attractions/search?location=116.4074,39.9042&keywords=%E5%8D%9A%E7%89%A9%E9%A6%86"

# 3. 生成行程
curl -X POST http://localhost:3001/api/itineraries \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "北京",
    "startDate": "2024-04-10",
    "endDate": "2024-04-12",
    "title": "北京博物馆之旅",
    "userId": "user-001",
    "preferences": {
      "interests": ["博物馆", "文化"],
      "travelStyle": "relaxed"
    }
  }'
```

### 场景2: 规划一日游路线

**步骤**:

1. 搜索景点
2. 搜索附近餐厅
3. 规划路线
4. 计算距离和时间

**示例代码**:

```bash
# 1. 搜索天安门附近的景点
curl "http://localhost:3001/api/attractions/search?location=116.397463,39.909187&radius=2000"

# 2. 搜索附近餐厅
curl "http://localhost:3001/api/restaurants/location?lat=39.909187&lng=116.397463&radius=1000"

# 3. 规划从天安门到故宫的步行路线
curl "http://localhost:3001/api/routes/plan?origin=116.397463,39.909187&destination=116.3972,39.9163&mode=walking"

# 4. 计算多个景点之间的距离
curl "http://localhost:3001/api/routes/distance?origins=116.397463,39.909187|116.3972,39.9163&destination=116.4089,39.9123&type=1"
```

### 场景3: 创建个性化行程

**步骤**:

1. 设置用户偏好
2. 搜索符合偏好的景点
3. 生成行程

**示例代码**:

```bash
# 创建带有详细偏好的行程
curl -X POST http://localhost:3001/api/itineraries \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "北京",
    "startDate": "2024-04-10",
    "endDate": "2024-04-12",
    "title": "北京美食文化之旅",
    "userId": "user-001",
    "preferences": {
      "budgetMin": 2000,
      "budgetMax": 5000,
      "travelStyle": "moderate",
      "interests": ["美食", "历史", "文化"],
      "dietaryRestrictions": ["不吃辣"],
      "preferredActivities": ["参观博物馆", "品尝当地美食"],
      "wakeUpTime": "08:00",
      "sleepTime": "22:00"
    }
  }'
```

---

## 代码示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 查询天气
async function getWeather(location) {
  try {
    const response = await axios.get(`${BASE_URL}/weather/current`, {
      params: { location }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    throw error;
  }
}

// 搜索景点
async function searchAttractions(location, keywords) {
  try {
    const response = await axios.get(`${BASE_URL}/attractions/search`, {
      params: { location, keywords: encodeURIComponent(keywords) }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching attractions:', error.response?.data || error.message);
    throw error;
  }
}

// 创建行程
async function createItinerary(itineraryData) {
  try {
    const response = await axios.post(`${BASE_URL}/itineraries`, itineraryData);
    return response.data;
  } catch (error) {
    console.error('Error creating itinerary:', error.response?.data || error.message);
    throw error;
  }
}

// 使用示例
async function main() {
  // 查询天气
  const weather = await getWeather('北京');
  console.log('Weather:', weather);

  // 搜索景点
  const attractions = await searchAttractions('116.4074,39.9042', '故宫');
  console.log('Attractions:', attractions);

  // 创建行程
  const itinerary = await createItinerary({
    destination: '北京',
    startDate: '2024-04-10',
    endDate: '2024-04-12',
    title: '北京三日游',
    userId: 'user-001'
  });
  console.log('Itinerary:', itinerary);
}

main().catch(console.error);
```

### Python

```python
import requests
import urllib.parse

BASE_URL = 'http://localhost:3001/api'

def get_weather(location):
    """查询天气"""
    try:
        response = requests.get(f'{BASE_URL}/weather/current', params={'location': location})
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error fetching weather: {e}')
        raise

def search_attractions(location, keywords):
    """搜索景点"""
    try:
        encoded_keywords = urllib.parse.quote(keywords)
        response = requests.get(
            f'{BASE_URL}/attractions/search',
            params={'location': location, 'keywords': encoded_keywords}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error searching attractions: {e}')
        raise

def create_itinerary(itinerary_data):
    """创建行程"""
    try:
        response = requests.post(
            f'{BASE_URL}/itineraries',
            json=itinerary_data
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error creating itinerary: {e}')
        raise

# 使用示例
if __name__ == '__main__':
    # 查询天气
    weather = get_weather('北京')
    print('Weather:', weather)

    # 搜索景点
    attractions = search_attractions('116.4074,39.9042', '故宫')
    print('Attractions:', attractions)

    # 创建行程
    itinerary = create_itinerary({
        'destination': '北京',
        'startDate': '2024-04-10',
        'endDate': '2024-04-12',
        'title': '北京三日游',
        'userId': 'user-001'
    })
    print('Itinerary:', itinerary)
```

### TypeScript

```typescript
import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

interface WeatherResponse {
  success: boolean;
  data: any;
  error?: string;
}

interface AttractionResponse {
  success: boolean;
  data: {
    attractions: any[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

interface ItineraryResponse {
  success: boolean;
  data: any;
  error?: string;
}

export async function getWeather(location: string): Promise<WeatherResponse> {
  try {
    const response = await axios.get<WeatherResponse>(`${BASE_URL}/weather/current`, {
      params: { location }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching weather:', error.response?.data || error.message);
    throw error;
  }
}

export async function searchAttractions(
  location: string,
  keywords: string
): Promise<AttractionResponse> {
  try {
    const response = await axios.get<AttractionResponse>(`${BASE_URL}/attractions/search`, {
      params: { location, keywords: encodeURIComponent(keywords) }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error searching attractions:', error.response?.data || error.message);
    throw error;
  }
}

export async function createItinerary(
  itineraryData: any
): Promise<ItineraryResponse> {
  try {
    const response = await axios.post<ItineraryResponse>(
      `${BASE_URL}/itineraries`,
      itineraryData
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating itinerary:', error.response?.data || error.message);
    throw error;
  }
}

// 使用示例
async function main() {
  try {
    // 查询天气
    const weather = await getWeather('北京');
    console.log('Weather:', weather);

    // 搜索景点
    const attractions = await searchAttractions('116.4074,39.9042', '故宫');
    console.log('Attractions:', attractions);

    // 创建行程
    const itinerary = await createItinerary({
      destination: '北京',
      startDate: '2024-04-10',
      endDate: '2024-04-12',
      title: '北京三日游',
      userId: 'user-001'
    });
    console.log('Itinerary:', itinerary);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

---

## 故障排查

### 问题1: 服务器无法启动

**症状**: 运行 `npm run dev` 失败

**解决方案**:

1. 检查端口占用：
```bash
lsof -i :3001
```

2. 检查依赖安装：
```bash
npm install
```

3. 检查环境变量：
```bash
cat .env
```

### 问题2: API返回404

**症状**: 所有API请求返回404

**解决方案**:

1. 确认服务器正在运行：
```bash
curl http://localhost:3001/health
```

2. 检查URL路径是否正确：
```bash
# 正确
curl http://localhost:3001/api/weather/current?location=北京

# 错误（缺少 /api 前缀）
curl http://localhost:3001/weather/current?location=北京
```

### 问题3: 中文参数乱码

**症状**: 中文参数显示为乱码

**解决方案**:

使用URL编码：
```bash
# 正确
curl "http://localhost:3001/api/attractions/search?location=116.4074,39.9042&keywords=%E6%95%85%E5%AE%AB"

# 或使用 --data-urlencode
curl -G "http://localhost:3001/api/attractions/search" \
  --data-urlencode "location=116.4074,39.9042" \
  --data-urlencode "keywords=故宫"
```

### 问题4: Redis连接失败

**症状**: 服务器启动时显示Redis连接错误

**解决方案**:

1. 启动Redis服务：
```bash
redis-server
```

2. 检查Redis配置：
```bash
redis-cli ping
```

### 问题5: 数据库连接失败

**症状**: Prisma错误或数据库连接错误

**解决方案**:

1. 检查PostgreSQL服务：
```bash
psql -U postgres
```

2. 运行数据库迁移：
```bash
npm run prisma:migrate
```

3. 重置数据库：
```bash
npm run prisma:migrate:reset
```

---

## 下一步

- 查看 [完整API文档](./api-documentation.md)
- 查看 [测试报告](./phase2-api-test-report.md)
- 开始前端开发集成

---

**最后更新**: 2026-04-03
