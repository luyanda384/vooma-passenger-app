import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { ScreenHeader } from "../ui/ScreenHeader";
import { Button, Notice, ui } from "../ui/components";
import { useAuth } from "../state/AuthProvider";
import { useRide } from "../location/useRide";
import { ridesApi, type LiveRide } from "../api/rides";
import { LiveRideCard } from "./LiveRideCard";
export function LiveActivityScreen({ onBook }: { onBook: () => void }) {
  const { session } = useAuth(),
    trip = useRide();
  const [rides, setRides] = useState<LiveRide[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0);
  const token = session?.accessToken;
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    void ridesApi
      .history(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRides(data);
          setError("");
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Your rides could not be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, attempt, trip.ride?.id, trip.ride?.version]);
  const recent = trip.ride
    ? [trip.ride, ...rides.filter((ride) => ride.id !== trip.ride!.id)]
    : rides;
  return (
    <View style={{ gap: 14 }}>
      <ScreenHeader
        title="Your rides"
        subtitle="Your recent requests and trips"
      />
      {!!(error || trip.error) && <Notice error>{error || trip.error}</Notice>}
      {loading && <Text style={ui.small}>Loading your rides…</Text>}
      {!loading && !recent.length && !error && (
        <Text style={ui.body}>Your ride requests will appear here.</Text>
      )}
      {recent.map((ride) => (
        <LiveRideCard
          key={ride.id}
          ride={ride}
          busy={trip.busy}
          onCancel={trip.cancel}
        />
      ))}
      <Button label="Book a ride" onPress={onBook} />
      <Button
        label="Refresh rides"
        secondary
        onPress={() => {
          setAttempt((n) => n + 1);
          trip.refresh();
        }}
      />
    </View>
  );
}
