import { PreferenceFormData, UserPreference } from "@/types/preference";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getPreference(userId: string): Promise<UserPreference | null> {
  const response = await fetch(`${API_BASE_URL}/preferences/${userId}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    return null;
  }

  return data.data;
}

export async function savePreference(
  userId: string,
  preference: PreferenceFormData
): Promise<UserPreference> {
  const response = await fetch(`${API_BASE_URL}/preferences/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "保存偏好失败");
  }

  return data.data;
}

export async function deletePreference(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/preferences/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "删除偏好失败");
  }
}
