import { PreferenceFormData, UserPreference } from "@/types/preference";
import { apiRequest, jsonBody } from "./client";

const STORAGE_KEY = "travel-user-preference";

const LOCAL_DEFAULTS: PreferenceFormData = {
  budgetMin: undefined,
  budgetMax: undefined,
  currency: "CNY",
  travelerCount: 1,
  travelStyle: "moderate",
  dietaryRestrictions: [],
  preferredActivities: [],
  transportPreference: "plane",
  accommodationType: "hotel",
  accessibilityNeeds: false,
};

function loadFromLocalStorage(): PreferenceFormData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(data: PreferenceFormData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export async function getPreference(userId: string): Promise<UserPreference | null> {
  const localData = loadFromLocalStorage();

  try {
    const serverPref = await apiRequest<UserPreference | null>(`/preferences/${userId}`);
    if (serverPref) {
      const localForm: PreferenceFormData = {
        budgetMin: serverPref.budgetMin ?? undefined,
        budgetMax: serverPref.budgetMax ?? undefined,
        currency: serverPref.currency || "CNY",
        travelerCount: serverPref.travelerCount || 1,
        travelStyle: (serverPref.travelStyle as PreferenceFormData["travelStyle"]) || "moderate",
        dietaryRestrictions: serverPref.dietaryRestrictions || [],
        preferredActivities: serverPref.preferredActivities || [],
        transportPreference: (serverPref.transportPreference as PreferenceFormData["transportPreference"]) || "plane",
        accommodationType: (serverPref.accommodationType as PreferenceFormData["accommodationType"]) || "hotel",
        accessibilityNeeds: serverPref.accessibilityNeeds || false,
      };
      saveToLocalStorage(localForm);
      return serverPref;
    }
  } catch (error) {
    console.warn("后端偏好加载失败，使用本地缓存:", error);
  }

  if (localData) {
    return {
      userId,
      ...localData,
      id: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as UserPreference;
  }

  return null;
}

export async function savePreference(
  userId: string,
  preference: PreferenceFormData
): Promise<UserPreference> {
  saveToLocalStorage(preference);

  try {
    return await apiRequest<UserPreference>(`/preferences/${userId}`, {
      method: "PUT",
      body: jsonBody(preference),
    });
  } catch (error) {
    console.warn("后端偏好保存失败，数据已保存到本地:", error);
  }

  return {
    userId,
    ...preference,
    id: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as UserPreference;
}

export function getLocalPreference(): PreferenceFormData {
  return loadFromLocalStorage() || { ...LOCAL_DEFAULTS };
}

export function clearLocalPreference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function deletePreference(userId: string): Promise<void> {
  clearLocalPreference();

  try {
    await apiRequest(`/preferences/${userId}`, {
      method: "DELETE",
      unwrap: false,
    });
  } catch (error) {
    console.warn("后端偏好删除失败，已清除本地缓存:", error);
  }
}
