export interface ToolSchema {
  name: string;
  description: string;
  command: string[];
  requiredArgs: string[];
  dangerous?: boolean;
}

export const codexToolSchemas: ToolSchema[] = [
  {
    name: "db_status",
    description: "检查数据库连接状态",
    command: ["travel", "db", "status"],
    requiredArgs: [],
  },
  {
    name: "user_get",
    description: "读取用户资料",
    command: ["travel", "user", "get"],
    requiredArgs: ["userId"],
  },
  {
    name: "preference_get",
    description: "读取用户旅行偏好",
    command: ["travel", "preference", "get"],
    requiredArgs: ["userId"],
  },
  {
    name: "preference_set",
    description: "写入用户旅行偏好",
    command: ["travel", "preference", "set"],
    requiredArgs: ["userId", "data"],
  },
  {
    name: "itinerary_list",
    description: "列出行程",
    command: ["travel", "itinerary", "list"],
    requiredArgs: [],
  },
  {
    name: "itinerary_get",
    description: "读取单个行程",
    command: ["travel", "itinerary", "get"],
    requiredArgs: ["itineraryId"],
  },
  {
    name: "itinerary_create",
    description: "创建结构化行程",
    command: ["travel", "itinerary", "create"],
    requiredArgs: ["data"],
  },
  {
    name: "itinerary_update",
    description: "更新结构化行程",
    command: ["travel", "itinerary", "update"],
    requiredArgs: ["itineraryId", "data"],
  },
  {
    name: "itinerary_delete",
    description: "删除行程",
    command: ["travel", "itinerary", "delete"],
    requiredArgs: ["itineraryId"],
    dangerous: true,
  },
  {
    name: "map_geocode",
    description: "地图地理编码",
    command: ["travel", "map", "geocode"],
    requiredArgs: ["address"],
  },
  {
    name: "map_search_poi",
    description: "搜索地图 POI",
    command: ["travel", "map", "search-poi"],
    requiredArgs: ["keyword"],
  },
  {
    name: "map_route",
    description: "查询两点路线",
    command: ["travel", "map", "route"],
    requiredArgs: ["from", "to"],
  },
  {
    name: "plan_validate",
    description: "校验结构化行程 JSON",
    command: ["travel", "plan", "validate"],
    requiredArgs: ["data"],
  },
  {
    name: "plan_estimate_budget",
    description: "估算结构化行程预算",
    command: ["travel", "plan", "estimate-budget"],
    requiredArgs: ["data"],
  },
  {
    name: "plan_optimize_order",
    description: "按坐标优化访问顺序",
    command: ["travel", "plan", "optimize-order"],
    requiredArgs: ["data"],
  },
];

