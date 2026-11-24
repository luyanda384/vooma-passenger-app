export type RoutePoint = { latitude: number; longitude: number };
export type RideTracking = {
  provider: "google";
  target: "pickup" | "destination";
  origin: RoutePoint;
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
  calculatedAt: number;
  expiresAt: number;
};
const validPoint = (p: RoutePoint) =>
  p &&
  Number.isFinite(p.latitude) &&
  Math.abs(p.latitude) <= 90 &&
  Number.isFinite(p.longitude) &&
  Math.abs(p.longitude) <= 180;
export function decodePolyline(encoded: string): RoutePoint[] | null {
  if (!encoded.length || encoded.length > 200000) return null;
  let index = 0,
    latitude = 0,
    longitude = 0;
  const points: RoutePoint[] = [];
  function next(): number | null {
    let result = 0,
      shift = 0;
    while (index < encoded.length && shift <= 30) {
      const byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) return null;
      result += (byte & 31) * 2 ** shift;
      if (byte < 32)
        return result % 2 ? -(Math.floor(result / 2) + 1) : result / 2;
      shift += 5;
    }
    return null;
  }
  while (index < encoded.length) {
    const lat = next(),
      lng = next();
    if (lat === null || lng === null) return null;
    latitude += lat;
    longitude += lng;
    const point = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (!validPoint(point) || points.length >= 20000) return null;
    points.push(point);
  }
  return points.length >= 2 ? points : null;
}
export function decodeTracking(value: unknown): RideTracking | null {
  const r = value as RideTracking;
  if (
    !r ||
    r.provider !== "google" ||
    !["pickup", "destination"].includes(r.target) ||
    !validPoint(r.origin) ||
    !Number.isFinite(r.distanceMeters) ||
    r.distanceMeters < 0 ||
    !Number.isFinite(r.durationSeconds) ||
    r.durationSeconds < 0 ||
    !Number.isFinite(r.calculatedAt) ||
    !Number.isFinite(r.expiresAt) ||
    r.expiresAt <= r.calculatedAt ||
    r.expiresAt - r.calculatedAt > 30000 ||
    typeof r.encodedPolyline !== "string" ||
    !decodePolyline(r.encodedPolyline)
  )
    return null;
  return r;
}
export function freshTracking(
  tracking: RideTracking | null | undefined,
  now = Date.now(),
) {
  return tracking &&
    tracking.calculatedAt <= now + 5000 &&
    tracking.expiresAt > now
    ? tracking
    : null;
}
export function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.max(0, Math.round(meters / 10) * 10)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
export function formatEta(seconds: number) {
  return seconds < 60 ? "<1 min" : `${Math.ceil(seconds / 60)} min`;
}
