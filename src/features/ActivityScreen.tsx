import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { dateLabel, isActive, money, statusLabels } from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, c, Empty, Icon, ui } from "../ui/components";

export function ActivityScreen({
  onRide,
  onBook,
}: {
  onRide: (id: string) => void;
  onBook: () => void;
}) {
  const { state } = usePassenger();
  const [filter, setFilter] = useState<"All" | "Active" | "Past">("All");
  const rides = state.rides.filter(
    (ride) =>
      filter === "All" ||
      (filter === "Active" ? isActive(ride) : !isActive(ride)),
  );
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={ui.label}>EVERY JOURNEY, IN ONE PLACE</Text>
        <Text accessibilityRole="header" style={ui.h1}>
          Your rides
        </Text>
        <Text style={ui.body}>Plans ahead and places you’ve been.</Text>
      </View>
      <View style={ui.row}>
        {(["All", "Active", "Past"] as const).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: item === filter }}
            key={item}
            onPress={() => setFilter(item)}
            style={{
              paddingVertical: 13,
              paddingHorizontal: 23,
              borderRadius: 25,
              backgroundColor: item === filter ? c.navy : c.white,
            }}
          >
            <Text
              style={{
                color: item === filter ? c.white : c.navy,
                fontWeight: "700",
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
      {!rides.length && (
        <View style={ui.card}>
          <Empty
            icon="receipt-outline"
            title={
              filter === "All"
                ? "Your first ride is waiting"
                : `No ${filter.toLowerCase()} rides yet`
            }
            description="Demo trips you create will appear here. Open a trip to follow its progress, view details or leave a rating."
          />
          <Button label="Plan a ride" onPress={onBook} />
        </View>
      )}
      {rides.map((ride) => (
        <Pressable
          key={ride.id}
          accessibilityRole="button"
          accessibilityLabel={`View ride to ${ride.destination.name}, ${statusLabels[ride.status]}`}
          onPress={() => onRide(ride.id)}
          style={ui.card}
        >
          <View style={ui.between}>
            <View style={ui.badge}>
              <Text style={ui.badgeText}>{statusLabels[ride.status]}</Text>
            </View>
            <Text style={ui.small}>
              {dateLabel(ride.scheduledAt ?? ride.createdAt)} SAST
            </Text>
          </View>
          <View style={ui.row}>
            <View style={ui.emptyIcon}>
              <Icon name="car-sport-outline" size={34} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={ui.h3}>{ride.destination.name}</Text>
              <Text style={ui.small}>From {ride.pickup.name}</Text>
              <Text style={ui.h3}>
                {money(ride.fare)} <Text style={ui.small}>· Demo estimate</Text>
              </Text>
            </View>
            <Icon name="chevron-forward" />
          </View>
        </Pressable>
      ))}
      <Text style={[ui.small, { textAlign: "center" }]}>
        Demo history is stored on this device only.
      </Text>
    </View>
  );
}
