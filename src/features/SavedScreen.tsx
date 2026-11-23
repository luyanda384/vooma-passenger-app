import { dashboardColors as c, dashboardStyles as d } from "../ui/theme";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { bookmarkPlace, type Place } from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, Icon, Notice, Sheet, ui } from "../ui/components";
import { PlacePicker } from "./PlacePicker";

export function SavedScreen() {
  const { state, update } = usePassenger();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  function save() {
    if (!selected) return;
    try {
      const bookmark = bookmarkPlace(selected, label);
      update((previous) => ({
        ...previous,
        saved: [
          ...previous.saved.filter((place) => place.id !== bookmark.id),
          bookmark,
        ],
      }));
      setSelected(null);
      setLabel("");
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save this place.",
      );
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Saved"
        subtitle="Your favourite places, ready when you are."
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search places to save"
        onPress={() => setAdding(true)}
        style={styles.search}
      >
        <Icon name="search" size={23} color={c.muted} />
        <Text style={{ color: c.muted, fontSize: 16 }}>
          Search for a place or address
        </Text>
      </Pressable>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved places</Text>
        {state.saved.length ? (
          <View style={styles.list}>
            {state.saved.map((place) => (
              <View key={place.id} style={styles.placeRow}>
                <View style={styles.placeIcon}>
                  <Icon name="bookmark-outline" color={c.link} />
                </View>
                <View style={styles.placeDetails}>
                  <Text style={styles.placeName}>{place.label}</Text>
                  <Text style={styles.placeAddress}>
                    Choose this place from pickup or destination search.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${place.label} from saved places`}
                  style={styles.rowAction}
                  onPress={() =>
                    update((previous) => ({
                      ...previous,
                      saved: previous.saved.filter(
                        (saved) => saved.id !== place.id,
                      ),
                    }))
                  }
                >
                  <Icon name="trash-outline" size={20} color={c.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Save places you visit often to find them here.
            </Text>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setAdding(true)}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <Icon name="add-circle-outline" size={23} color={c.white} />
        <Text style={styles.addButtonText}>Add new place</Text>
        <Icon name="chevron-forward" size={21} color={c.white} />
      </Pressable>
      {adding && (
        <PlacePicker
          kind="saved"
          onClose={() => setAdding(false)}
          onSelect={(place) => {
            setSelected(place);
            setLabel("");
            setError("");
          }}
        />
      )}
      <Sheet
        visible={!!selected}
        title="Name your saved place"
        onClose={() => setSelected(null)}
      >
        <Text style={ui.h3}>{selected?.name}</Text>
        <Text style={ui.body}>{selected?.address}</Text>
        {selected?.provider === "google" && (
          <Text style={{ color: "#5E5E5E", fontSize: 12 }}>Google Maps</Text>
        )}
        <TextInput
          accessibilityLabel="Saved place name"
          placeholder="e.g. Home, Work or Gym"
          placeholderTextColor={c.muted}
          value={label}
          maxLength={80}
          onChangeText={(value) => {
            setLabel(value);
            setError("");
          }}
          style={ui.input}
        />
        {error !== "" && <Notice error>{error}</Notice>}
        <Button label="Save place" onPress={save} disabled={!label.trim()} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  search: {
    ...d.field,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, minWidth: 0, padding: 0, color: c.ink, fontSize: 16 },
  section: { gap: 9 },
  sectionTitle: {
    color: c.ink,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingHorizontal: 2,
    fontSize: 21,
  },
  list: { gap: 7 },
  placeRow: {
    ...d.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    minHeight: 76,
    padding: 12,
  },
  placeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#ECF5FF",
  },
  recentIcon: { backgroundColor: "transparent" },
  placeDetails: { flex: 1, minWidth: 0, gap: 2 },
  placeName: { color: c.ink, fontSize: 15, fontWeight: "700" },
  placeAddress: { color: c.muted, fontSize: 13 },
  rowAction: {
    width: 34,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  emptyCard: {
    ...d.card,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  emptyText: { color: c.muted, fontSize: 13, lineHeight: 19 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: c.action,
    minHeight: 52,
    borderRadius: 15,
  },
  addButtonText: {
    flex: 1,
    fontWeight: "700",
    color: c.white,
    fontSize: 14,
  },
});
