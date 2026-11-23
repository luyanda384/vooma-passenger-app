import { mapsUrl, nativeMapProvider } from "../features/map/model";
import { places } from "../domain/passenger";

test.each([
  ["android", true, {}, "google"],
  ["android", false, { googleMapsAndroid: true }, "google"],
  ["android", false, {}, null],
  ["ios", true, { googleMapsAndroid: true, googleMapsIos: true }, "apple"],
  ["ios", false, { googleMapsAndroid: true, googleMapsIos: true }, "apple"],
  ["ios", false, {}, "apple"],
] as const)(
  "selects the available provider for %s (Expo Go: %s, config: %j)",
  (os, expoGo, config, expected) => {
    expect(nativeMapProvider(os, expoGo, config)).toBe(expected);
  },
);

test("Google directions preserve the selected endpoints instead of using the device position", () => {
  const url = new URL(
    mapsUrl("google", { pickup: places[0], destination: places[2] }),
  );
  expect(url.searchParams.get("api")).toBe("1");
  expect(url.searchParams.get("origin")).toBe("-26.1076,28.0567");
  expect(url.searchParams.get("destination")).toBe("-26.1367,28.2411");
  expect(url.searchParams.get("travelmode")).toBe("driving");
});

test("Apple directions use the selected endpoints and driving mode", () => {
  const url = new URL(
    mapsUrl("apple", { pickup: places[0], destination: places[2] }),
  );
  expect(url.searchParams.get("saddr")).toBe("-26.1076,28.0567");
  expect(url.searchParams.get("daddr")).toBe("-26.1367,28.2411");
  expect(url.searchParams.get("dirflg")).toBe("d");
});

test("a pickup alone opens a place, with special characters safely encoded", () => {
  const pickup = { ...places[0], name: "Pickup & coffee #1" };
  const apple = new URL(mapsUrl("apple", { pickup }));
  expect(apple.searchParams.get("q")).toBe(pickup.name);
  expect(apple.searchParams.has("daddr")).toBe(false);
  const google = new URL(mapsUrl("google", { pickup }));
  expect(google.pathname).toBe("/maps/search/");
  expect(google.searchParams.get("query")).toBe("-26.1076,28.0567");
});
