import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isRunningInExpoGo } from "expo";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Icon, c, ui } from "../../ui/components";
import { services } from "../../domain/passenger";
import { nativeMapProvider, type MapCanvasProps } from "./model";

export function MapCanvas({
  pickup,
  cars = [],
  radiusMeters,
  destination,
  recenter,
  fullscreen = false,
  overlayBottom = 0,
  height,
  navigationInset = 0,
}: MapCanvasProps) {
  const map = useRef<MapView>(null);
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

  useEffect(() => {
    if (status !== "loading" || !provider) return;
    const timer = setTimeout(() => setStatus("error"), 25000);
    return () => clearTimeout(timer);
  }, [status, attempt, provider]);

  useEffect(() => {
    if (status !== "ready" || pickupLatitude == null || pickupLongitude == null)
      return;
    const origin = { latitude: pickupLatitude, longitude: pickupLongitude };
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
        >
          {cars.map((car) => (
            <Marker
              key={car.id}
              identifier={`car-${car.id}`}
              coordinate={car.location}
              title={
                services.find((s) => s.id === car.category)?.name ?? "Vooma"
              }
              description={
                car.pickupSeconds === null
                  ? `${(car.distanceMeters / 1000).toFixed(1)} km away · ETA unavailable`
                  : `${Math.max(1, Math.ceil(car.pickupSeconds / 60))} min to pickup`
              }
              accessibilityLabel={`Available ${car.category} car`}
            >
              <View
                style={{
                  padding: 5,
                  borderRadius: 12,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: c.navy,
                }}
              >
                <Icon name="car-sport" size={24} color={c.navy} />
              </View>
            </Marker>
          ))}
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
