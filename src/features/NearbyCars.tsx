import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { Nearby } from "../api/discovery";
import { services, type ServiceId } from "../domain/passenger";
import { Button, Icon, Notice, ui } from "../ui/components";
import { dashboardColors as c } from "../ui/theme";

export function NearbyCars({
  data,
  loading,
  error,
  retry,
  selected,
  onSelect,
}: {
  data: Nearby | null;
  loading: boolean;
  error: string;
  retry: () => void;
  selected: ServiceId | null;
  onSelect: (id: ServiceId | null) => void;
}) {
  return (
    <View style={[ui.card, { gap: 12, padding: 16 }]}>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Text style={ui.h3}>Cars near your pickup</Text>
        {loading && (
          <ActivityIndicator
            accessibilityLabel="Refreshing nearby cars"
            color={c.navy}
          />
        )}
      </View>
      {error ? (
        <>
          <Notice error>{error}</Notice>
          <Button label="Retry nearby cars" secondary onPress={retry} />
        </>
      ) : null}
      {data ? (
        <>
          <Text accessibilityLiveRegion="polite" style={ui.small}>
            {data.cars.length} available{" "}
            {data.cars.length === 1 ? "car" : "cars"} within{" "}
            {data.radiusMeters / 1000} km
            {data.expanded ? " · search expanded" : ""}
          </Text>
          {services.map((service) => {
            const category = data.categories.find(
              (item) => item.id === service.id,
            );
            const count = category?.available ?? 0;
            return (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityLabel={`${service.name}, ${count} available cars`}
                accessibilityState={{ selected: selected === service.id }}
                onPress={() =>
                  onSelect(selected === service.id ? null : service.id)
                }
                style={[
                  ui.row,
                  {
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected === service.id ? c.link : c.line,
                  },
                ]}
              >
                <Icon name={service.icon} color={c.navy} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={ui.h3}>{service.name}</Text>
                  <Text style={ui.small}>
                    {service.seats} seats ·{" "}
                    {count ? `${count} available` : "No cars nearby"}
                  </Text>
                </View>
                <Text style={ui.body}>
                  {category?.pickupSeconds != null
                    ? `${Math.max(1, Math.ceil(category.pickupSeconds / 60))} min`
                    : count
                      ? "ETA unavailable"
                      : "—"}
                </Text>
              </Pressable>
            );
          })}
          {data.cars.length === 0 && (
            <Text style={ui.body}>
              No available cars nearby right now. We’ll keep checking.
            </Text>
          )}
          <Text style={ui.small}>
            Pickup estimates can change. Distances shown without an ETA are
            straight-line distances.
          </Text>
          <Button label="Refresh nearby cars" secondary onPress={retry} />
        </>
      ) : !error && !loading ? (
        <Text style={ui.small}>
          Choose a pickup to see available cars and categories.
        </Text>
      ) : null}
    </View>
  );
}
