import { render } from "@testing-library/react-native";
import { Image, Platform } from "react-native";
import { Marker } from "react-native-maps";
import { CarMarker } from "../features/map/CarMarker";
jest.mock("react-native-maps", () => ({
  Marker: jest.fn(({ children }) => children),
}));
jest.mock("../features/map/useCarMotion", () => ({
  useCarMotion: () => ({
    coordinate: { latitude: -26, longitude: 28 },
    heading: 100,
  }),
}));
const car = {
  id: "assigned-driver",
  category: "go" as const,
  bodyType: null,
  location: { latitude: -26, longitude: 28 },
  capturedAt: Date.now(),
  distanceMeters: 1000,
  pickupSeconds: 240,
  pickupDistanceMeters: 1800,
};
afterEach(() => jest.restoreAllMocks());
test("MapKit rotates the image relative to camera heading; Google rotates the geographic marker", () => {
  jest.replaceProperty(Platform, "OS", "ios");
  const app = render(<CarMarker car={car} apple cameraHeading={40} />);
  expect(app.UNSAFE_getByType(Image).props.style.transform).toEqual([
    { rotate: "60deg" },
  ]);
  expect(jest.mocked(Marker).mock.lastCall![0].rotation).toBe(0);
  app.rerender(<CarMarker car={car} apple={false} cameraHeading={40} />);
  expect(app.UNSAFE_getByType(Image).props.style.transform).toBeUndefined();
  expect(jest.mocked(Marker).mock.lastCall![0].rotation).toBe(100);
});
