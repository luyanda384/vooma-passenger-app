import { useState } from "react";
import { Text, View } from "react-native";
import { places } from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, Empty, Icon, IconButton, ui } from "../ui/components";
import { PlacePicker } from "./PlacePicker";

export function SavedScreen() {
  const { state, update } = usePassenger();
  const [adding, setAdding] = useState(false);
  const favourites = places.filter((p) => state.saved.includes(p.id));
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={ui.label}>THE PLACES THAT FEEL LIKE YOU</Text>
        <Text accessibilityRole="header" style={ui.h1}>
          Saved places
        </Text>
        <Text style={ui.body}>A shortcut to your everyday destinations.</Text>
      </View>
      <View style={ui.card}>
        {!favourites.length && (
          <Empty
            icon="heart-outline"
            title="Keep your favourites close"
            description="Save a place, then select it from Home when planning your next ride."
          />
        )}
        {favourites.map((place) => (
          <View key={place.id} style={ui.row}>
            <View style={ui.iconButton}>
              <Icon name="location-outline" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ui.h3}>{place.name}</Text>
              <Text style={ui.small}>{place.address}</Text>
            </View>
            <IconButton
              name="trash-outline"
              label={`Remove ${place.name} from saved places`}
              onPress={() =>
                update((previous) => ({
                  ...previous,
                  saved: previous.saved.filter((id) => id !== place.id),
                }))
              }
            />
          </View>
        ))}
        <Button
          label="Add a favourite place"
          icon="add"
          onPress={() => setAdding(true)}
        />
      </View>
      {adding && (
        <PlacePicker
          kind="saved"
          onClose={() => setAdding(false)}
          onSelect={(place) =>
            update((previous) => ({
              ...previous,
              saved: [...new Set([...previous.saved, place.id])],
            }))
          }
        />
      )}
    </View>
  );
}
