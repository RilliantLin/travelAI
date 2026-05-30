import { amapApi } from "../lib/api/amap";
import { AppError } from "../contracts/errors";

export interface MapPoi {
  id: string;
  name: string;
  type?: string;
  address?: string;
  city?: string;
  district?: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  cost?: number;
  photos: string[];
}

function parseLngLat(location?: string): { lat: number; lng: number } | null {
  if (!location) return null;
  const [lng, lat] = location.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function geocode(address: string) {
  const result = await amapApi.geocode(address);
  if (!result) {
    throw new AppError("EXTERNAL_SERVICE_ERROR", "地图地理编码失败", 3, 502);
  }
  return {
    address,
    location: result,
  };
}

export async function searchPoi(params: {
  city?: string;
  keyword: string;
  limit?: number;
  location?: string;
  types?: string;
  radius?: number;
}): Promise<MapPoi[]> {
  const response = await amapApi.searchPOI(
    params.keyword,
    params.location ?? "",
    params.types,
    params.radius,
    1,
    params.limit ?? 10,
    params.city
  );

  if (!response) {
    throw new AppError("EXTERNAL_SERVICE_ERROR", "地图 POI 搜索失败", 3, 502);
  }

  const pois: MapPoi[] = [];

  for (const poi of response.pois) {
      const location = parseLngLat(poi.location);
      if (!location) continue;

      pois.push({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        address: poi.address,
        city: poi.cityname,
        district: poi.adname,
        location,
        rating: poi.rating ? Number(poi.rating) : undefined,
        cost: poi.cost ? Number(poi.cost) : undefined,
        photos: (poi.photos ?? []).map((photo) => photo.url).filter(Boolean),
      });
  }

  return pois;
}

export async function getRoute(params: {
  from: string;
  to: string;
  mode?: "driving" | "walking" | "transit" | "bicycling";
}) {
  const response = await amapApi.getRoute(params.from, params.to, params.mode ?? "walking");
  if (!response) {
    throw new AppError("EXTERNAL_SERVICE_ERROR", "地图路线查询失败", 3, 502);
  }

  const path = response.route.paths[0];
  return {
    mode: params.mode ?? "walking",
    from: params.from,
    to: params.to,
    distanceMeters: path ? Number(path.distance) : 0,
    durationSeconds: path ? Number(path.duration) : 0,
    steps:
      path?.steps.map((step) => ({
        instruction: step.instruction,
        road: step.road,
        distanceMeters: Number(step.distance),
        durationSeconds: Number(step.duration),
        polyline: step.polyline,
      })) ?? [],
  };
}
