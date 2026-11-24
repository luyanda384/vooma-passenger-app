import { act, renderHook } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { useCarMotion, turn } from "../features/map/useCarMotion";
beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test("car moves between observed fixes, turns the shortest way and stops at the latest fix", async () => {
  const start = { latitude: -26, longitude: 28 };
  const end = { latitude: -26, longitude: 28.0005 };
  const hook = renderHook(
    ({ point }: { point: { latitude: number; longitude: number } }) =>
      useCarMotion(point),
    {
      initialProps: { point: start },
    },
  );
  await act(async () => {});
  hook.rerender({ point: end });
  act(() => jest.advanceTimersByTime(450));
  expect(hook.result.current.coordinate!.longitude).toBeGreaterThan(
    start.longitude,
  );
  expect(hook.result.current.coordinate!.longitude).toBeLessThan(end.longitude);
  act(() => jest.advanceTimersByTime(600));
  expect(hook.result.current.coordinate).toEqual(end);
  expect(hook.result.current.heading).toBeCloseTo(90);
  expect(turn(350, 10)).toBe(370);
  expect(turn(10, 350)).toBe(-10);
  expect(turn(1070, 10)).toBe(1090);
  hook.unmount();
  expect(jest.getTimerCount()).toBe(0);
});
test("reduced motion snaps to real fixes without scheduling animation", async () => {
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
  const hook = renderHook(
    ({ point }: { point: { latitude: number; longitude: number } }) =>
      useCarMotion(point),
    {
      initialProps: { point: { latitude: -26, longitude: 28 } },
    },
  );
  await act(async () => {});
  const end = { latitude: -26, longitude: 28.0005 };
  const animate = jest.spyOn(globalThis, "requestAnimationFrame");
  hook.rerender({ point: end });
  expect(hook.result.current.coordinate).toEqual(end);
  expect(animate).not.toHaveBeenCalled();
});
