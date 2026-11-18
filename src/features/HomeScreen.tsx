import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  createRide,
  dateLabel,
  isActive,
  money,
  places,
  quote,
  statusLabels,
  type Place,
} from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, c, Icon, Notice, Sheet, ui } from "../ui/components";
import { IllustratedMap } from "../ui/IllustratedMap";
import { PlacePicker } from "./PlacePicker";

const recentPlaces = [places[0], places[2]];

export function HomeScreen({
  onRide,
}: {
  onRide: (id: string) => void;
}) {
  const { state, update } = usePassenger();
  const [pickup, setPickup] = useState<Place>(places[0]);
  const [destination, setDestination] = useState<Place | null>(null);
  const [picker, setPicker] = useState<"pickup" | "destination" | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const active = state.rides.find(isActive);
  const estimate = destination ? quote(pickup, destination, "go") : null;

  function book() {
    if (!destination) {
      setPicker("destination");
      return;
    }
    try {
      let rideId = "";
      update((previous) => {
        const ride = createRide(previous, {
          pickup,
          destination,
          service: "go",
          scheduledAt,
        });
        rideId = ride.id;
        return { ...previous, rides: [ride, ...previous.rides] };
      });
      setError("");
      onRide(rideId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to create this demo ride.",
      );
    }
  }

  return (
    <View style={styles.screen}>
      <View style={ui.between}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pickup: ${pickup.name}`}
          onPress={() => setPicker("pickup")}
          style={[ui.row, styles.cityButton]}
        >
          <Icon name="location" size={23} />
          <Text style={styles.cityName}>Johannesburg</Text>
          <Icon name="chevron-down" size={17} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose pickup time"
          onPress={() => setScheduleOpen(true)}
          style={styles.scheduleButton}
        >
          <Icon name="time-outline" size={22} />
        </Pressable>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        Where are you going today?
      </Text>

      {active && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View current demo ride"
          onPress={() => onRide(active.id)}
          style={styles.activeCard}
        >
          <Icon name="car-outline" color={c.white} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.activeTitle}>{statusLabels[active.status]}</Text>
            <Text style={{ color: c.sky, fontSize: 13 }}>
              {active.destination.name} · tap to continue your demo
            </Text>
          </View>
          <Icon name="arrow-forward" color={c.white} />
        </Pressable>
      )}

      <IllustratedMap route={!!destination} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          destination ? `Change destination: ${destination.name}` : "Where to?"
        }
        onPress={() => setPicker("destination")}
        style={styles.search}
      >
        <Icon name="search" size={25} color={c.muted} />
        <Text
          numberOfLines={1}
          style={[styles.searchText, !destination && { color: c.muted }]}
        >
          {destination?.name ?? "Where to?"}
        </Text>
      </Pressable>

      {scheduledAt && (
        <Text style={ui.small}>Pickup: {dateLabel(scheduledAt)} SAST</Text>
      )}

      {estimate && (
        <View style={styles.requestRide}>
          <View style={ui.row}>
            <Icon name="cash-outline" size={20} />
            <Text style={[ui.small, { flex: 1 }]}>
              Cash · {estimate.distanceKm.toFixed(1)} km · approx.{" "}
              {estimate.minutes} min
            </Text>
          </View>
          <Button
            label={`Request demo ride · ${money(estimate!.fare)}`}
            icon="arrow-forward"
            onPress={book}
            disabled={!!active}
          />
          <Text style={[ui.small, { textAlign: "center" }]}>
            Demo only. No driver is contacted and no payment is taken.
            Distance and fares are illustrative estimates.
          </Text>
        </View>
      )}
      {error !== "" && <Notice error>{error}</Notice>}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Recent
        </Text>
        <View style={{ gap: 10 }}>
          {recentPlaces.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${place.name}`}
              onPress={() => setDestination(place)}
              style={styles.recent}
            >
              <Icon name="time-outline" size={24} color={c.muted} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.recentName}>{place.name}</Text>
                <Text style={styles.recentAddress}>{place.address}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={c.muted} />
            </Pressable>
          ))}
        </View>
      </View>

      {picker && (
        <PlacePicker
          kind={picker}
          onClose={() => setPicker(null)}
          onSelect={(place) => {
            if (picker === "pickup") setPickup(place);
            else setDestination(place);
            setError("");
          }}
        />
      )}
      <Sheet
        visible={scheduleOpen}
        title="When do you want to go?"
        onClose={() => setScheduleOpen(false)}
      >
        <Text style={ui.body}>
          Choose a sample pickup time. Scheduled demo rides are saved on this
          device; they are not dispatched.
        </Text>
        <Button
          label="Ride now"
          onPress={() => {
            setScheduledAt(null);
            setScheduleOpen(false);
          }}
        />
        {[30, 60, 120, 1440].map((minutes) => (
          <Button
            key={minutes}
            secondary
            label={
              minutes === 1440
                ? "Tomorrow at this time"
                : `In ${minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes > 60 ? "s" : ""}`}`
            }
            onPress={() => {
              setScheduledAt(
                new Date(Date.now() + minutes * 60000).toISOString(),
              );
              setScheduleOpen(false);
            }}
          />
        ))}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 16 },
  cityButton: {
    minHeight: 44,
    gap: 9,
    paddingHorizontal: 8,
  },
  cityName: {
    color: c.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  scheduleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.line,
  },
  title: {
    color: c.ink,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  activeCard: {
    padding: 18,
    backgroundColor: c.navy,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  activeTitle: { color: c.white, fontSize: 17, fontWeight: "700" },
  search: {
    minHeight: 58,
    marginTop: -20,
    marginHorizontal: 6,
    paddingHorizontal: 19,
    borderRadius: 23,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: c.navy,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  searchText: {
    flex: 1,
    color: c.ink,
    fontSize: 18,
    fontWeight: "600",
  },
  section: { gap: 13 },
  sectionTitle: {
    color: c.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  requestRide: { gap: 12 },
  recent: {
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: c.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  recentName: { color: c.ink, fontSize: 15, fontWeight: "700" },
  recentAddress: { color: c.muted, fontSize: 13 },
});
