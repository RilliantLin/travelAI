import { z } from "zod";

export const toolSchemas = {
  generate_itinerary: {
    name: "generate_itinerary",
    description:
      "根据用户提供的目的地、天数、日期等信息，生成一份完整的多日旅行行程。在用户首次提出旅行计划时调用。",
    parameters: z.object({
      destination: z.string().describe("目的地城市名称"),
      days: z.number().int().min(1).max(30).describe("旅行天数"),
      startDate: z
        .string()
        .optional()
        .describe("出发日期，格式 YYYY-MM-DD，不提供则默认7天后"),
      travelStyle: z
        .enum(["relaxed", "moderate", "intensive"])
        .optional()
        .describe("旅行节奏"),
    }),
  },

  add_activity: {
    name: "add_activity",
    description: "在指定某天的行程中添加一个新的景点或活动。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引，从0开始"),
      name: z.string().describe("景点/活动名称"),
      type: z
        .enum(["attraction", "restaurant", "hotel", "transport", "other"])
        .optional()
        .default("attraction"),
      duration: z
        .number()
        .optional()
        .default(120)
        .describe("游玩时长（分钟）"),
      description: z.string().optional().describe("简短描述"),
      estimatedCost: z.number().optional().describe("预估费用（人民币）"),
    }),
  },

  remove_activity: {
    name: "remove_activity",
    description: "从指定某天的行程中删除一个景点或活动。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引，从0开始"),
      activityName: z.string().describe("要删除的活动名称"),
    }),
  },

  replace_activity: {
    name: "replace_activity",
    description: "用一个新的景点/活动替换指定某天中的某个现有活动。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引，从0开始"),
      oldActivityName: z.string().describe("要替换掉的旧活动名称"),
      newName: z.string().describe("新景点/活动名称"),
      newType: z
        .enum(["attraction", "restaurant", "hotel", "transport", "other"])
        .optional()
        .default("attraction"),
      newDuration: z.number().optional().default(120).describe("新活动时长（分钟）"),
      newDescription: z.string().optional().describe("新活动描述"),
      newEstimatedCost: z.number().optional().describe("新活动预估费用"),
    }),
  },

  modify_activity: {
    name: "modify_activity",
    description: "修改指定活动的属性，如时间、时长、费用等。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引，从0开始"),
      activityName: z.string().describe("要修改的活动名称"),
      changes: z
        .object({
          startTime: z.string().optional().describe("新的开始时间，如 09:00"),
          endTime: z.string().optional().describe("新的结束时间"),
          duration: z.number().optional().describe("新的时长（分钟）"),
          estimatedCost: z.number().optional().describe("新的预估费用"),
          description: z.string().optional().describe("新的描述"),
        })
        .describe("要修改的字段"),
    }),
  },

  set_transport: {
    name: "set_transport",
    description: "设置两个地点之间的交通方案，如火车、飞机、公交等。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引"),
      from: z.string().describe("出发地"),
      to: z.string().describe("目的地"),
      mode: z
        .enum(["walking", "bus", "subway", "taxi", "train", "flight", "driving"])
        .describe("交通方式"),
      duration: z.number().optional().describe("耗时（分钟）"),
      cost: z.number().optional().describe("费用"),
      details: z.string().optional().describe("班次等详细信息"),
    }),
  },

  set_accommodation: {
    name: "set_accommodation",
    description: "设置某天的住宿信息。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引"),
      name: z.string().describe("酒店/住宿名称"),
      type: z
        .string()
        .optional()
        .default("酒店")
        .describe("住宿类型，如酒店、民宿"),
      estimatedCost: z.number().optional().describe("每晚价格"),
      rating: z.number().optional().describe("评分"),
      address: z.string().optional().describe("地址"),
    }),
  },

  reorder_day: {
    name: "reorder_day",
    description: "调整指定某天的活动顺序。",
    parameters: z.object({
      dayIndex: z.number().int().min(0).describe("天数索引"),
      activityNames: z
        .array(z.string())
        .describe("按新顺序排列的活动名称列表"),
    }),
  },
};

export type ToolName = keyof typeof toolSchemas;

export function getToolDefinitionsForPrompt(): string {
  const definitions = Object.values(toolSchemas).map((tool) => {
    const params = tool.parameters;
    return `- ${tool.name}: ${tool.description}`;
  });
  return definitions.join("\n");
}

export function getToolCallFormat(): string {
  return `当你需要操作行程时，请在回复中包含以下格式的工具调用（必须是合法的 JSON）：
<tool_call>
{"name": "工具名称", "arguments": {参数对象}}
</tool_call>

可用的工具：
- generate_itinerary: 生成完整行程。参数: destination(目的地), days(天数), startDate(可选,出发日期YYYY-MM-DD), travelStyle(可选,"relaxed"|"moderate"|"intensive")
- add_activity: 添加活动。参数: dayIndex(天数索引,从0开始), name(名称), type(可选,"attraction"|"restaurant"), duration(可选,分钟), description(可选), estimatedCost(可选)
- remove_activity: 删除活动。参数: dayIndex(天数索引), activityName(活动名称)
- replace_activity: 替换活动。参数: dayIndex(天数索引), oldActivityName(旧名称), newName(新名称), newType(可选), newDuration(可选), newDescription(可选), newEstimatedCost(可选)
- modify_activity: 修改活动属性。参数: dayIndex(天数索引), activityName(名称), changes({startTime, endTime, duration, estimatedCost, description})
- set_transport: 设置交通。参数: dayIndex(天数索引), from(出发地), to(目的地), mode("walking"|"bus"|"subway"|"taxi"|"train"|"flight"|"driving"), duration(可选,分钟), cost(可选), details(可选)
- set_accommodation: 设置住宿。参数: dayIndex(天数索引), name(名称), type(可选), estimatedCost(可选), rating(可选), address(可选)
- reorder_day: 重排活动。参数: dayIndex(天数索引), activityNames(按新顺序排列的名称数组)

注意：
1. 你可以在一条回复中包含多个 <tool_call>，它们会按顺序执行
2. 工具调用应放在自然语言回复之后
3. dayIndex 从 0 开始，即第1天=0, 第2天=1
4. 只有当用户明确要求修改行程时才调用工具`;
}
