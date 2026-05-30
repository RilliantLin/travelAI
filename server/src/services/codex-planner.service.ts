import { ChatMessage, PlanEvent } from "../contracts/events";
import { ItineraryCreateInput, ItineraryUpdateInput } from "../contracts/itinerary.contract";
import { Itinerary } from "../types/itinerary";
import { createItinerary, getItineraryById, updateItinerary } from "./itinerary.service";
import { searchPoi, MapPoi } from "./map.service";
import { getPreferenceByUserId } from "./preference.service";
import { ensureUser } from "./user.service";
import { validatePlanData } from "./validation.service";
import { estimateItineraryBudget } from "./budget.service";

const DEMO_USER_ID = "demo-user-001";

const CN_NUMBERS: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const DIRECT_CITY_NAMES = [
  "北京",
  "上海",
  "天津",
  "重庆",
  "广州",
  "深圳",
  "杭州",
  "苏州",
  "南京",
  "成都",
  "西安",
  "武汉",
  "长沙",
  "厦门",
  "青岛",
  "大连",
  "昆明",
  "丽江",
  "大理",
  "桂林",
  "三亚",
  "海口",
  "拉萨",
  "乌鲁木齐",
  "哈尔滨",
  "沈阳",
  "济南",
  "郑州",
  "福州",
  "宁波",
  "无锡",
  "东莞",
  "佛山",
  "珠海",
  "澳门",
  "香港",
  "台北",
  "西双版纳",
  "芒市",
  "新疆",
  "山西",
];

interface PlannerRequest {
  message: string;
  history?: ChatMessage[];
  itineraryContext?: string;
  itineraryId?: string;
  userId?: string;
}

interface ParsedTravelRequest {
  destination?: string;
  days: number;
  startDate: string;
  endDate: string;
  style: "relaxed" | "moderate" | "intensive";
  activitiesPerDay: number;
  travelerHint?: string;
  keyword: string;
  budgetMax?: number;
  intent: "create" | "update";
}

interface PlannerResult {
  itinerary: Itinerary | null;
  text: string;
}

function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function parseDayCount(message: string, fallback = 3): number {
  const digitMatch = message.match(/(\d{1,2})\s*(天|日|晚)/);
  if (digitMatch) {
    return Math.min(10, Math.max(1, Number(digitMatch[1])));
  }

  const cnMatch = message.match(/([一二两三四五六七八九十])\s*(天|日|晚)/);
  if (cnMatch) {
    return Math.min(10, Math.max(1, CN_NUMBERS[cnMatch[1]] ?? fallback));
  }

  return fallback;
}

function parseStartDate(message: string): string {
  const isoMatch = message.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return dateOnly(new Date(Number(year), Number(month) - 1, Number(day)));
  }

  const monthDayMatch = message.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDayMatch) {
    const base = today();
    const date = new Date(base.getFullYear(), Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]));
    if (date < base) date.setFullYear(date.getFullYear() + 1);
    return dateOnly(date);
  }

  if (/后天/.test(message)) return dateOnly(addDays(today(), 2));
  if (/明天/.test(message)) return dateOnly(addDays(today(), 1));
  if (/下周/.test(message)) return dateOnly(addDays(today(), 7));

  return dateOnly(addDays(today(), 7));
}

function extractDestination(message: string, existing?: Itinerary | null): string | undefined {
  const knownCity = DIRECT_CITY_NAMES.find((city) => message.includes(city));
  if (knownCity) return knownCity;

  const patternMatch = message.match(/[去到游玩逛在]\s*([\u4e00-\u9fa5]{2,8})(?:\d|[一二两三四五六七八九十]|旅游|旅行|自由行|亲子|轻松|休闲|经典|景点|美食|博物馆|$)/);
  if (patternMatch?.[1]) {
    return patternMatch[1]
      .replace(/^(一下|一次|一个|一趟)/, "")
      .replace(/(旅游|旅行|自由行|亲子游|轻松游|经典游|日游|天游|游)$/g, "")
      .trim();
  }

  return existing?.destination;
}

function parseStyle(message: string): ParsedTravelRequest["style"] {
  if (/轻松|休闲|慢|老人|亲子|少走路/.test(message)) return "relaxed";
  if (/紧凑|特种兵|多安排|尽量多|丰富/.test(message)) return "intensive";
  return "moderate";
}

function activityCountForStyle(style: ParsedTravelRequest["style"]): number {
  if (style === "relaxed") return 2;
  if (style === "intensive") return 4;
  return 3;
}

function parseKeyword(message: string, style: ParsedTravelRequest["style"]): string {
  if (/博物馆|展览|艺术/.test(message)) return "博物馆";
  if (/亲子|孩子|儿童/.test(message)) return "亲子景点";
  if (/美食|餐厅|小吃/.test(message)) return "美食街";
  if (/自然|公园|徒步|山/.test(message)) return "公园景点";
  if (style === "relaxed") return "经典景点";
  return "热门景点";
}

