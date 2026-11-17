export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};
export const places: Place[] = [
  {
    id: "sandton",
    name: "Sandton City",
    address: "83 Rivonia Road, Sandton",
    latitude: -26.1076,
    longitude: 28.0567,
  },
  {
    id: "rosebank",
    name: "Rosebank Mall",
    address: "50 Bath Avenue, Rosebank",
    latitude: -26.1467,
    longitude: 28.0414,
  },
  {
    id: "airport",
    name: "O.R. Tambo International Airport",
    address: "Terminal A, arrivals pickup",
    latitude: -26.1367,
    longitude: 28.2411,
  },
  {
    id: "gautrain",
    name: "Sandton Gautrain Station",
    address: "West Street, Sandown",
    latitude: -26.1078,
    longitude: 28.0578,
  },
  {
    id: "melrose",
    name: "Melrose Arch",
    address: "60 Melrose Boulevard, Johannesburg",
    latitude: -26.1335,
    longitude: 28.0687,
  },
  {
    id: "maboneng",
    name: "Maboneng Precinct",
    address: "Fox Street, Johannesburg",
    latitude: -26.2042,
    longitude: 28.0593,
  },
  {
    id: "fourways",
    name: "Fourways Mall",
    address: "11 Ruby Close, Fourways",
    latitude: -26.0185,
    longitude: 28.0076,
  },
  {
    id: "park",
    name: "Zoo Lake",
    address: "Prince of Wales Drive, Parkview",
    latitude: -26.1598,
    longitude: 28.0282,
  },
];
export const services = [
  {
    id: "go",
    name: "Vooma Go",
    description: "Your everyday ride",
    seats: 4,
    base: 2600,
    perKm: 1100,
    minimum: 4000,
    icon: "car-sport-outline",
  },
  {
    id: "comfort",
    name: "Vooma Comfort",
    description: "A little extra room",
    seats: 4,
    base: 3600,
    perKm: 1550,
    minimum: 5500,
    icon: "car-outline",
  },
  {
    id: "xl",
    name: "Vooma XL",
    description: "Bring the whole crew",
    seats: 6,
    base: 4500,
    perKm: 1900,
    minimum: 7000,
    icon: "bus-outline",
  },
] as const;
export type ServiceId = (typeof services)[number]["id"];
export type RideStatus =
  | "scheduled"
  | "requested"
  | "matched"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled";
