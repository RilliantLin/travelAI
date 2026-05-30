# TravelMind CLI Agent 使用说明

本文档约定 Codex 或其他自动化 agent 如何通过 CLI 访问 TravelMind 后端能力。

## 设计目标

- HTTP API 继续服务前端。
- CLI 作为 agent 和脚本的后端入口。
- HTTP 与 CLI 共用 `src/services/` 里的业务逻辑。
- CLI 默认输出机器可读 JSON，方便 agent 判断下一步动作。

## 运行方式

开发环境：

```bash
cd server
npm run cli -- <资源> <命令> [参数] [选项]
```

Agent 需要解析纯 JSON 时，开发环境优先使用：

```bash
cd server
node -r ts-node/register src/cli/index.ts <资源> <命令> [参数] [选项]
```

构建后：

```bash
cd server
npm run build
travel <资源> <命令> [参数] [选项]
```

CLI 会读取 `server/.env`，核心数据库命令需要至少配置：

```bash
DATABASE_URL=...
```

地图命令需要配置：

```bash
AMAP_API_KEY=...
```

## 输出协议

非流式命令成功时输出：

```json
{
  "ok": true,
  "data": {}
}
```

非流式命令失败时输出到 stderr：

```json
{
  "ok": false,
  "error": {
    "code": "ITINERARY_NOT_FOUND",
    "message": "行程不存在"
  }
}
```

流式命令使用 JSON Lines，每一行都是独立 JSON：

```json
{"type":"text","content":"正在规划..."}
{"type":"itinerary_snapshot","data":{}}
{"type":"done"}
```

## 行程命令

列出行程：

```bash
node -r ts-node/register src/cli/index.ts itinerary list
node -r ts-node/register src/cli/index.ts itinerary list --userId demo-user-001
```

获取单个行程：

```bash
node -r ts-node/register src/cli/index.ts itinerary get <itineraryId>
```

创建行程：

```bash
node -r ts-node/register src/cli/index.ts itinerary create --data '{"userId":"demo-user-001","destination":"上海","startDate":"2026-06-01","endDate":"2026-06-01","days":[]}'
```

更新行程：

```bash
node -r ts-node/register src/cli/index.ts itinerary update <itineraryId> --data '{"title":"上海一日游","status":"confirmed"}'
```

删除行程：

```bash
node -r ts-node/register src/cli/index.ts itinerary delete <itineraryId>
```

## 地图命令

```bash
node -r ts-node/register src/cli/index.ts map geocode "上海外滩"
node -r ts-node/register src/cli/index.ts map search-poi --city 上海 --keyword "经典景点" --limit 10
node -r ts-node/register src/cli/index.ts map route --from "外滩" --to "豫园" --mode walking
```

## 计划辅助命令

```bash
node -r ts-node/register src/cli/index.ts plan validate --data '<itinerary-json>'
node -r ts-node/register src/cli/index.ts plan estimate-budget --data '<itinerary-json>'
node -r ts-node/register src/cli/index.ts plan optimize-order --data '<itinerary-json>'
```

`plan chat` / `plan generate` 已废弃。自然语言理解和行程生成由外层 Codex Agent 完成，后端 CLI 只提供确定性工具。

## 偏好命令

获取用户偏好：

```bash
node -r ts-node/register src/cli/index.ts preference get <userId>
```

设置用户偏好：

```bash
node -r ts-node/register src/cli/index.ts preference set <userId> --travelStyle relaxed --budgetMin 1000 --budgetMax 6000
```

也可以用 JSON 一次性设置：

```bash
node -r ts-node/register src/cli/index.ts preference set <userId> --data '{"travelStyle":"moderate","travelerCount":2,"preferredActivities":["museum","food"]}'
```

删除用户偏好：

```bash
node -r ts-node/register src/cli/index.ts preference delete <userId>
```

## Agent 使用规则

- 后端读写优先使用 CLI，不直接绕过 service 操作数据库。
- 需要解析结果时，只读取 JSON，不依赖人类可读文本。
- 非流式命令只看 `ok`、`data` 和 `error`。
- 流式命令按行解析 JSON，直到收到 `{"type":"done"}`。
- 如果命令返回非零退出码，根据 `error.code` 决定是否重试、换参数或向用户说明失败。
- 需要修改 HTTP 行为时，先改 `src/services/`，再让 controller 和 CLI 复用同一逻辑。

## 当前重构边界

已经抽出的共享 service：

- `src/services/itinerary.service.ts`
- `src/services/plan.service.ts`
- `src/services/preference.service.ts`
- `src/services/map.service.ts`
- `src/services/budget.service.ts`
- `src/services/validation.service.ts`

HTTP 入口仍然位于：

- `src/controllers/itinerary.controller.ts`
- `src/controllers/preference.controller.ts`
- `src/routes/agent.routes.ts`（deprecated compatibility）

CLI 入口位于：

- `src/cli/index.ts`
