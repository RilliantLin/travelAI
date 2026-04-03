import { PreferenceFormData, UserPreference } from "@/types/preference";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
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
    const response = await fetch(`${API_BASE_URL}/preferences/${userId}`);
    const data = await response.json();

    if (response.ok && data.success && data.data) {
      const serverPref = data.data as UserPreference;
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
    const response = await fetch(`${API_BASE_URL}/preferences/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("后端偏好保存失败，数据已保存到本地:", data.message);
    }

    if (response.ok && data.data) {
      return data.data;
    }
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
    const response = await fetch(`${API_BASE_URL}/preferences/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "删除偏好失败");
    }
  } catch (error) {
    console.warn("后端偏好删除失败，已清除本地缓存:", error);
  }
}
