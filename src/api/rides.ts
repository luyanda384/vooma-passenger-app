import { passengerApi, ApiError } from "./passenger";
import type { Place, ServiceId } from "../domain/passenger";
import { decodeTracking, type RideTracking } from "./ride-tracking";
export type LiveRide = {
  id: string;
  status:
    | "requested"
    | "matched"
    | "arriving"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "expired";
  category: ServiceId;
  tracking?: RideTracking | null;
  version: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  pickup: Pick<Place, "name" | "address" | "latitude" | "longitude">;
  destination: Pick<Place, "name" | "address" | "latitude" | "longitude">;
  driver: {
    name: string;
    vehicle: { plate: string; make: string; model: string; colour: string };
    location: {
      latitude: number;
      longitude: number;
      capturedAt: number;
    } | null;
  } | null;
};
export const rideActive = (ride: LiveRide | null) =>
  !!ride &&
  ["requested", "matched", "arriving", "in_progress"].includes(ride.status);
export function decodeRide(value: unknown): LiveRide | null {
  const data = value as { ride: LiveRide | null };
  if (data?.ride === null) return null;
  const ride = data?.ride;
  const validPoint = (p: unknown) =>
    !!p &&
    typeof p === "object" &&
    typeof (p as Place).name === "string" &&
    typeof (p as Place).address === "string" &&
    Number.isFinite((p as Place).latitude) &&
    Math.abs((p as Place).latitude) <= 90 &&
    Number.isFinite((p as Place).longitude) &&
    Math.abs((p as Place).longitude) <= 180;
  if (
    !ride ||
    typeof ride.id !== "string" ||
    ![
      "requested",
      "matched",
      "arriving",
      "in_progress",
      "completed",
      "cancelled",
      "expired",
    ].includes(ride.status) ||
    !["go", "comfort", "xl"].includes(ride.category) ||
    !Number.isInteger(ride.version) ||
    ride.version < 1 ||
    !validPoint(ride.pickup) ||
    !validPoint(ride.destination) ||
    !Number.isFinite(ride.createdAt) ||
    !Number.isFinite(ride.updatedAt) ||
    !Number.isFinite(ride.expiresAt)
  )
    throw new ApiError(0, "The ride could not be loaded. Please retry.");
  if (ride.driver) {
    const d = ride.driver;
    if (
      typeof d.name !== "string" ||
      !d.vehicle ||
      ![
        d.vehicle.plate,
        d.vehicle.make,
        d.vehicle.model,
        d.vehicle.colour,
      ].every((s) => typeof s === "string") ||
      (d.location &&
        (!Number.isFinite(d.location.latitude) ||
          Math.abs(d.location.latitude) > 90 ||
          !Number.isFinite(d.location.longitude) ||
          Math.abs(d.location.longitude) > 180 ||
          !Number.isFinite(d.location.capturedAt)))
    )
      throw new ApiError(0, "The driver could not be loaded. Please retry.");
  }
  return { ...ride, tracking: decodeTracking(ride.tracking) };
}
export const ridePlace = (p: Place) => ({
  name: p.name,
  address: p.address,
  latitude: p.latitude,
  longitude: p.longitude,
});
export const ridesApi = {
  history: async (token: string, signal?: AbortSignal) => {
    const data = (await passengerApi.ride(
      "/v1/passenger/rides",
      token,
      undefined,
      signal,
    )) as { rides: unknown[] };
    if (!data || !Array.isArray(data.rides))
      throw new ApiError(0, "Your rides could not be loaded.");
    return data.rides
      .map((ride) => decodeRide({ ride }))
      .filter((ride): ride is LiveRide => ride !== null);
  },
  current: async (token: string, signal?: AbortSignal) =>
    decodeRide(
      await passengerApi.ride(
        "/v1/passenger/rides/current",
        token,
        undefined,
        signal,
      ),
    ),
  request: async (
    token: string,
    input: {
      requestId: string;
      category: ServiceId;
      pickup: Place;
      destination: Place;
    },
    signal?: AbortSignal,
  ) =>
    decodeRide(
      await passengerApi.ride(
        "/v1/passenger/rides",
        token,
        {
          ...input,
          pickup: ridePlace(input.pickup),
          destination: ridePlace(input.destination),
        },
        signal,
      ),
    ),
  cancel: async (token: string, ride: LiveRide, signal?: AbortSignal) =>
    decodeRide(
      await passengerApi.ride(
        `/v1/passenger/rides/${encodeURIComponent(ride.id)}/cancel`,
        token,
        { expectedVersion: ride.version },
        signal,
      ),
    ),
};
