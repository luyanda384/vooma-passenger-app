import { Image, Platform } from "react-native";
import { Marker } from "react-native-maps";
import type { NearbyCar } from "../../api/discovery";
import { services } from "../../domain/passenger";
import { useCarMotion } from "./useCarMotion";
const carImage = require("../../../assets/map/driver-car.png");
export function CarMarker({
  car,
  target = "pickup",
  apple = false,
  cameraHeading = 0,
}: {
  car: NearbyCar;
  target?: "pickup" | "destination";
  apple?: boolean;
  cameraHeading?: number;
}) {
  const { coordinate, heading } = useCarMotion(car.location);
  const assigned = car.id === "assigned-driver";
  return (
    <Marker
      identifier={`car-${car.id}`}
      coordinate={coordinate ?? car.location}
      title={
        assigned
          ? "Your driver"
          : (services.find((s) => s.id === car.category)?.name ?? "Vooma")
      }
      description={
        car.pickupSeconds === null
          ? assigned
            ? "Live driver location · ETA unavailable"
            : `${(car.distanceMeters / 1000).toFixed(1)} km away · ETA unavailable`
          : `${Math.max(1, Math.ceil(car.pickupSeconds / 60))} min to ${assigned ? target : "pickup"}`
      }
      accessibilityLabel={
        assigned
          ? "Your driver’s live location"
          : `Available ${car.category} car`
      }
      image={Platform.OS === "ios" ? undefined : carImage}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={apple ? 0 : heading}
      tracksViewChanges={Platform.OS === "ios"}
      zIndex={assigned ? 1000 : 20}
      style={Platform.OS === "ios" ? { width: 48, height: 48 } : undefined}
    >
      {Platform.OS === "ios" && (
        <Image
          source={carImage}
          style={{
            width: 48,
            height: 48,
            ...(apple
              ? { transform: [{ rotate: `${heading - cameraHeading}deg` }] }
              : {}),
          }}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}
    </Marker>
  );
}