function parseBudgetMax(message: string): number | undefined {
  const match = message.match(/预算[^\d]*(\d{3,6})/);
  return match ? Number(match[1]) : undefined;
}

function parseTravelRequest(
  request: PlannerRequest,
  existing?: Itinerary | null
): ParsedTravelRequest {
  const message = request.message.trim();
  const style = parseStyle(message);
  const days = parseDayCount(message, existing?.totalDays ?? 3);
  const startDate = parseStartDate(message);
  const endDate = dateOnly(addDays(new Date(startDate), days - 1));

  return {
    destination: extractDestination(message, existing),
    days,
    startDate,
    endDate,
    style,
    activitiesPerDay: activityCountForStyle(style),
    travelerHint: /亲子|孩子|儿童/.test(message) ? "亲子" : undefined,
    keyword: parseKeyword(message, style),
    budgetMax: parseBudgetMax(message),
    intent: existing ? "update" : "create",
  };
}

async function ensurePlanningUser(userId: string): Promise<void> {
  await ensureUser(userId, {
    email: `${userId}@travelmind.local`,
    name: "TravelMind Demo User",
  });
}

function fallbackPois(destination: string, count: number): MapPoi[] {
  const names = [
    `${destination}城市地标`,
    `${destination}历史文化街区`,
    `${destination}博物馆`,
    `${destination}公园`,
    `${destination}老街`,
    `${destination}观景点`,
    `${destination}艺术空间`,
    `${destination}夜游街区`,
    `${destination}特色市集`,
    `${destination}滨水步道`,
  ];

  return Array.from({ length: count }, (_, index) => ({
    id: `fallback-${index + 1}`,
    name: names[index % names.length],
    type: "景点",
    address: destination,
    city: destination,
    district: "",
    location: {
      lat: 0,
      lng: 0,
    },
    photos: [],
  }));
}

async function findPois(parsed: ParsedTravelRequest): Promise<{
  pois: MapPoi[];
  source: "amap" | "fallback";
}> {
  const count = parsed.days * parsed.activitiesPerDay + 4;
  if (!parsed.destination) {
    return { pois: [], source: "fallback" };
  }

  try {
    const pois = await searchPoi({
      city: parsed.destination,
      keyword: parsed.keyword,
      limit: count,
    });

    if (pois.length > 0) {
      const deduped = Array.from(new Map(pois.map((poi) => [poi.name, poi])).values());
      return { pois: deduped, source: "amap" };
    }
  } catch {
    // Map search is an enhancement; planning can still proceed with structured fallbacks.
  }

  return { pois: fallbackPois(parsed.destination, count), source: "fallback" };
}

function getActivityTimes(style: ParsedTravelRequest["style"], index: number) {
  const relaxed = [
    ["09:30", "11:30"],
    ["14:00", "16:00"],
  ];
  const moderate = [
    ["09:00", "11:00"],
    ["13:30", "15:30"],
    ["16:00", "17:30"],
  ];
  const intensive = [
    ["08:30", "10:30"],
    ["11:00", "12:30"],
    ["14:00", "16:00"],
    ["17:00", "18:30"],
  ];
  const slots = style === "relaxed" ? relaxed : style === "intensive" ? intensive : moderate;
  return slots[index] ?? ["19:00", "20:30"];
}

function buildItineraryInput(
  request: PlannerRequest,
  parsed: ParsedTravelRequest,
  pois: MapPoi[],
  existing?: Itinerary | null
): ItineraryCreateInput | ItineraryUpdateInput {
  const destination = parsed.destination ?? existing?.destination ?? "";
  const days = Array.from({ length: parsed.days }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const dayPois = pois.slice(
      dayIndex * parsed.activitiesPerDay,
      (dayIndex + 1) * parsed.activitiesPerDay
    );

    return {
      dayNumber,
      date: dateOnly(addDays(new Date(parsed.startDate), dayIndex)),
      summary:
        parsed.style === "relaxed"
          ? `第${dayNumber}天：轻松游览 ${dayPois.length} 个地点`
          : `第${dayNumber}天：游览 ${dayPois.length} 个地点`,
      activities: dayPois.map((poi, activityIndex) => {
        const [startTime, endTime] = getActivityTimes(parsed.style, activityIndex);
        return {
          type: "attraction",
          name: poi.name,
          location: {
            lat: poi.location.lat,
            lng: poi.location.lng,
            address: poi.address || poi.city || destination,
          },
          description: poi.type ? `${poi.type}，适合${parsed.keyword}主题。` : undefined,
          startTime,
          endTime,
          estimatedCost: Number.isFinite(poi.cost) ? poi.cost : 0,
          rating: poi.rating,
          imageUrl: poi.photos[0],
          bookingRequired: false,
        };
      }),
      meals: [
        {
          type: "breakfast" as const,
          name: `${destination}本地早餐`,
          location: { address: destination },
          time: "08:00",
          duration: 45,
          estimatedCost: 30,
        },
        {
          type: "lunch" as const,
          name: `${destination}特色午餐`,
          location: { address: destination },
          time: "12:00",
          duration: 60,
          estimatedCost: 80,
        },
        {
          type: "dinner" as const,
          name: `${destination}晚餐`,
          location: { address: destination },
          time: "18:30",
          duration: 75,
          estimatedCost: 120,
        },
      ],
      accommodation:
        parsed.days > 1
          ? {
              name: `${destination}市中心酒店`,
              type: "hotel",
              location: { address: `${destination}市中心` },
              checkIn: "14:00",
              checkOut: "12:00",
              estimatedCost: parsed.style === "relaxed" ? 450 : 350,
              amenities: ["交通便利", "近主要景点"],
            }
          : undefined,
    };
  });

  const title = `${destination}${parsed.days}日${parsed.style === "relaxed" ? "轻松" : parsed.style === "intensive" ? "充实" : ""}游`;
  const description = `根据「${request.message}」生成的结构化行程。`;

  if (existing) {
    return {
      title,
      destination,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      description,
      status: existing.status,
      days,
      totalBudget: parsed.budgetMax,
    };
  }

  return {
    userId: request.userId ?? DEMO_USER_ID,
    title,
    destination,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    description,
    status: "draft",
    days,
    totalBudget: parsed.budgetMax,
  };
}

