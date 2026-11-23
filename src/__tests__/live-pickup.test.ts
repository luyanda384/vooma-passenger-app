import { classifyFix, type LocationFix } from "../location/controller";
import { pickupFromLocation } from "../location/useLivePickup";

jest.mock("../location/useLocation", () => ({ useLocation: jest.fn() }));
const fix = (): LocationFix => ({
  timestamp: Date.now(),
  accuracy: 10,
  latitude: -26.1,
  longitude: 28.05,
});

test("only a recent, accurate coordinate becomes a live pickup", () => {
  expect(pickupFromLocation({ status: "ready", fix: fix() })).toMatchObject({
    id: "current-location",
    latitude: -26.1,
    longitude: 28.05,
  });
  expect(
    pickupFromLocation({
      status: "ready",
      fix: { ...fix(), timestamp: Date.now() - 31000 },
    }),
  ).toBeNull();
  expect(
    pickupFromLocation({ status: "ready", fix: { ...fix(), accuracy: 500 } }),
  ).toBeNull();
  expect(pickupFromLocation({ status: "paused", fix: fix() })).toBeNull();
});

test.each([NaN, Infinity, 91, -91])(
  "invalid latitude %s cannot be used for pickup",
  (latitude) => {
    expect(classifyFix({ ...fix(), latitude }, Date.now())).toBe("error");
    expect(
      pickupFromLocation({ status: "ready", fix: { ...fix(), latitude } }),
    ).toBeNull();
  },
);
