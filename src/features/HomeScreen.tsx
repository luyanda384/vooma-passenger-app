import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  createRide,
  dateLabel,
  isActive,
  money,
  places,
  quote,
  services,
  statusLabels,
  type Place,
  type ServiceId,
} from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, c, Icon, Notice, Sheet, ui } from "../ui/components";
import { Car, IllustratedMap } from "../ui/IllustratedMap";
import { PlacePicker } from "./PlacePicker";

export function HomeScreen({
  onRide,
  onSaved,
}: {
  onRide: (id: string) => void;
  onSaved: () => void;
}) {
  const { state, update } = usePassenger();
  const wide = useWindowDimensions().width >= 850;
  const [pickup, setPickup] = useState<Place>(places[0]);
  const [destination, setDestination] = useState<Place | null>(null);
  const [picker, setPicker] = useState<"pickup" | "destination" | null>(null);
  const [service, setService] = useState<ServiceId>("go");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const active = state.rides.find(isActive);
  const estimate = destination ? quote(pickup, destination, service) : null;
  const favourites = places.filter((p) => state.saved.includes(p.id));
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
          service,
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
    <View style={{ gap: 24 }}>
      <View style={ui.between}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ui.label}>YOUR CITY. YOUR PACE.</Text>
          <Text accessibilityRole="header" style={ui.h1}>
            Where to{state.name ? `, ${state.name.split(" ")[0]}` : ""}?
          </Text>
          <Text style={ui.body}>A fresh day. A new destination. Let’s go.</Text>
        </View>
        <View style={styles.sun}>
          <Icon name="sunny-outline" color={c.orange} size={27} />
        </View>
      </View>
      {active && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View current demo ride"
          onPress={() => onRide(active.id)}
          style={styles.activeCard}
        >
          <Icon name="car-outline" color={c.white} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.activeTitle}>
              {statusLabels[active.status]}
            </Text>
            <Text style={{ color: c.sky, fontSize: 13 }}>
              {active.destination.name} · tap to continue your demo
            </Text>
          </View>
          <Icon name="arrow-forward" color={c.white} />
        </Pressable>
      )}
      <View
        style={[
          styles.layout,
          wide && { flexDirection: "row", alignItems: "stretch" },
        ]}
      >
        <View style={[styles.mapColumn, wide && { flex: 1.1 }]}>
          <IllustratedMap route={!!destination} />
          <View style={styles.promise}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={ui.label}>A RIDE FOR EVERY DAY</Text>
              <Text style={ui.h2}>Good things are{"\n"}just a ride away.</Text>
              <Text style={ui.small}>Built for the way you move.</Text>
            </View>
            <Car />
          </View>
        </View>
        <View style={[ui.card, wide && { flex: 1 }, { gap: 18 }]}>
          <View style={ui.between}>
            <Text style={ui.h2}>Plan your ride</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose pickup time"
              onPress={() => setScheduleOpen(true)}
              style={[ui.row, styles.schedule]}
            >
              <Icon name="time-outline" size={17} />
              <Text style={{ fontWeight: "600", color: c.navy, fontSize: 12 }}>
                {scheduledAt ? "Scheduled" : "Ride now"}
              </Text>
              <Icon name="chevron-down" size={14} />
            </Pressable>
          </View>
          <View style={styles.locations}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pickup: ${pickup.name}`}
              onPress={() => setPicker("pickup")}
              style={styles.locationRow}
            >
              <View style={styles.pickupDot} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.label}>PICKUP</Text>
                <Text style={ui.h3} numberOfLines={1}>
                  {pickup.name}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} />
            </Pressable>
            <View style={[ui.divider, { marginLeft: 36 }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                destination
                  ? `Destination: ${destination.name}`
                  : "Choose destination"
              }
              onPress={() => setPicker("destination")}
              style={styles.locationRow}
            >
              <View style={styles.destinationDot} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.label}>DROP-OFF</Text>
                <Text
                  style={[ui.h3, !destination && { color: c.muted }]}
                  numberOfLines={1}
                >
                  {destination?.name ?? "Where are you going?"}
                </Text>
              </View>
              <Icon name="search-outline" size={19} />
            </Pressable>
          </View>
          {scheduledAt && (
            <Text style={ui.small}>Pickup: {dateLabel(scheduledAt)} SAST</Text>
          )}
          {destination ? (
            <View style={{ gap: 10 }}>
              <View style={ui.between}>
                <Text style={ui.label}>CHOOSE YOUR RIDE</Text>
                <Text style={ui.small}>Sample fares</Text>
              </View>
              {services.map((option) => {
                const selected = option.id === service;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${option.name}, ${option.seats} seats, ${money(quote(pickup, destination, option.id).fare)}`}
                    onPress={() => setService(option.id)}
                    style={[styles.service, selected && styles.serviceSelected]}
                  >
                    <View
                      style={[
                        styles.carIcon,
                        selected && { backgroundColor: c.sky },
                      ]}
                    >
                      <Icon name={option.icon} size={30} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={ui.h3}>{option.name}</Text>
                      <Text style={ui.small}>
                        {option.description} · {option.seats} seats
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text style={ui.h3}>
                        {money(quote(pickup, destination, option.id).fare)}
                      </Text>
                      <Icon
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={18}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={ui.label}>A LITTLE INSPIRATION</Text>
              {[places[1], places[2]].map((place) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${place.name}`}
                  key={place.id}
                  onPress={() => setDestination(place)}
                  style={[ui.row, { paddingVertical: 6 }]}
                >
                  <View style={ui.iconButton}>
                    <Icon
                      name={
                        place.id === "airport"
                          ? "airplane-outline"
                          : "bag-outline"
                      }
                      size={20}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={ui.h3}>{place.name}</Text>
                    <Text style={ui.small}>
                      {place.id === "airport"
                        ? "Your next adventure starts here"
                        : "Shopping, coffee & a change of scene"}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={18} />
                </Pressable>
              ))}
            </View>
          )}
          {estimate && (
            <View style={ui.row}>
              <Icon name="cash-outline" size={20} />
              <Text style={[ui.small, { flex: 1 }]}>
                Cash · {estimate.distanceKm.toFixed(1)} km · approx.{" "}
                {estimate.minutes} min
              </Text>
            </View>
          )}
          {error !== "" && <Notice error>{error}</Notice>}
          <Button
            label={
              destination
                ? `Request demo ride · ${money(estimate!.fare)}`
                : "Find a ride"
            }
            icon="arrow-forward"
            onPress={book}
            disabled={!!active}
          />
          <Text style={[ui.small, { textAlign: "center" }]}>
            Demo only. No driver is contacted and no payment is taken.
            {destination
              ? " Distance and fares are illustrative estimates."
              : ""}
          </Text>
        </View>
      </View>
      <View style={ui.between}>
        <Text style={ui.h2}>Your go-to places</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onSaved}
          style={{ padding: 12 }}
        >
          <Text style={{ color: c.navy, fontWeight: "700" }}>
            Manage <Text>↗</Text>
          </Text>
        </Pressable>
      </View>
      <View style={[ui.row, { flexWrap: "wrap", alignItems: "stretch" }]}>
        {favourites.length ? (
          favourites.map((place) => (
            <Pressable
              accessibilityRole="button"
              key={place.id}
              onPress={() => setDestination(place)}
              style={styles.favourite}
            >
              <View style={ui.iconButton}>
                <Icon name="heart-outline" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.h3}>{place.name}</Text>
                <Text style={ui.small}>{place.address}</Text>
              </View>
              <Icon name="arrow-forward" size={18} />
            </Pressable>
          ))
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onSaved}
            style={styles.favourite}
          >
            <View style={ui.iconButton}>
              <Icon name="add" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ui.h3}>Make yourself at home</Text>
              <Text style={ui.small}>
                Save your favourite stops for a quicker start.
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} />
          </Pressable>
        )}
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
  layout: { gap: 20, flexDirection: "column-reverse" },
  mapColumn: { gap: 18 },
  sun: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#FFF1DE",
    alignItems: "center",
    justifyContent: "center",
  },
  promise: {
    padding: 23,
    borderRadius: 24,
    backgroundColor: c.sky,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  schedule: {
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: c.tint,
  },
  locations: { padding: 14, borderRadius: 18, backgroundColor: c.tint, gap: 5 },
  locationRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
  },
  pickupDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: c.orange,
    marginLeft: 4,
  },
  destinationDot: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: c.navy,
    marginLeft: 4,
  },
  service: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: c.line,
  },
  serviceSelected: { backgroundColor: "#F3F8FC", borderColor: c.navy },
  carIcon: {
    width: 53,
    height: 48,
    backgroundColor: c.tint,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  favourite: {
    flex: 1,
    minWidth: 250,
    padding: 18,
    borderRadius: 22,
    borderColor: c.line,
    borderWidth: 1,
    backgroundColor: c.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeCard: {
    padding: 20,
    backgroundColor: c.navy,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  activeTitle: { color: c.white, fontSize: 17, fontWeight: "700" },
});
