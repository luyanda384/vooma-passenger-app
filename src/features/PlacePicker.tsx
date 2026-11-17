import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { places, type Place } from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import {
  Button,
  c,
  Empty,
  Icon,
  IconButton,
  Notice,
  Sheet,
  ui,
} from "../ui/components";

export function PlacePicker({
  kind,
  onSelect,
  onClose,
}: {
  kind: "pickup" | "destination" | "saved";
  onSelect: (place: Place) => void;
  onClose: () => void;
}) {
  const { state, update } = usePassenger();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const filtered = places.filter((p) =>
    `${p.name} ${p.address}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      if (permission.status !== "granted")
        throw new Error(
          "Location permission is off. Choose a pickup below, or enable location in your device settings.",
        );
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  "Location took too long. Try again or choose a pickup below.",
                ),
              ),
            15000,
          );
        }),
      ]).finally(() => clearTimeout(timeout));
      if (!mounted.current) return;
      onSelect({
        id: "current-location",
        name: "Current location",
        address: `${result.coords.latitude.toFixed(5)}, ${result.coords.longitude.toFixed(5)}`,
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
      onClose();
    } catch (e) {
      if (mounted.current)
        setError(
          e instanceof Error
            ? e.message
            : "Location is unavailable. Choose a pickup below.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <Sheet
      visible
      title={
        kind === "saved"
          ? "Save a favourite place"
          : kind === "pickup"
            ? "Where should we pick you up?"
            : "Where are you going?"
      }
      onClose={onClose}
    >
      <TextInput
        accessibilityLabel="Search demo places"
        placeholder="Search Johannesburg places"
        placeholderTextColor={c.muted}
        value={query}
        onChangeText={setQuery}
        style={ui.input}
        autoCorrect={false}
      />
      {kind === "pickup" && (
        <Button
          label="Use my current location"
          icon="locate-outline"
          secondary
          busy={busy}
          onPress={() => void locate()}
        />
      )}
      {error !== "" && <Notice error>{error}</Notice>}
      <Text style={ui.small}>
        Search the sample destinations below. Full address search will be
        available when the places service is connected.
      </Text>
      {filtered.length === 0 && (
        <Empty
          icon="search-outline"
          title="No matching places"
          description="Try Sandton, Rosebank, Melrose or the airport."
        />
      )}
      {filtered.map((place) => (
        <View key={place.id} style={[ui.row, { paddingVertical: 7 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${place.name}`}
            onPress={() => {
              onSelect(place);
              onClose();
            }}
            style={[ui.row, { flex: 1, minHeight: 48 }]}
          >
            <View style={ui.iconButton}>
              <Icon
                name={
                  place.id === "airport"
                    ? "airplane-outline"
                    : "location-outline"
                }
                size={20}
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={ui.h3}>{place.name}</Text>
              <Text style={ui.small}>{place.address}</Text>
            </View>
          </Pressable>
          {kind !== "saved" && (
            <IconButton
              name={state.saved.includes(place.id) ? "heart" : "heart-outline"}
              label={`${state.saved.includes(place.id) ? "Unsave" : "Save"} ${place.name}`}
              onPress={() =>
                update((previous) => ({
                  ...previous,
                  saved: previous.saved.includes(place.id)
                    ? previous.saved.filter((id) => id !== place.id)
                    : [...previous.saved, place.id],
                }))
              }
            />
          )}
        </View>
      ))}
    </Sheet>
  );
}
