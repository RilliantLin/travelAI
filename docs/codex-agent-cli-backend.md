# Codex Agent + CLI 后端重构架构

本文档描述 TravelMind 后端从“内置 LLM Agent 的 HTTP 服务”重构为“Codex Agent 编排 sandbox-safe CLI 工具”的目标架构。

## 目标

新的后端不再内置智谱 / LangChain Agent，也不再由后端自己完成 LLM 推理和 `<tool_call>` 解析。

目标形态：

```txt
Codex Agent = 旅行规划大脑
CLI Tools = 可控执行工具
Services = 业务逻辑
Prisma = 数据库访问
Map Tool = 地图与 POI 工具
HTTP = 可选 UI 适配层
```

核心变化：

- 移除后端主链路对 `ZHIPU_API_KEY` 的依赖。
- 移除后端主链路里的 LangChain / ChatZhipuAI 调用。
- 保留数据库、地图、预算、路线、行程校验等确定性能力。
- 把这些能力包装成 CLI 工具，供 Codex 在 sandbox 中调用。
- 前端 HTTP API 可以保留，但降级为 UI 适配层。

## 新架构概览

```txt
用户需求
  ↓
Codex Agent / Codex SDK
  ↓
Sandbox Tool Allowlist
  ↓
travel CLI
  ↓
Application Services
  ↓
Repositories / External Tools
  ↓
Prisma / Map API / Cache
```

更具体：

```txt
Codex Agent
  ├─ 理解自然语言
  ├─ 拆解任务
  ├─ 调用 travel CLI
  ├─ 读取 JSON 结果
  ├─ 决定下一步
  └─ 生成最终回复

travel CLI
  ├─ 校验参数
  ├─ 调用 service
  ├─ 输出稳定 JSON
  └─ 返回明确 exit code

Services
  ├─ itinerary.service
  ├─ preference.service
  ├─ map.service
  ├─ budget.service
  └─ validation.service
```

## 目录建议

目标目录结构：

```txt
server/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── parser.ts
│   │   ├── output.ts
│   │   └── commands/
│   │       ├── db.command.ts
│   │       ├── user.command.ts
│   │       ├── preference.command.ts
│   │       ├── itinerary.command.ts
│   │       ├── map.command.ts
│   │       └── plan.command.ts
│   ├── services/
│   │   ├── itinerary.service.ts
│   │   ├── preference.service.ts
│   │   ├── map.service.ts
│   │   ├── route.service.ts
│   │   ├── budget.service.ts
│   │   └── validation.service.ts
│   ├── repositories/
│   │   ├── itinerary.repository.ts
│   │   ├── preference.repository.ts
│   │   └── user.repository.ts
│   ├── tools/
│   │   ├── codex-tool-registry.ts
│   │   ├── schemas.ts
│   │   └── runner.ts
│   ├── contracts/
│   │   ├── cli-output.ts
│   │   ├── errors.ts
│   │   ├── itinerary.contract.ts
│   │   └── events.ts
│   ├── http/
│   │   ├── routes/
│   │   └── controllers/
│   ├── config/
│   └── lib/
└── prisma/
```

旧目录中的 `agent/plan-agent.ts`、`agent/llm.ts`、`agent/tools.ts` 不再作为主链路。它们可以在迁移期保留为兼容模块，最终删除或移动到 `legacy/`。

## 模块职责

### Codex Agent

Codex 是唯一的 Agent 大脑。

职责：

- 理解用户旅行需求。
- 选择要调用的 CLI 工具。
- 将地图、偏好、历史行程、预算等结果合成行程。
- 调用行程写入工具保存结果。
- 用自然语言向用户解释结果。

不做：

- 不直接连数据库。
- 不直接 import Prisma。
- 不绕过 CLI 调用内部 service。
- 不依赖后端内置 LLM key。

### Sandbox

Sandbox 是 Codex 的受控执行环境。

职责：

- 限制文件读写范围。
- 限制可执行命令。
- 限制网络访问。
- 只暴露白名单 CLI 工具。

推荐白名单：

```txt
travel db status
travel user get
travel preference get
travel preference set
travel itinerary list
travel itinerary get
travel itinerary create
travel itinerary update
travel itinerary delete
travel map geocode
travel map search-poi
travel map route
travel plan validate
travel plan estimate-budget
travel plan optimize-order
```

