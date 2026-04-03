export interface UserPreference {
  id: string;
  userId: string;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  travelerCount: number;
  travelStyle: "relaxed" | "moderate" | "intensive" | null;
  dietaryRestrictions: string[];
  preferredActivities: string[];
  transportPreference: "plane" | "train" | "car" | "bus" | null;
  accommodationType: "hotel" | "hostel" | "apartment" | "resort" | null;
  accessibilityNeeds: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceFormData {
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  travelerCount?: number;
  travelStyle?: "relaxed" | "moderate" | "intensive";
  dietaryRestrictions?: string[];
  preferredActivities?: string[];
  transportPreference?: "plane" | "train" | "car" | "bus";
  accommodationType?: "hotel" | "hostel" | "apartment" | "resort";
  accessibilityNeeds?: boolean;
}

export const TRAVEL_STYLES = [
  { value: "relaxed", label: "休闲放松", description: "行程宽松，充分休息" },
  { value: "moderate", label: "适中平衡", description: "劳逸结合，张弛有度" },
  { value: "intensive", label: "紧凑充实", description: "行程紧凑，尽可能多体验" },
] as const;

export const TRANSPORT_PREFERENCES = [
  { value: "plane", label: "飞机", icon: "✈️" },
  { value: "train", label: "高铁/火车", icon: "🚄" },
  { value: "car", label: "自驾", icon: "🚗" },
  { value: "bus", label: "大巴", icon: "🚌" },
] as const;

export const ACCOMMODATION_TYPES = [
  { value: "hotel", label: "酒店", icon: "🏨" },
  { value: "hostel", label: "青旅", icon: "🛏️" },
  { value: "apartment", label: "公寓/民宿", icon: "🏠" },
  { value: "resort", label: "度假村", icon: "🏝️" },
] as const;

export const DIETARY_OPTIONS = [
  "素食",
  "清真",
  "无麸质",
  "低糖",
  "低脂",
  "海鲜过敏",
  "花生过敏",
  "乳糖不耐受",
] as const;

export const ACTIVITY_OPTIONS = [
  "自然风光",
  "历史文化",
  "美食探索",
  "购物血拼",
  "户外运动",
  "艺术展览",
  "夜生活",
  "亲子活动",
  "摄影打卡",
  "休闲度假",
] as const;
