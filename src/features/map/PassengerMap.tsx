import { useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { Button, IconButton, Notice, ui } from "../../ui/components";
import { MapCanvas } from "./MapCanvas";
import { mapsUrl, type MapProvider, type PassengerMapProps } from "./model";

export function PassengerMap(props: PassengerMapProps) {
  const [recenter, setRecenter] = useState(0);
  const [error, setError] = useState("");
  async function open(provider: MapProvider) {
    setError("");
    try {
      await Linking.openURL(mapsUrl(provider, props));
    } catch {
      setError(
        `Could not open ${provider === "apple" ? "Apple" : "Google"} Maps. Please try again.`,
      );
    }
  }
  return (
    <View style={{ gap: 10 }}>
      <MapCanvas {...props} recenter={recenter} />
      <View style={[ui.row, { flexWrap: "wrap" }]}>
        <Button
          label={Platform.OS === "ios" ? "Apple Maps" : "Google Maps"}
          secondary
          icon="map-outline"
          onPress={() => void open(Platform.OS === "ios" ? "apple" : "google")}
        />
        {Platform.OS !== "web" && (
          <IconButton
            label="Recenter map on selected places"
            name="locate-outline"
            onPress={() => setRecenter((value) => value + 1)}
          />
        )}
      </View>
      <Text style={ui.small}>
        Selected places only. No live driver tracking.
        {props.destination ? " Open Maps for road directions." : ""}
      </Text>
      {error !== "" && <Notice error>{error}</Notice>}
    </View>
  );
}
