import { Itinerary } from "@/types/itinerary";
import { apiRequest, jsonBody } from "./client";

export type ItineraryCreateRequest = {
  userId: string;
  title?: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: Itinerary["status"];
  days?: Itinerary["days"];
  budget?: unknown;
  totalBudget?: number;
};

export type ItineraryUpdateRequest = Partial<
  Pick<
    Itinerary,
    | "userId"
    | "title"
    | "destination"
    | "startDate"
    | "endDate"
    | "description"
    | "status"
    | "days"
    | "tags"
  >
> & {
  budget?: unknown;
  totalBudget?: number | null;
};

export async function getItinerary(id: string): Promise<Itinerary | null> {
  try {
    return await apiRequest<Itinerary>(`/itineraries/${id}`);
  } catch {
    return null;
  }
}

export async function getItineraries(params?: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ itineraries: Itinerary[]; total: number }> {
  try {
    const data = await apiRequest<Itinerary[] | { itineraries?: Itinerary[]; total?: number }>(
      "/itineraries",
      { params }
    );
    const itineraries = Array.isArray(data) ? data : data.itineraries ?? [];

    return {
      itineraries,
      total: Array.isArray(data) ? data.length : data.total ?? itineraries.length,
    };
  } catch {
    return { itineraries: [], total: 0 };
  }
}

export async function createItinerary(params: ItineraryCreateRequest): Promise<Itinerary> {
  return apiRequest<Itinerary>("/itineraries", {
    method: "POST",
    body: jsonBody(params),
  });
}

export async function updateItinerary(
  id: string,
  params: ItineraryUpdateRequest
): Promise<Itinerary> {
  return apiRequest<Itinerary>(`/itineraries/${id}`, {
    method: "PUT",
    body: jsonBody(params),
  });
}

export async function deleteItinerary(id: string): Promise<void> {
  await apiRequest(`/itineraries/${id}`, {
    method: "DELETE",
    unwrap: false,
  });
}
