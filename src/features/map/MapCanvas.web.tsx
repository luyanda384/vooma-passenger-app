import { createElement, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Icon, ui } from "../../ui/components";
import type { MapCanvasProps } from "./model";
import { carSvg } from "./car-art";
import { moveWebCar, type WebCar } from "./web-car";
import { decodePolyline } from "../../api/ride-tracking";

// Keep native map modules out of the browser bundle.
export function MapCanvas({
  pickup,
  cars = [],
  tracking,
  trackingTarget,
  radiusMeters,
  destination,
  fullscreen = false,
  height,
  recenter,
  navigationInset = 0,
}: MapCanvasProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<WebMap | null>(null);
  const carMarkers = useRef(new Map<string, WebCar>());
  const [api, setApi] = useState<Maps | null>(null);
  const [failed, setFailed] = useState(false);
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
  useEffect(() => {
    if (!key || !host.current) return;
    let alive = true;
    void loadMaps(key)
      .then((maps) => {
        if (!alive || !host.current) return;
        map.current = new maps.Map(host.current, {
          center: { lat: -26.2041, lng: 28.0473 },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });
        setApi(maps);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      for (const car of carMarkers.current.values()) {
        if (car.frame !== undefined) cancelAnimationFrame(car.frame);
        car.marker.setMap(null);
      }
      carMarkers.current.clear();
      map.current = null;
    };
  }, [key]);
  useEffect(() => {
    if (!api || !map.current) return;
    const point = (p: { latitude: number; longitude: number }) => ({
      lat: p.latitude,
      lng: p.longitude,
    });
    const markers: WebMarker[] = [];
    if (pickup)
      markers.push(
        new api.Marker({
          map: map.current,
          position: point(pickup),
          title: `Pickup: ${pickup.name}`,
          label: "P",
        }),
      );
    if (destination)
      markers.push(
        new api.Marker({
          map: map.current,
          position: point(destination),
          title: `Destination: ${destination.name}`,
          label: "D",
        }),
      );
    return () => markers.forEach((marker) => marker.setMap(null));
  }, [
    api,
    pickup?.latitude,
    pickup?.longitude,
    pickup?.name,
    destination?.latitude,
    destination?.longitude,
    destination?.name,
  ]);
  useEffect(() => {
    if (!api || !map.current) return;
    const ids = new Set(cars.map((car) => car.id));
    for (const [id, car] of carMarkers.current)
      if (!ids.has(id)) {
        if (car.frame !== undefined) cancelAnimationFrame(car.frame);
        car.marker.setMap(null);
        carMarkers.current.delete(id);
      }
    for (const car of cars) {
      let entry = carMarkers.current.get(car.id);
      if (!entry) {
        entry = {
          marker: new api.Marker({
            map: map.current,
            title:
              car.id === "assigned-driver"
                ? "Your driver"
                : `Vooma ${car.category}`,
            zIndex: 100,
          }),
          icon: {
            scaledSize: new api.Size(48, 48),
            anchor: new api.Point(24, 24),
          },
        };
        carMarkers.current.set(car.id, entry);
      }
      moveWebCar(
        entry,
        { lat: car.location.latitude, lng: car.location.longitude },
        carSvg,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    }
  }, [api, cars]);
  useEffect(() => {
    if (!api || !map.current || !tracking) return;
    const coordinates = decodePolyline(tracking.encodedPolyline);
    if (!coordinates) return;
    const line = new api.Polyline({
      map: map.current,
      path: coordinates.map((p) => ({ lat: p.latitude, lng: p.longitude })),
      strokeColor: "#1879EB",
      strokeWeight: 5,
    });
    return () => line.setMap(null);
  }, [api, tracking?.encodedPolyline]);
  const assigned = cars.find((car) => car.id === "assigned-driver");
  const latestAssigned = useRef(assigned);
  latestAssigned.current = assigned;
  useEffect(() => {
    if (!api || !map.current || !pickup) return;
    const origin = { lat: pickup.latitude, lng: pickup.longitude };
    if (latestAssigned.current) {
      const bounds = new api.LatLngBounds();
      const driver = latestAssigned.current.location;
      bounds.extend({ lat: driver.latitude, lng: driver.longitude });
      bounds.extend(
        trackingTarget === "destination" && destination
          ? { lat: destination.latitude, lng: destination.longitude }
          : origin,
      );
      map.current.fitBounds(bounds, 70);
      return;
    }
    if (destination) {
      const bounds = new api.LatLngBounds();
      bounds.extend(origin);
      bounds.extend({ lat: destination.latitude, lng: destination.longitude });
      map.current.fitBounds(bounds, 80);
    } else {
      map.current.setCenter(origin);
      map.current.setZoom(
        radiusMeters && radiusMeters > 5000 ? 11 : radiusMeters ? 12 : 13,
      );
    }
  }, [
    api,
    pickup?.latitude,
    pickup?.longitude,
    destination?.latitude,
    destination?.longitude,
    recenter,
    radiusMeters,
    assigned?.id,
    trackingTarget,
  ]);
  if (key && !failed)
    return (
      <View
        style={{
          height: height ?? (fullscreen ? "100%" : 230),
          borderRadius: 26,
          overflow: "hidden",
        }}
      >
        {createElement("div", {
          ref: host,
          role: "region",
          "aria-label": "Google map of pickup, destination and available cars",
          style: { width: "100%", height: `calc(100% - ${navigationInset}px)` },
        })}
      </View>
    );
  return (
    <View
      style={[
        ui.card,
        { padding: 20, gap: 10 },
        fullscreen && {
          flex: 1,
          borderRadius: 0,
          justifyContent: "center",
          backgroundColor: "#E7EFF2",
        },
        height !== undefined && { height, justifyContent: "center" },
      ]}
    >
      <Icon name="map-outline" />
      {pickup && (
        <Text style={ui.small}>
          {cars.length} available cars in this view. Open the Android or iOS app
          to see car markers.
        </Text>
      )}
      <Text style={ui.h3}>
        {pickup?.name ?? "Waiting for current location"}
        {destination ? ` to ${destination.name}` : ""}
      </Text>
      <Text style={ui.body}>
        {fullscreen || height !== undefined
          ? "The interactive map is available in the Android and iOS apps. Choose your pickup and destination to plan a ride."
          : `Open Google Maps below to view ${destination ? "these places and driving directions" : "your selected pickup"}.`}
      </Text>
    </View>
  );
}

type WebMap = {
  setCenter: (point: unknown) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: unknown, padding: number) => void;
};
type WebMarker = WebCar["marker"];
type Maps = {
  Map: new (host: HTMLElement, options: object) => WebMap;
  Marker: new (options: object) => WebMarker;
  Size: new (width: number, height: number) => object;
  Point: new (x: number, y: number) => object;
  Polyline: new (options: object) => { setMap: (map: null) => void };
  LatLngBounds: new () => { extend: (point: unknown) => void };
};
let pending: Promise<Maps> | null = null;
function loadMaps(key: string) {
  const google = () =>
    (window as unknown as { google?: { maps?: Maps } }).google?.maps;
  if (google()) return Promise.resolve(google()!);
  if (pending) return pending;
  pending = new Promise<Maps>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    const timer = setTimeout(() => {
      script.remove();
      pending = null;
      reject(new Error("Map timeout"));
    }, 20000);
    script.onload = () => {
      clearTimeout(timer);
      const maps = google();
      if (maps) resolve(maps);
      else {
        pending = null;
        reject(new Error("Map unavailable"));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      pending = null;
      reject(new Error("Map unavailable"));
    };
    document.head.appendChild(script);
  });
  return pending;
}
