import { Platform } from "react-native";
import { placeSearch } from "../places/service";
import type { Place } from "../domain/passenger";

let mockModule: any;
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
  await expect(placeSearch.suggest("Ex", "session")).rejects.toThrow(
    "updated Vooma app",
  );
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
