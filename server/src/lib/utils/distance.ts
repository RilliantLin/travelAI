export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function calculateDistanceMatrix(
  locations: Array<{ lat: number; lng: number }>
): number[][] {
  const matrix: number[][] = [];
  for (let i = 0; i < locations.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < locations.length; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          locations[i].lat,
          locations[i].lng,
          locations[j].lat,
          locations[j].lng
        );
      }
    }
  }
  return matrix;
}

export function findNearestPoint(
  target: { lat: number; lng: number },
  points: Array<{ lat: number; lng: number; id?: string }>
): { point: typeof points[0]; distance: number; index: number } | null {
  if (points.length === 0) return null;

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  points.forEach((point, index) => {
    const distance = calculateDistance(
      target.lat,
      target.lng,
      point.lat,
      point.lng
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    point: points[nearestIndex],
    distance: nearestDistance,
    index: nearestIndex,
  };
}

export function calculateTotalDistance(
  points: Array<{ lat: number; lng: number }>
): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    );
  }
  return totalDistance;
}

export function isWithinRadius(
  center: { lat: number; lng: number },
  point: { lat: number; lng: number },
  radiusKm: number
): boolean {
  const distance = calculateDistance(
    center.lat,
    center.lng,
    point.lat,
    point.lng
  );
  return distance <= radiusKm;
}

export function getBoundingBox(
  center: { lat: number; lng: number },
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const latChange = radiusKm / 111.32;
  const lngChange = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

  return {
    minLat: center.lat - latChange,
    maxLat: center.lat + latChange,
    minLng: center.lng - lngChange,
    maxLng: center.lng + lngChange,
  };
}
