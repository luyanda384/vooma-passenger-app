import { Platform } from "react-native";
import { placeSearch } from "../places/service";
import type { Place } from "../domain/passenger";
import { ApiError, createPassengerApi, passengerApi } from "../api/passenger";

let mockModule: any;
jest.mock("../api/sessionStorage", () => ({
  sessionStorage: { read: jest.fn(async () => "passenger-token") },
}));
jest.mock("../api/passenger", () => ({
  ...jest.requireActual("../api/passenger"),
  passengerApi: { discovery: jest.fn(async () => []) },
}));
jest.mock("expo", () => ({ requireOptionalNativeModule: () => mockModule }));
const place: Place = {
  id: "google:one",
  name: "Provider place",
  address: "1 Example Street",
  latitude: -26.2,
  longitude: 28,
  provider: "google",
  providerId: "one",
};
beforeEach(() => {
  jest.replaceProperty(Platform, "OS", "android");
  mockModule = {
    search: jest.fn().mockResolvedValue([]),
    resolve: jest.fn().mockResolvedValue(place),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
});
afterEach(() => jest.restoreAllMocks());

test("native suggestions receive query and pickup bias, with no sample fallback", async () => {
  expect(
    await placeSearch.suggest(" Ex ", "session", {
      latitude: -26,
      longitude: 28,
    }),
  ).toEqual([]);
  expect(mockModule.search).toHaveBeenCalledWith("Ex", -26, 28, "session");
  mockModule = null;
  expect(await placeSearch.suggest("Ex", "session")).toEqual([]);
});

test("Google favourites fetch fresh details; invalid coordinates are rejected", async () => {
  const bookmark = {
    id: "google:one",
    label: "Home",
    provider: "google" as const,
    providerId: "one",
  };
  expect(await placeSearch.saved(bookmark, "session")).toEqual(place);
  expect(mockModule.resolve).toHaveBeenCalledWith("one", "session");
  mockModule.resolve.mockResolvedValue({ ...place, latitude: 100 });
  await expect(placeSearch.resolve("one", "session")).rejects.toThrow(
    "valid location",
  );
  jest.replaceProperty(Platform, "OS", "ios");
  await expect(placeSearch.saved(bookmark, "session")).rejects.toThrow(
    "Apple Maps",
  );
});

test("Apple favourites remain usable on iOS and closing the picker ends its session", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  const apple = { ...place, id: "apple:one", provider: "apple" as const };
  expect(
    await placeSearch.saved(
      { id: apple.id, provider: "apple", label: "Work", place: apple },
      "session",
    ),
  ).toEqual(apple);
  expect(mockModule.resolve).not.toHaveBeenCalled();
  placeSearch.end("session");
  expect(mockModule.endSession).toHaveBeenCalledWith("session");
});

test("web search and selected details use the authenticated API; Google favourites re-resolve", async () => {
  jest.replaceProperty(Platform, "OS", "web");
  const discovery = jest.mocked(passengerApi.discovery);
  discovery
    .mockResolvedValueOnce([
      { id: "one", title: "Example", subtitle: "Sandton", provider: "google" },
    ])
    .mockResolvedValue(place);
  expect(await placeSearch.suggest("Example", "search-session")).toHaveLength(
    1,
  );
  expect(discovery).toHaveBeenCalledWith(
    "/v1/passenger/places/search",
    { query: "Example", session: "search-session" },
    "passenger-token",
  );
  expect(await placeSearch.resolve("one", "search-session")).toEqual(place);
  expect(
    await placeSearch.saved(
      {
        id: "google:one",
        provider: "google",
        providerId: "one",
        label: "Work",
      },
      "new-session",
    ),
  ).toEqual(place);
  expect(mockModule.search).not.toHaveBeenCalled();
});

test("a full pickup place sends only coordinates as the search bias", async () => {
  jest.replaceProperty(Platform, "OS", "web");
  const discovery = jest.mocked(passengerApi.discovery);
  discovery.mockResolvedValueOnce([]);
  const pickup: Place = {
    id: "current-location",
    name: "Current location",
    address: "Live GPS pickup",
    latitude: -26.1076,
    longitude: 28.0567,
  };
  await placeSearch.suggest("Sandton", "search-session", pickup);
  expect(discovery).toHaveBeenLastCalledWith(
    "/v1/passenger/places/search",
    {
      query: "Sandton",
      session: "search-session",
      bias: { latitude: pickup.latitude, longitude: pickup.longitude },
    },
    "passenger-token",
  );
});

test.each([
  [401, "Your session expired. Sign in again."],
  [429, "Please wait before refreshing again."],
  [503, "Address search is temporarily unavailable. Please try again later."],
])(
  "address search preserves the useful message for HTTP %s",
  async (status, message) => {
    jest.replaceProperty(Platform, "OS", "web");
    jest
      .mocked(passengerApi.discovery)
      .mockRejectedValueOnce(new ApiError(status, message));
    await expect(placeSearch.suggest("Sandton", "session")).rejects.toThrow(
      message,
    );
  },
);

test("a provider outage is not reported as a connection error", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: false,
    status: 503,
  })) as unknown as typeof fetch;
  try {
    const api = createPassengerApi(() => "https://api.example.test");
    await expect(
      api.discovery(
        "/v1/passenger/places/search",
        { query: "Sandton", session: "session" },
        "token",
      ),
    ).rejects.toThrow(
      "Address search is temporarily unavailable. Please try again later.",
    );
  } finally {
    global.fetch = originalFetch;
  }
});