function summarizeItinerary(itinerary: Itinerary, source: "amap" | "fallback"): string {
  const activityCount = itinerary.days.reduce(
    (total, day) => total + day.activities.length,
    0
  );
  const sourceText =
    source === "amap" ? "已结合地图 POI 工具筛选地点" : "地图工具不可用时已使用结构化备选地点";
  return `已生成「${itinerary.title}」：${itinerary.startDate} 至 ${itinerary.endDate}，共 ${itinerary.totalDays} 天，安排 ${activityCount} 个地点。${sourceText}，并已写入数据库。`;
}

export async function* runCodexPlanningBridge(
  request: PlannerRequest
): AsyncGenerator<PlanEvent, PlannerResult, unknown> {
  const userId = request.userId ?? DEMO_USER_ID;

  yield { type: "action", action: "set_loading" };
  yield { type: "text", content: "我来拆解需求，并调用后端工具生成行程。\n" };

  await ensurePlanningUser(userId);
  yield {
    type: "tool_result",
    name: "user.ensure",
    data: { userId },
  };

  const existing =
    request.itineraryId && request.itineraryId !== "new"
      ? await getItineraryById(request.itineraryId)
      : null;
  const parsed = parseTravelRequest(request, existing);

  yield {
    type: "tool_result",
    name: "plan.parse_request",
    data: parsed,
  };

  if (!parsed.destination) {
    const text = "我还需要一个目的地。请告诉我想去哪里，以及大概几天。";
    yield { type: "text", content: text };
    yield { type: "action", action: "loading_done" };
    return { itinerary: null, text };
  }

  const preference = await getPreferenceByUserId(userId);
  yield {
    type: "tool_result",
    name: "preference.get",
    data: preference,
  };

  yield {
    type: "text",
    content: `已识别：${parsed.destination}，${parsed.days} 天，${parsed.style === "relaxed" ? "轻松" : parsed.style === "intensive" ? "充实" : "适中"}节奏。正在查询地点并组装行程。\n`,
  };

  const { pois, source } = await findPois(parsed);
  yield {
    type: "tool_result",
    name: "map.search-poi",
    data: {
      source,
      count: pois.length,
      keyword: parsed.keyword,
      sample: pois.slice(0, 5),
    },
  };

  const itineraryInput = buildItineraryInput(request, parsed, pois, existing);
  const validation = validatePlanData({
    userId,
    ...itineraryInput,
  });
  yield { type: "tool_result", name: "plan.validate", data: validation };

  if (!validation.valid) {
    const message = `行程数据校验未通过：${validation.errors
      .map((error) => `${error.path || "data"} ${error.message}`)
      .join("；")}`;
    yield { type: "text", content: message };
    yield { type: "action", action: "loading_done" };
    return { itinerary: null, text: message };
  }

  const budget = estimateItineraryBudget(itineraryInput);
  yield { type: "tool_result", name: "plan.estimate-budget", data: budget };

  const itinerary = existing
    ? await updateItinerary(existing.id, itineraryInput)
    : await createItinerary(itineraryInput);

  yield {
    type: "tool_result",
    name: existing ? "itinerary.update" : "itinerary.create",
    data: { id: itinerary.id, title: itinerary.title },
  };
  yield { type: "itinerary_snapshot", data: itinerary };

  const text = summarizeItinerary(itinerary, source);
  yield { type: "text", content: text };
  yield { type: "action", action: "loading_done" };

  return { itinerary, text };
}
