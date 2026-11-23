import { ApiError, passengerApi } from "./passenger";
import type { ServiceId } from "../domain/passenger";
export type NearbyCar = {
  id: string;
  location: { latitude: number; longitude: number };
  capturedAt: number;
  category: ServiceId;
  bodyType: string | null;
  distanceMeters: number;
  pickupSeconds: number | null;
  pickupDistanceMeters: number | null;
};
export type Nearby = {
  generatedAt: number;
  radiusMeters: number;
  expanded: boolean;
  maxPickupSeconds: number;
  cars: NearbyCar[];
  categories: {
    id: ServiceId;
    name: string;
    seats: number;
    available: number;
    pickupSeconds: number | null;
  }[];
};
export function decodeNearby(value: unknown): Nearby {
  const data = value as Nearby;
  const nonnegative = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && n >= 0;
  const nullable = (n: unknown) => n === null || nonnegative(n);
  const category = (id: unknown) =>
    ["go", "comfort", "xl"].includes(String(id));
  if (
    !data ||
    !nonnegative(data.generatedAt) ||
    !nonnegative(data.radiusMeters) ||
    typeof data.expanded !== "boolean" ||
    !nonnegative(data.maxPickupSeconds) ||
    !Array.isArray(data.cars) ||
    !Array.isArray(data.categories) ||
    !data.cars.every(
      (car) =>
        car &&
        typeof car.id === "string" &&
        category(car.category) &&
        car.location &&
        Number.isFinite(car.location.latitude) &&
        Math.abs(car.location.latitude) <= 90 &&
        Number.isFinite(car.location.longitude) &&
        Math.abs(car.location.longitude) <= 180 &&
        nonnegative(car.capturedAt) &&
        nonnegative(car.distanceMeters) &&
        nullable(car.pickupSeconds) &&
        nullable(car.pickupDistanceMeters),
    ) ||
    !data.categories.every(
      (c) =>
        c &&
        category(c.id) &&
        typeof c.name === "string" &&
        nonnegative(c.seats) &&
        Number.isInteger(c.available) &&
        c.available >= 0 &&
        nullable(c.pickupSeconds),
    )
  )
    throw new ApiError(0, "Nearby cars could not be loaded. Please try again.");
  return data;
}
export async function loadNearby(
  pickup: { latitude: number; longitude: number },
  token: string,
  signal?: AbortSignal,
) {
  return decodeNearby(
    await passengerApi.discovery(
      "/v1/passenger/nearby",
      { pickup },
      token,
      signal,
    ),
  );
}
