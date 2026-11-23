import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Place } from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { usePlaceSearch } from "../places/usePlaceSearch";
import type { SearchBias } from "../places/service";
import { Button, Empty, Icon, Notice, Sheet, ui } from "../ui/components";
import { dashboardColors as c } from "../ui/theme";

function MatchedText({ text, query }: { text: string; query: string }) {
  const start = text
    .toLocaleLowerCase()
    .indexOf(query.trim().toLocaleLowerCase());
  if (start < 0 || !query.trim()) return <Text>{text}</Text>;
  const end = start + query.trim().length;
  return (
    <Text>
      {text.slice(0, start)}
      <Text style={{ fontWeight: "800", color: c.link }}>
        {text.slice(start, end)}
      </Text>
      {text.slice(end)}
    </Text>
  );
}

export function PlacePicker({
  kind,
  onSelect,
  onClose,
  onUseLiveLocation,
  bias,
}: {
  kind: "pickup" | "destination" | "saved";
  onSelect: (place: Place) => void;
  onClose: () => void;
  onUseLiveLocation?: () => void;
  bias?: SearchBias;
}) {
  const { state } = usePassenger();
  const search = usePlaceSearch(bias);
  const resolving = search.status === "resolving";
  const select = async (item: Parameters<typeof search.select>[0]) => {
    const place = await search.select(item);
    if (place) {
      onSelect(place);
      onClose();
    }
  };
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
        accessibilityLabel={
          kind === "pickup"
            ? "Pickup address"
            : kind === "destination"
              ? "Destination address"
              : "Saved place address"
        }
        placeholder="Search a place or street address"
        placeholderTextColor={c.muted}
        value={search.query}
        onChangeText={search.change}
        editable={!resolving}
        maxLength={200}
        style={ui.input}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={search.submit}
      />
      {search.requiresSubmit && (
        <Button
          label="Search addresses"
          icon="search-outline"
          onPress={search.submit}
          disabled={
            resolving ||
            search.status === "loading" ||
            search.query.trim().length < 2
          }
        />
      )}
      {kind === "pickup" && onUseLiveLocation && (
        <Button
          label="Use my current location"
          icon="locate-outline"
          secondary
          disabled={resolving}
          onPress={() => {
            onUseLiveLocation();
            onClose();
          }}
        />
      )}
      {search.error !== "" && <Notice error>{search.error}</Notice>}
      {search.status === "error" && search.query.trim().length >= 2 && (
        <Button label="Retry address search" secondary onPress={search.retry} />
      )}
      {(search.status === "loading" || resolving) && (
        <View style={ui.row}>
          <ActivityIndicator
            accessibilityLabel={
              resolving ? "Loading selected place" : "Searching addresses"
            }
            color={c.link}
          />
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            {resolving ? "Loading address?" : "Searching places?"}
          </Text>
        </View>
      )}
      {search.status === "idle" && (
        <Text style={ui.small}>
          {search.requiresSubmit
            ? "Enter a place or full street address, include the suburb or city, then tap Search addresses."
            : "Start typing a place name or address to see matching places."}
        </Text>
      )}
      {search.status === "ready" && search.suggestions.length === 0 && (
        <Empty
          icon="search-outline"
          title="No matching places"
          description="Try adding a street name, suburb or city."
        />
      )}
      {search.suggestions.length > 0 && (
        <View style={{ gap: 4 }}>
          {search.suggestions.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.title}, ${item.subtitle}`}
              disabled={resolving}
              onPress={() => void select(item)}
              style={[
                ui.row,
                {
                  minHeight: 64,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: c.line,
                },
              ]}
            >
              <Icon name="location-outline" size={22} color={c.ink} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={ui.h3}>
                  <MatchedText text={item.title} query={search.query} />
                </Text>
                <Text style={ui.small}>
                  <MatchedText text={item.subtitle} query={search.query} />
                </Text>
              </View>
              <Icon name="arrow-up-outline" size={18} color={c.muted} />
            </Pressable>
          ))}
          <Text
            style={{
              color: "#5E5E5E",
              fontSize: 12,
              fontWeight: "400",
              alignSelf: "flex-end",
              paddingTop: 8,
            }}
          >
            {Platform.OS === "ios" ? "Apple Maps" : "Google Maps"}
          </Text>
        </View>
      )}
      {kind !== "saved" && !search.query.trim() && state.saved.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={ui.h3}>Saved places</Text>
          {state.saved.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`Select saved place ${place.label}`}
              disabled={resolving}
              onPress={() => void select(place)}
              style={[ui.row, { minHeight: 56 }]}
            >
              <Icon name="bookmark-outline" color={c.link} />
              <Text style={[ui.body, { flex: 1 }]}>{place.label}</Text>
              <Icon name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
}
