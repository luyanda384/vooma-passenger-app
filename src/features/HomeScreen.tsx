import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { Place, ServiceId } from "../domain/passenger";
import { useNearbyCars } from "../location/useNearbyCars";
import { NearbyCars } from "./NearbyCars";
import { Button, Icon, Notice, Sheet, ui } from "../ui/components";
import { dashboardColors as c } from "../ui/theme";
import { MapCanvas } from "./map/MapCanvas";
import { PlacePicker } from "./PlacePicker";
import { useLivePickup } from "../location/useLivePickup";

export function HomeScreen({
  navigationInset = 0,
}: {
  navigationInset?: number;
}) {
  const { height } = useWindowDimensions();
  const [manualPickup, setManualPickup] = useState<Place | null>(null);
  const location = useLivePickup({ enabled: manualPickup === null });
  const pickup = manualPickup ?? location.pickup;
  const [destination, setDestination] = useState<Place | null>(null);
  const showNearby = pickup !== null && destination !== null;
  const nearby = useNearbyCars(showNearby ? pickup : null);
  const [category, setCategory] = useState<ServiceId | null>(null);
  const [viewportHeight, setViewportHeight] = useState(height - 140);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [searchHeight, setSearchHeight] = useState(60);
  const [picker, setPicker] = useState<"pickup" | "destination" | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [error, setError] = useState("");
  const [recenter, setRecenter] = useState(0);
  const mapHeight = showNearby
    ? Math.max(280, Math.min(420, viewportHeight - headerHeight - 230))
    : Math.max(280, viewportHeight - headerHeight - 20);
  const searchBottom = showNearby ? 16 : navigationInset + 36;
  const locating = location.status === "checking" || location.status === "idle";

  function refreshLocation() {
    if (pickup) setRecenter((value) => value + 1);
    else void location.retry();
  }

  async function openLocationSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setError(
        "Could not open settings. Enable location in your device settings, then try again.",
      );
    }
  }

  return (
    <View
      style={styles.screen}
      onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: error ? navigationInset + 20 : 0,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.headingArea}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Change pickup: ${pickup?.name ?? "Current location"}`}
              onPress={() => setPicker("pickup")}
              style={styles.cityButton}
            >
              <Icon name="location" size={25} color={c.ink} />
              <View style={{ flexShrink: 1, gap: 3 }}>
                <Text numberOfLines={1} style={styles.cityName}>
                  {manualPickup
                    ? manualPickup.name
                    : pickup
                      ? "Current location"
                      : locating
                        ? "Finding your location"
                        : "Location unavailable"}
                </Text>
                <Text numberOfLines={1} style={styles.pickupName}>
                  {manualPickup
                    ? manualPickup.address
                    : pickup
                      ? "Live pickup · updates as you move"
                      : "Pickup uses your live location"}
                </Text>
              </View>
              <Icon name="chevron-down" size={20} color={c.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => setNotificationsOpen(true)}
              style={styles.notificationButton}
            >
              <Icon name="notifications" size={26} color={c.ink} />
            </Pressable>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Where are you going today?
          </Text>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapFrame}>
            <MapCanvas
              radiusMeters={showNearby ? nearby.data?.radiusMeters : undefined}
              cars={
                showNearby
                  ? (nearby.data?.cars.filter(
                      (car) => category === null || car.category === category,
                    ) ?? [])
                  : []
              }
              pickup={pickup}
              destination={destination}
              recenter={recenter}
              height={mapHeight}
              overlayBottom={searchBottom + searchHeight + 16}
              navigationInset={showNearby ? 0 : navigationInset}
            />
            {!pickup && (
              <View style={styles.locationNotice}>
                <Text accessibilityLiveRegion="polite" style={ui.body}>
                  {location.message}
                </Text>
                {locating ? (
                  <ActivityIndicator
                    accessibilityLabel="Finding current location"
                    color={c.navy}
                  />
                ) : (
                  <>
                    <Button
                      label="Retry location"
                      secondary
                      onPress={() => void location.retry()}
                    />
                    <Button
                      label="Choose pickup address"
                      secondary
                      onPress={() => setPicker("pickup")}
                    />
                    {(location.status === "blocked" ||
                      location.status === "disabled" ||
                      location.status === "denied") &&
                      (Platform.OS === "web" ? (
                        <Text style={ui.small}>
                          Allow location in your browser’s site settings, then
                          retry.
                        </Text>
                      ) : (
                        <Button
                          label="Open location settings"
                          secondary
                          onPress={() => void openLocationSettings()}
                        />
                      ))}
                  </>
                )}
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Recenter map on pickup"
              onPress={refreshLocation}
              style={[
                styles.mapButton,
                styles.recenterControl,
                { bottom: searchBottom + searchHeight + 16 },
              ]}
            >
              <Icon name="locate-outline" size={25} color={c.ink} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              destination
                ? `Change destination: ${destination.name}`
                : "Where to?"
            }
            onPress={() => setPicker("destination")}
            style={[styles.search, { bottom: searchBottom }]}
            onLayout={(event) =>
              setSearchHeight(event.nativeEvent.layout.height)
            }
          >
            <Icon name="search-outline" size={27} color={c.muted} />
            <Text
              numberOfLines={1}
              style={[styles.searchText, !destination && { color: c.muted }]}
            >
              {destination?.name ?? "Where to?"}
            </Text>
            {destination && (
              <Icon name="chevron-forward" size={18} color={c.muted} />
            )}
          </Pressable>
        </View>

        {showNearby && (
          <View style={{ paddingBottom: navigationInset + 24 }}>
            <NearbyCars
              {...nearby}
              selected={category}
              onSelect={setCategory}
            />
          </View>
        )}
        {error !== "" && <Notice error>{error}</Notice>}
      </ScrollView>

      {picker && (
        <PlacePicker
          kind={picker}
          bias={pickup ?? undefined}
          onUseLiveLocation={
            picker === "pickup"
              ? () => {
                  setCategory(null);
                  setManualPickup(null);
                  if (manualPickup === null && !location.pickup)
                    void location.retry();
                  setRecenter((value) => value + 1);
                  setError("");
                }
              : undefined
          }
          onClose={() => setPicker(null)}
          onSelect={(place) => {
            setCategory(null);
            if (picker === "pickup") setManualPickup(place);
            else setDestination(place);
            setError("");
          }}
        />
      )}
      <Sheet
        visible={notificationsOpen}
        title="Notifications"
        onClose={() => setNotificationsOpen(false)}
      >
        <Text style={ui.body}>
          You have no new notifications. Live ride updates will appear here when
          the ride service is connected.
        </Text>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EEF5FF" },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headingArea: { gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cityButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  cityName: { color: c.ink, fontSize: 18, fontWeight: "700" },
  pickupName: { color: c.muted, fontSize: 11 },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: c.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  mapSection: { gap: 0, marginHorizontal: -12 },
  mapFrame: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E7EFF2",
  },
  mapButton: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFFF5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: c.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  locationNotice: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    padding: 16,
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFFF5",
  },
  recenterControl: { right: 14, bottom: 34 },
  search: {
    position: "absolute",
    left: 12,
    right: 12,
    minHeight: 60,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "#FAFCFF",
    borderWidth: 1,
    borderColor: c.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: c.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  searchText: { flex: 1, color: c.ink, fontSize: 21, fontWeight: "600" },
});