### CLI

CLI 是后端正式工具接口，不是临时脚本。

职责：

- 提供稳定命令。
- 校验输入。
- 调用 service。
- 输出稳定 JSON。
- 区分 stdout / stderr。
- 返回明确 exit code。

CLI 不负责：

- LLM 推理。
- 自然语言理解。
- 和用户聊天。

### Services

Service 是业务逻辑所在。

职责：

- 编排 repository、地图工具、预算工具。
- 维护行程数据结构一致性。
- 提供 HTTP 和 CLI 共用能力。

原则：

- 数据库写入只通过 service。
- HTTP controller 和 CLI command 都只能调用 service。
- service 不依赖 Express request / response。

### HTTP

HTTP 保留为前端 UI 适配层。

推荐过渡形态：

```txt
Web 前端
  → HTTP routes/controllers
  → services
  → Prisma / Map Tool
```

不建议一开始让 HTTP controller 通过 child process 调 CLI。这样会增加性能、错误处理和流式事件复杂度。

## CLI 命令协议

### 全局约定

所有给 agent 使用的命令必须支持 JSON 输出。

开发环境推荐调用：

```bash
cd server
node -r ts-node/register src/cli/index.ts <resource> <command> [args] [flags]
```

构建后：

```bash
travel <resource> <command> [args] [flags]
```

stdout 只输出机器可读结果。

stderr 只输出错误 JSON 或诊断日志。

### 成功输出

```json
{
  "ok": true,
  "data": {}
}
```

### 失败输出

```json
{
  "ok": false,
  "error": {
    "code": "ITINERARY_NOT_FOUND",
    "message": "行程不存在",
    "details": {}
  }
}
```

### Exit Code

```txt
0 = 成功
1 = 通用失败
2 = 参数错误或资源不存在
3 = 外部服务失败
4 = 权限或 sandbox 限制
5 = 数据校验失败
```

### 流式输出

流式命令使用 JSON Lines。

```json
{"type":"text","content":"正在查询景点"}
{"type":"tool_result","name":"map.search-poi","data":{}}
{"type":"itinerary_snapshot","data":{}}
{"type":"done"}
```

## CLI 命令规划

### 数据库

```bash
travel db status --json
travel db migrate --json
travel db seed --json
```

### 用户

```bash
travel user get <userId> --json
travel user create --email <email> --name <name> --json
```

### 偏好

```bash
travel preference get <userId> --json
travel preference set <userId> --data '<json>' --json
travel preference delete <userId> --json
```

### 行程

```bash
travel itinerary list --userId <userId> --json
travel itinerary get <itineraryId> --json
travel itinerary create --data '<json>' --json
travel itinerary update <itineraryId> --data '<json>' --json
travel itinerary delete <itineraryId> --json
```

### 地图

高德地图不再隐藏在后端 Agent 内部，而是显式工具。

```bash
travel map geocode "上海外滩" --json
travel map search-poi --city 上海 --keyword "经典景点" --limit 10 --json
travel map route --from "外滩" --to "豫园" --mode walking --json
```

说明：

- 如果继续使用高德官方 API，地图工具仍需要高德 Key。
- 这个 Key 属于 map tool，不属于 LLM Agent。
- 如果未来 Codex sandbox 提供其他地图能力，可以替换 map service，不影响 itinerary service。

### 计划辅助

这些命令不调用 LLM，只做确定性处理。

```bash
travel plan validate --data '<json>' --json
travel plan estimate-budget --data '<json>' --json
travel plan optimize-order --data '<json>' --json
```

`travel plan generate` 不建议作为后端 LLM 生成命令保留。真正的生成应由 Codex 完成。若保留，也应只是模板生成或兼容命令。

## Codex 工具映射

Codex SDK 可以把 CLI 命令包装成工具。

示例工具表：

```txt
list_itineraries(args)
  -> travel itinerary list --userId <userId> --json

get_itinerary(args)
  -> travel itinerary get <itineraryId> --json

create_itinerary(args)
  -> travel itinerary create --data '<json>' --json

update_itinerary(args)
  -> travel itinerary update <itineraryId> --data '<json>' --json

get_preference(args)
  -> travel preference get <userId> --json

search_poi(args)
  -> travel map search-poi --city <city> --keyword <keyword> --limit <n> --json

get_route(args)
  -> travel map route --from <from> --to <to> --mode <mode> --json
```

