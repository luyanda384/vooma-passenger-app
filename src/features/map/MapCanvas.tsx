import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isRunningInExpoGo } from "expo";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, c, ui } from "../../ui/components";
import { CarMarker } from "./CarMarker";
import { decodePolyline } from "../../api/ride-tracking";
import { nativeMapProvider, type MapCanvasProps } from "./model";

export function MapCanvas({
  pickup,
  cars = [],
  tracking,
  trackingTarget,
  radiusMeters,
  destination,
  recenter,
  fullscreen = false,
  overlayBottom = 0,
  height,
  navigationInset = 0,
}: MapCanvasProps) {
  const map = useRef<MapView>(null);
  const [cameraHeading, setCameraHeading] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const expoGo =
    isRunningInExpoGo() ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === "expo";
  const provider = nativeMapProvider(
    Platform.OS,
    expoGo,
    Constants.expoConfig?.extra ?? {},
  );
  const pickupLatitude = pickup?.latitude;
  const pickupLongitude = pickup?.longitude;
  const initialCenter = pickup ??
    destination ?? { latitude: -26.2041, longitude: 28.0473 };
  const destinationLatitude = destination?.latitude;
  const destinationLongitude = destination?.longitude;
  const encoded = tracking?.encodedPolyline;
  const route = useMemo(
    () => (encoded ? decodePolyline(encoded) : null),
    [encoded],
  );
  const assigned = cars.find((car) => car.id === "assigned-driver");
  const trackedId = assigned?.id;
  const latestTracking = useRef({ assigned, route });
  latestTracking.current = { assigned, route };

  useEffect(() => {
    if (status !== "loading" || !provider) return;
    const timer = setTimeout(() => setStatus("error"), 25000);
    return () => clearTimeout(timer);
  }, [status, attempt, provider]);

  useEffect(() => {
    if (status !== "ready" || pickupLatitude == null || pickupLongitude == null)
      return;
    const origin = { latitude: pickupLatitude, longitude: pickupLongitude };
    if (latestTracking.current.assigned) {
      const end =
        trackingTarget === "destination" && destination ? destination : origin;
      map.current?.fitToCoordinates(
        provider === "google" && latestTracking.current.route
          ? latestTracking.current.route
          : [latestTracking.current.assigned.location, end],
        {
          edgePadding: { top: 65, right: 55, bottom: 85, left: 55 },
          animated: true,
        },
      );
      return;
    }
    if (destinationLatitude != null && destinationLongitude != null) {
      map.current?.fitToCoordinates(
        [
          origin,
          { latitude: destinationLatitude, longitude: destinationLongitude },
        ],
        {
          edgePadding: {
            top: fullscreen ? 100 : 60,
            right: 45,
            bottom:
              overlayBottom > 0
                ? Math.min(overlayBottom + 45, (height ?? 230) * 0.5)
                : 45,
            left: 45,
          },
          animated: true,
        },
      );
    } else {
      map.current?.animateToRegion(
        {
          ...origin,
          latitudeDelta: radiusMeters ? (radiusMeters * 2.4) / 111320 : 0.035,
          longitudeDelta: radiusMeters
            ? (radiusMeters * 2.4) /
              (111320 *
                Math.max(0.1, Math.cos((origin.latitude * Math.PI) / 180)))
            : 0.035,
        },
        500,
      );
    }
  }, [
    status,
    pickupLatitude,
    pickupLongitude,
    destinationLatitude,
    destinationLongitude,
    recenter,
    fullscreen,
    overlayBottom,
    height,
    radiusMeters,
    trackedId,
    trackingTarget,
    provider,
  ]);

  return (
    <View
      style={[
        styles.frame,
        fullscreen && styles.fullscreen,
        height !== undefined && { height },
      ]}
    >
      {provider ? (
        <MapView
          key={attempt}
          ref={map}
          style={StyleSheet.absoluteFill}
          provider={provider === "google" ? PROVIDER_GOOGLE : undefined}
          accessibilityLabel={`${provider === "google" ? "Google" : "Apple"} map${pickup ? " of pickup" : ", waiting for current pickup location"}${destination ? " and destination" : ""}`}
          initialRegion={{
            latitude: initialCenter.latitude,
            longitude: initialCenter.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          showsCompass={!fullscreen}
          mapPadding={{
            top: 0,
            right: 0,
            bottom: navigationInset + 8,
            left: 0,
          }}
          legalLabelInsets={{
            top: 0,
            right: 0,
            bottom: navigationInset + 8,
            left: 12,
          }}
          onMapReady={() => setStatus("ready")}
          onRegionChangeComplete={() => {
            if (provider === "apple")
              void map.current
                ?.getCamera?.()
                .then((camera) => setCameraHeading(camera.heading))
                .catch(() => {});
          }}
        >
          {cars.map((car) => (
            <CarMarker
              key={car.id}
              car={car}
              target={trackingTarget}
              apple={provider === "apple"}
              cameraHeading={cameraHeading}
            />
          ))}
          {provider === "google" && route && (
            <Polyline
              coordinates={route}
              strokeColor="#1879EB"
              strokeWidth={5}
            />
          )}
          {pickup && (
            <Marker
              identifier="pickup"
              coordinate={pickup}
              title={`Pickup: ${pickup.name}`}
              description={pickup.address}
              pinColor={pickup.id === "current-location" ? "#1976F3" : c.orange}
            />
          )}
          {destination && (
            <Marker
              identifier="destination"
              coordinate={destination}
              title={`Destination: ${destination.name}`}
              description={destination.address}
              pinColor={c.navy}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.overlay}>
          <Text style={ui.body}>
            The in-app map is unavailable. You can still choose your
            destination.
          </Text>
        </View>
      )}
      {provider && status !== "ready" && (
        <View style={styles.overlay}>
          {status === "loading" ? (
            <ActivityIndicator
              accessibilityLabel="Loading map"
              color={c.navy}
            />
          ) : (
            <>
              <Text style={ui.body}>
                The map could not load. Check your connection and try again.
              </Text>
              <Button
                label="Retry map"
                secondary
                onPress={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, height: "100%", borderRadius: 0 },
  frame: {
    height: 230,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E7EFF2",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: 20,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7EFF2",
  },
});
