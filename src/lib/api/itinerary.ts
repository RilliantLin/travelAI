import { Itinerary } from "@/types/itinerary";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getItinerary(id: string): Promise<Itinerary | null> {
  const response = await fetch(`${API_BASE_URL}/itineraries/${id}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    return null;
  }

  return data.data;
}

export async function getItineraries(params?: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ itineraries: Itinerary[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.userId) searchParams.set("userId", params.userId);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const response = await fetch(
    `${API_BASE_URL}/itineraries?${searchParams.toString()}`
  );
  const data = await response.json();

  if (!response.ok || !data.success) {
    return { itineraries: [], total: 0 };
  }

  return {
    itineraries: data.data.itineraries || data.data || [],
    total: data.data.total || 0,
  };
}

export async function createItinerary(params: {
  destination: string;
  startDate: string;
  endDate: string;
  userId: string;
  title?: string;
  description?: string;
}): Promise<Itinerary> {
  const response = await fetch(`${API_BASE_URL}/itineraries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "创建行程失败");
  }

  return data.data;
}

export async function updateItinerary(
  id: string,
  params: Partial<Pick<Itinerary, "title" | "description" | "status" | "tags">>
): Promise<Itinerary> {
  const response = await fetch(`${API_BASE_URL}/itineraries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "更新行程失败");
  }

  return data.data;
}

export async function deleteItinerary(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/itineraries/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "删除行程失败");
  }
}
