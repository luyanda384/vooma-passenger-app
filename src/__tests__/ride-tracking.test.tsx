import { render, screen } from "@testing-library/react-native";
import { LiveRideCard } from "../features/LiveRideCard";
import { decodeTracking, freshTracking } from "../api/ride-tracking";
import { places } from "../domain/passenger";
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
const now = Date.now();
const tracking = {
  provider: "google" as const,
  target: "pickup" as const,
  origin: { latitude: -26.1, longitude: 28.05 },
  distanceMeters: 1800,
  durationSeconds: 240,
  encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
  calculatedAt: now,
  expiresAt: now + 30000,
};
test("ride card distinguishes road distance, traffic ETA and driver-declared arrival", () => {
  render(
    <LiveRideCard
      ride={{
        id: "ride",
        status: "matched",
        category: "go",
        version: 2,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 120000,
        pickup: places[0],
        destination: places[1],
        tracking,
        driver: {
          name: "Thabo",
          vehicle: {
            plate: "TEST GP",
            make: "Toyota",
            model: "Corolla",
            colour: "White",
          },
          location: { latitude: -26.1, longitude: 28.05, capturedAt: now },
        },
      }}
      busy={false}
      onCancel={jest.fn()}
    />,
  );
  expect(screen.getByText("4 min")).toBeTruthy();
  expect(screen.getByText("1.8 km")).toBeTruthy();
  expect(screen.getByText("by road")).toBeTruthy();
  expect(screen.queryByText("Your driver has arrived")).toBeNull();
});
test("invalid and expired routes cannot become a claimed ETA", () => {
  expect(decodeTracking(tracking)).toEqual(tracking);
  expect(decodeTracking({ ...tracking, durationSeconds: Infinity })).toBeNull();
  expect(decodeTracking({ ...tracking, encodedPolyline: "?" })).toBeNull();
  expect(
    decodeTracking({ ...tracking, origin: { latitude: 95, longitude: 0 } }),
  ).toBeNull();
  expect(freshTracking(tracking, now + 30000)).toBeNull();
  expect(freshTracking(tracking, now - 6000)).toBeNull();
});