export type Ride = {
  id: string;
  pickup: Place;
  destination: Place;
  service: ServiceId;
  fare: number;
  distanceKm: number;
  minutes: number;
  createdAt: string;
  scheduledAt: string | null;
  status: RideStatus;
  rating: number | null;
};
export type PassengerState = {
  version: 1;
  welcomed: boolean;
  name: string;
  saved: string[];
  rides: Ride[];
};
export const initialState: PassengerState = {
  version: 1,
  welcomed: false,
  name: "",
  saved: [],
  rides: [],
};
export const statusLabels: Record<RideStatus, string> = {
  scheduled: "Scheduled",
  requested: "Finding a ride",
  matched: "Driver matched",
  arriving: "Driver at pickup",
  in_progress: "On your way",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const isActive = (ride: Ride) =>
  ride.status !== "completed" && ride.status !== "cancelled";
export function money(cents: number) {
  return `R ${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 2 }).format(cents / 100)}`;
}
export function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(iso));
}
export function quote(pickup: Place, destination: Place, serviceId: ServiceId) {
  const radians = (v: number) => (v * Math.PI) / 180;
  const a =
    Math.sin(radians(destination.latitude - pickup.latitude) / 2) ** 2 +
    Math.cos(radians(pickup.latitude)) *
      Math.cos(radians(destination.latitude)) *
      Math.sin(radians(destination.longitude - pickup.longitude) / 2) ** 2;
  const distanceKm =
    Math.round(6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a))) * 1.3 * 10) / 10;
  const service = services.find((s) => s.id === serviceId)!;
  return {
    distanceKm,
    minutes: Math.max(4, Math.round(distanceKm * 2.5)),
    fare: Math.max(
      service.minimum,
      Math.round((service.base + distanceKm * service.perKm) / 100) * 100,
    ),
  };
}
export function createRide(
  state: PassengerState,
  input: {
    pickup: Place;
    destination: Place;
    service: ServiceId;
    scheduledAt: string | null;
  },
  now = Date.now(),
): Ride {
  if (state.rides.some(isActive))
    throw new Error("Finish or cancel your current demo ride first.");
  if (!validPlace(input.pickup) || !validPlace(input.destination))
    throw new Error("Select a valid pickup and destination.");
  const estimate = quote(input.pickup, input.destination, input.service);
  if (estimate.distanceKm < 0.2)
    throw new Error(
      "Choose a destination at least 200 metres from your pickup.",
    );
  if (estimate.distanceKm > 150)
    throw new Error(
      "This demo supports trips within 150 km. Choose a closer pickup and destination.",
    );
  if (
    input.scheduledAt &&
    (!validDate(input.scheduledAt) ||
      Date.parse(input.scheduledAt) < now + 300000)
  )
    throw new Error("Choose a pickup time at least 5 minutes from now.");
  return {
    ...input,
    ...estimate,
    id: `VP-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date(now).toISOString(),
    status: input.scheduledAt ? "scheduled" : "requested",
    rating: null,
  };
}
const nextStatus: Partial<Record<RideStatus, RideStatus>> = {
  scheduled: "requested",
  requested: "matched",
  matched: "arriving",
  arriving: "in_progress",
  in_progress: "completed",
};
export function advanceRide(ride: Ride): Ride {
  const status = nextStatus[ride.status];
  if (!status) throw new Error("This ride has already ended.");
  return { ...ride, status };
}
export function cancelRide(ride: Ride): Ride {
  if (!isActive(ride) || ride.status === "in_progress")
    throw new Error("This ride cannot be cancelled.");
  return { ...ride, status: "cancelled" };
}
export function rateRide(ride: Ride, rating: number): Ride {
  if (
    ride.status !== "completed" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  )
    throw new Error("Rate a completed ride from 1 to 5 stars.");
  return { ...ride, rating };
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const validDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
function validPlace(value: unknown): value is Place {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.address === "string" &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180
  );
}
function validRide(value: unknown): value is Ride {
  return (
    record(value) &&
    typeof value.id === "string" &&
    validPlace(value.pickup) &&
    validPlace(value.destination) &&
    services.some((s) => s.id === value.service) &&
    typeof value.status === "string" &&
    Object.hasOwn(statusLabels, value.status) &&
    Number.isSafeInteger(value.fare) &&
    Number(value.fare) >= 0 &&
    typeof value.distanceKm === "number" &&
    Number.isFinite(value.distanceKm) &&
    value.distanceKm >= 0 &&
    Number.isSafeInteger(value.minutes) &&
    Number(value.minutes) >= 0 &&
    validDate(value.createdAt) &&
    (value.scheduledAt === null || validDate(value.scheduledAt)) &&
    (value.rating === null ||
      (value.status === "completed" &&
        Number.isInteger(value.rating) &&
        Number(value.rating) >= 1 &&
        Number(value.rating) <= 5))
  );
}
export function parseState(raw: string | null): PassengerState {
  if (raw === null) return { ...initialState, saved: [], rides: [] };
  const value: unknown = JSON.parse(raw);
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.welcomed !== "boolean" ||
    typeof value.name !== "string" ||
    value.name.length > 60 ||
    !Array.isArray(value.saved) ||
    !value.saved.every((id) => places.some((p) => p.id === id)) ||
    !Array.isArray(value.rides) ||
    !value.rides.every(validRide) ||
    value.rides.filter(isActive).length > 1 ||
    new Set(value.rides.map((ride) => ride.id)).size !== value.rides.length
  )
    throw new Error("Saved demo data could not be read.");
  return value as PassengerState;
}
