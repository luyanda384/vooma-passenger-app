import { dashboardColors as c } from "../ui/theme";
import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import {
  advanceRide,
  cancelRide,
  dateLabel,
  isActive,
  money,
  rateRide,
  services,
  statusLabels,
  type Ride,
  type RideStatus,
} from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, Icon, Notice, Sheet, ui } from "../ui/components";
import { PassengerMap } from "./map/PassengerMap";

const copy: Record<
  RideStatus,
  { title: string; detail: string; next?: string }
> = {
  scheduled: {
    title: "A little planning goes a long way.",
    detail:
      "Your scheduled demo is saved. You can simulate pickup now to explore the rest of the journey.",
    next: "Simulate scheduled pickup",
  },
  requested: {
    title: "Let’s find your ride.",
    detail:
      "In the live app, nearby drivers would receive your request. Continue below to meet the sample driver.",
    next: "Simulate driver match",
  },
  matched: {
    title: "Meet your demo driver.",
    detail:
      "Thabo is a sample driver. No real driver has been assigned or contacted.",
    next: "Simulate driver arrival",
  },
  arriving: {
    title: "Your demo ride is here.",
    detail:
      "For a real ride, always check the driver and vehicle details before getting in.",
    next: "Simulate starting trip",
  },
  in_progress: {
    title: "You’re on your way.",
    detail:
      "Explore the journey preview. No live tracking or real transport is taking place.",
    next: "Complete demo trip",
  },
  completed: {
    title: "And just like that, you’re here.",
    detail: "Thanks for trying Vooma. How was your demo experience?",
  },
  cancelled: {
    title: "Plans change. That’s okay.",
    detail:
      "This demo ride has been cancelled. There is no cancellation charge.",
  },
};
export function RideDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { state, update } = usePassenger();
  const ride = state.rides.find((r) => r.id === id);
  const [cancel, setCancel] = useState(false);
  const [info, setInfo] = useState(false);
  const [error, setError] = useState("");
  if (!ride) return null;
  const step = copy[ride.status];
  const driverVisible = [
    "matched",
    "arriving",
    "in_progress",
    "completed",
  ].includes(ride.status);
  function change(transform: (previous: Ride) => Ride) {
    try {
      update((previous) => ({
        ...previous,
        rides: previous.rides.map((r) => (r.id === id ? transform(r) : r)),
      }));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This ride could not be updated.",
      );
    }
  }
  async function share() {
    try {
      await Share.share({
        message: `Vooma DEMO trip (not a real booking): ${ride!.pickup.name} to ${ride!.destination.name}. ${statusLabels[ride!.status]}. Reference: ${ride!.id}. No live tracking link is available.`,
      });
    } catch {
      setError(
        "Sharing is unavailable on this device. You can copy the trip reference from the details below.",
      );
    }
  }
  return (
    <Sheet visible title="Your demo ride" onClose={onClose}>
      <View style={ui.between}>
        <View style={ui.badge}>
          <Text style={ui.badgeText}>
            {statusLabels[ride.status].toUpperCase()}
          </Text>
        </View>
        <Text style={ui.small}>{dateLabel(ride.createdAt)} SAST</Text>
      </View>
      <Text style={ui.h1}>{step.title}</Text>
      <Text style={ui.body}>{step.detail}</Text>
      {isActive(ride) && (
        <PassengerMap pickup={ride.pickup} destination={ride.destination} />
      )}
      {driverVisible && (
        <View style={[ui.card, { padding: 16 }]}>
          <View style={ui.row}>
            <View
              style={[
                ui.emptyIcon,
                { width: 58, height: 58, borderRadius: 20 },
              ]}
            >
              <Icon name="person-outline" size={29} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ui.h3}>Thabo M. · sample driver</Text>
              <Text style={ui.small}>Silver demo vehicle · DEMO 001</Text>
            </View>
          </View>
          <Button
            label="Contact & safety information"
            secondary
            icon="shield-checkmark-outline"
            onPress={() => setInfo(true)}
          />
        </View>
      )}
      <View style={[ui.card, { padding: 18 }]}>
        <View style={ui.row}>
          <Icon name="ellipse" size={12} color={c.orange} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={ui.small}>PICKUP</Text>
            <Text style={ui.h3}>{ride.pickup.name}</Text>
            <Text style={ui.small}>{ride.pickup.address}</Text>
          </View>
        </View>
        <View style={ui.divider} />
        <View style={ui.row}>
          <Icon name="square" size={12} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={ui.small}>DROP-OFF</Text>
            <Text style={ui.h3}>{ride.destination.name}</Text>
            <Text style={ui.small}>{ride.destination.address}</Text>
          </View>
        </View>
        {ride.scheduledAt && (
          <Text style={ui.small}>
            Scheduled for {dateLabel(ride.scheduledAt)} SAST
          </Text>
        )}
        <View style={ui.divider} />
        <View style={ui.between}>
          <Text style={ui.body}>
            {services.find((s) => s.id === ride.service)?.name} · Cash
          </Text>
          <Text style={ui.h2}>{money(ride.fare)}</Text>
        </View>
        <Text style={ui.small}>
          Sample estimate · {ride.distanceKm.toFixed(1)} km · {ride.minutes}{" "}
          min. No payment was taken or is due.
        </Text>
      </View>
      {ride.status === "completed" && (
        <View style={{ gap: 12, alignItems: "center" }}>
          <Text style={ui.h3}>
            {ride.rating ? "Thanks for your feedback!" : "Rate this demo ride"}
          </Text>
          <View style={ui.row}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
                accessibilityState={{ selected: ride.rating === star }}
                onPress={() => change((r) => rateRide(r, star))}
                style={{ padding: 7 }}
              >
                <Icon
                  name={star <= (ride.rating ?? 0) ? "star" : "star-outline"}
                  size={31}
                  color={c.orange}
                />
              </Pressable>
            ))}
          </View>
          <Text style={ui.small}>Feedback is saved on this device only.</Text>
        </View>
      )}
      {error !== "" && <Notice error>{error}</Notice>}
      {step.next && (
        <Button
          label={step.next}
          onPress={() => change(advanceRide)}
          icon="arrow-forward"
        />
      )}
      {isActive(ride) && ride.status !== "in_progress" && (
        <Button
          label="Cancel demo ride"
          secondary
          onPress={() => setCancel(true)}
        />
      )}
      <Button
        label="Share demo trip details"
        secondary
        icon="share-outline"
        onPress={() => void share()}
      />
      <Text selectable style={ui.small}>
        Reference: {ride.id}
      </Text>
      <Notice>
        This is a local simulation. Drivers, dispatch, routes, fares and payment
        processing are not connected.
      </Notice>
      <Sheet
        visible={cancel}
        title="Cancel this demo ride?"
        onClose={() => setCancel(false)}
      >
        <Text style={ui.body}>
          The ride will stay in your history as cancelled. There is no charge.
        </Text>
        <Button
          label="Yes, cancel demo ride"
          onPress={() => {
            change(cancelRide);
            setCancel(false);
          }}
        />
        <Button
          label="Keep my ride"
          secondary
          onPress={() => setCancel(false)}
        />
      </Sheet>
      <Sheet
        visible={info}
        title="Contact & safety"
        onClose={() => setInfo(false)}
      >
        <Notice>
          Driver calling, messaging, live trip sharing and emergency assistance
          are not connected in this demo.
        </Notice>
        <Text style={ui.h3}>Before every real ride</Text>
        <Text style={ui.body}>
          Check the number plate, vehicle and driver against the details in your
          booking. Share your journey with someone you trust. If anything feels
          wrong, don’t get in.
        </Text>
        <Text style={ui.body}>
          If you are in immediate danger, use your phone to contact local
          emergency services directly.
        </Text>
        <Button label="Got it" onPress={() => setInfo(false)} />
      </Sheet>
    </Sheet>
  );
}
