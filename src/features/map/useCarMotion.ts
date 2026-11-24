import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
export type CarPoint = { latitude: number; longitude: number };
export function movement(a: CarPoint, b: CarPoint) {
  const rad = Math.PI / 180;
  const x =
    (b.longitude - a.longitude) *
    Math.cos(((a.latitude + b.latitude) * rad) / 2);
  const y = b.latitude - a.latitude;
  return {
    meters: Math.hypot(x, y) * rad * 6371000,
    heading: (Math.atan2(x, y) / rad + 360) % 360,
  };
}
export function turn(from: number, to: number) {
  return from + ((((to - from) % 360) + 540) % 360) - 180;
}
/** Interpolate observed fixes only; never extrapolate a driver's position. */
export function useCarMotion(point: CarPoint | null) {
  const [display, setDisplay] = useState({ coordinate: point, heading: 0 });
  const current = useRef(display);
  const reduced = useRef(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) reduced.current = value;
    });
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        reduced.current = value;
      },
    );
    return () => {
      alive = false;
      listener.remove();
    };
  }, []);
  const latitude = point?.latitude,
    longitude = point?.longitude;
  useEffect(() => {
    const target =
      latitude != null && longitude != null ? { latitude, longitude } : null;
    const start = current.current;
    function update(coordinate: CarPoint | null, heading: number) {
      if (
        current.current.coordinate?.latitude === coordinate?.latitude &&
        current.current.coordinate?.longitude === coordinate?.longitude &&
        current.current.heading === heading
      )
        return;
      current.current = { coordinate, heading };
      setDisplay(current.current);
    }
    if (!target || !start.coordinate) {
      update(target, start.heading);
      return;
    }
    const delta = movement(start.coordinate, target);
    if (delta.meters < 0.01) return;
    const heading =
      delta.meters >= 3 ? turn(start.heading, delta.heading) : start.heading;
    if (reduced.current || delta.meters < 3 || delta.meters > 150) {
      update(target, heading);
      return;
    }
    const from = start.coordinate;
    const began = Date.now();
    let frame: number;
    function animate() {
      const t = Math.min(1, (Date.now() - began) / 900);
      update(
        {
          latitude: from.latitude + (target!.latitude - from.latitude) * t,
          longitude: from.longitude + (target!.longitude - from.longitude) * t,
        },
        start.heading + (heading - start.heading) * t,
      );
      if (t < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [latitude, longitude]);
  return display;
}