## 示例：Codex 生成行程

用户输入：

```txt
帮我规划 1 天上海轻松游，只安排 2 个经典景点
```

Codex 执行流程：

```txt
1. travel preference get demo-user-001 --json
2. travel map search-poi --city 上海 --keyword "经典景点" --limit 10 --json
3. travel map route --from <景点A> --to <景点B> --mode walking --json
4. Codex 组装 itinerary JSON
5. travel plan validate --data '<itinerary>' --json
6. travel itinerary create --data '<itinerary>' --json
7. Codex 返回行程摘要
```

后端不会调用智谱，也不会解析 `<tool_call>`。

## 日志与审计

建议增加 agent 调用审计日志：

```txt
server/logs/agent-tools.log
```

每次 CLI 被 agent 调用时记录：

```json
{
  "timestamp": "2026-05-28T00:00:00.000Z",
  "command": "travel itinerary create",
  "argsSummary": {},
  "exitCode": 0,
  "durationMs": 123,
  "resultSummary": {}
}
```

注意：

- 不记录完整用户隐私信息。
- 不记录 API Key。
- 大型 JSON 只记录摘要。

## 安全边界

Sandbox 中不要开放任意 shell。

推荐只开放固定命令前缀：

```txt
travel db status
travel user get
travel preference get
travel preference set
travel itinerary list
travel itinerary get
travel itinerary create
travel itinerary update
travel itinerary delete
travel map geocode
travel map search-poi
travel map route
travel plan validate
travel plan estimate-budget
travel plan optimize-order
```

危险命令需要额外确认：

```txt
travel db migrate
travel db seed
travel itinerary delete
```

## 迁移计划

### 阶段 1：冻结协议

- 定义 CLI 命令名。
- 定义 JSON 输出协议。
- 定义错误码。
- 定义 itinerary create/update 的 JSON schema。
- 定义 map tool 输出结构。

### 阶段 2：抽离 LLM 主链路

- 将 `PlanAgent` 从主业务路径移除。
- 旧 HTTP `/api/agent/plan/stream` 标记为 deprecated。
- `ItineraryAgent` 中的确定性生成逻辑拆到 `plan` / `validation` / `budget` service。
- 删除或隔离 `ZHIPU_API_KEY` 依赖。

### 阶段 3：完善 CLI 工具

- 重写 `cli/index.ts` 为 command 分发结构。
- 增加 `itinerary create/update` 的完整 JSON 写入能力。
- 增加 `map geocode/search-poi/route`。
- 增加 `plan validate/estimate-budget/optimize-order`。

### 阶段 4：HTTP 兼容层调整

- HTTP controller 只调用 service。
- 前端仍可通过 HTTP 使用历史线路、偏好、行程详情。
- 如果前端继续需要“聊天生成行程”，应改为调用后端提供的 agent bridge，或由外层 Codex Agent 完成生成后写库。

### 阶段 5：Codex SDK Agent

- 定义 Codex tool registry。
- 每个 tool 映射到一个 travel CLI 命令。
- 加入 sandbox allowlist。
- 加入调用审计日志。
- 增加端到端测试：用户需求 → Codex 调 CLI → 创建行程 → 前端展示。

## 需要废弃或改造的旧能力

建议逐步废弃：

- 后端内置 `ChatZhipuAI` 主链路。
- `PlanAgent.planStream()` 中的 LLM 调用。
- `<tool_call>` prompt 协议作为核心协议。
- 后端自行决定如何理解用户自然语言。

建议保留或改造：

- Prisma schema。
- 行程 transform 逻辑。
- 高德 API 封装，改造成 map service / map CLI。
- 预算估算和路线优化，改造成 plan helper CLI。
- HTTP API，作为前端兼容层。

## 最终判断标准

重构完成后，应满足：

- 没有智谱 API Key 也能运行核心后端 CLI。
- Codex 可以通过 sandbox allowlist 调用 travel CLI 完成行程创建。
- 所有数据库写入都经过 service。
- CLI 输出可被机器稳定解析。
- 前端仍可读取和展示 CLI 创建的行程。
- 地图能力是显式工具，而不是隐藏在后端 LLM Agent 内部。
