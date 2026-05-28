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

CLI 会读取 `server/.env`，需要至少配置：

```bash
DATABASE_URL=...
ZHIPU_API_KEY=...
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
npm run cli -- plan list
npm run cli -- plan list --userId demo-user-001
```

获取单个行程：

```bash
npm run cli -- plan get <itineraryId>
```

更新行程元信息：

```bash
npm run cli -- plan update <itineraryId> --title "北京三日游" --status confirmed
```

删除行程：

```bash
npm run cli -- plan delete <itineraryId>
```

通过 PlanAgent 对话生成或修改行程：

```bash
npm run cli -- plan chat new "帮我规划 3 天杭州亲子游" --userId demo-user-001
npm run cli -- plan chat <itineraryId> "把第二天改轻松一点" --userId demo-user-001
```

流式输出：

```bash
npm run cli -- plan chat <itineraryId> "把第三天和第一天互换" --stream
```

可选参数：

- `--userId <userId>`：指定用户 ID，默认 `demo-user-001`。
- `--context <text>`：注入当前行程摘要。
- `--history <json>`：注入聊天历史，必须是数组 JSON。
- `--stream`：改用 JSON Lines 流式输出。

## 偏好命令

获取用户偏好：

```bash
npm run cli -- preference get <userId>
```

设置用户偏好：

```bash
npm run cli -- preference set <userId> --travelStyle relaxed --budgetMin 1000 --budgetMax 6000
```

也可以用 JSON 一次性设置：

```bash
npm run cli -- preference set <userId> --data '{"travelStyle":"moderate","travelerCount":2,"preferredActivities":["museum","food"]}'
```

删除用户偏好：

```bash
npm run cli -- preference delete <userId>
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

HTTP 入口仍然位于：

- `src/controllers/itinerary.controller.ts`
- `src/controllers/preference.controller.ts`
- `src/routes/agent.routes.ts`

CLI 入口位于：

- `src/cli/index.ts`
