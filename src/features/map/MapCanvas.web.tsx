import { Text, View } from "react-native";
import { Icon, ui } from "../../ui/components";
import type { MapCanvasProps } from "./model";

// Keep native map modules out of the browser bundle.
export function MapCanvas({
  pickup,
  destination,
  fullscreen = false,
  height,
}: MapCanvasProps) {
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
