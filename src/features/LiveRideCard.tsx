import { Text, View } from "react-native";
import { Button, Notice, ui } from "../ui/components";
import { services } from "../domain/passenger";
import type { LiveRide } from "../api/rides";
import { freshTracking, formatDistance, formatEta } from "../api/ride-tracking";
export function LiveRideCard({
  ride,
  busy,
  onCancel,
}: {
  ride: LiveRide;
  busy: boolean;
  onCancel: () => void;
}) {
  const tracking =
    ["matched", "arriving", "in_progress"].includes(ride.status) &&
    ride.driver?.location
      ? freshTracking(ride.tracking)
      : null;
  const labels = {
    requested: "Finding your driver",
    matched: "Your driver is on the way",
    arriving: "Your driver has arrived",
    in_progress: "You are on your way",
    completed: "Trip completed",
    cancelled: "Ride cancelled",
    expired: "No driver accepted this request",
  };
  return (
    <View style={[ui.card, { padding: 16, gap: 12 }]}>
      <Text accessibilityLiveRegion="polite" style={ui.h3}>
        {labels[ride.status]}
      </Text>
      {tracking && (
        <View
          style={{
            backgroundColor: "#082344",
            borderRadius: 20,
            padding: 18,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <View>
              <Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>
                {formatEta(tracking.durationSeconds)}
              </Text>
              <Text style={{ color: "#C9D9EB" }}>
                {tracking.target === "pickup"
                  ? "to your pickup"
                  : "to your destination"}
              </Text>
            </View>
            <View>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
                {formatDistance(tracking.distanceMeters)}
              </Text>
              <Text style={{ color: "#C9D9EB" }}>by road</Text>
            </View>
          </View>
          <Text style={{ color: "#C9D9EB", fontSize: 12 }}>
            Traffic-aware estimate · Google Maps
          </Text>
        </View>
      )}
      {!tracking &&
        ["matched", "in_progress"].includes(ride.status) &&
        ride.driver?.location && (
          <Notice>
            Live location available · ETA temporarily unavailable.
          </Notice>
        )}
      <Text style={ui.body}>
        {services.find((s) => s.id === ride.category)?.name} ·{" "}
        {ride.pickup.name} to {ride.destination.name}
      </Text>
      {ride.status === "requested" && (
        <Text style={ui.small}>
          Nearby drivers have received your request. Please wait for a driver to
          accept.
        </Text>
      )}
      {ride.driver && (
        <>
          <Text style={ui.h3}>{ride.driver.name}</Text>
          <Text style={ui.body}>
            {ride.driver.vehicle.colour} {ride.driver.vehicle.make}{" "}
            {ride.driver.vehicle.model} · {ride.driver.vehicle.plate}
          </Text>
          {!ride.driver.location &&
            ["matched", "arriving", "in_progress"].includes(ride.status) && (
              <Notice>Waiting for your driver’s location to reconnect.</Notice>
            )}
        </>
      )}
      {["requested", "matched", "arriving"].includes(ride.status) && (
        <Button label="Cancel ride" secondary busy={busy} onPress={onCancel} />
      )}
      {ride.status === "expired" && (
        <Text style={ui.body}>
          Choose an available category below to try again.
        </Text>
      )}
    </View>
  );
}
