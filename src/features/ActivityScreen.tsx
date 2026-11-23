import { dashboardColors as c, dashboardStyles as d } from "../ui/theme";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  dateLabel,
  isActive,
  money,
  services,
  statusLabels,
  type Ride,
  type ServiceId,
} from "../domain/passenger";
import { usePassenger } from "../state/PassengerProvider";
import { Button, Icon, ui } from "../ui/components";

type RideFilter = "Upcoming" | "Completed" | "Cancelled";
type DateFilter = "Last 7 days" | "Last 30 days" | "Last 90 days" | "All time";

const dateFilters: DateFilter[] = [
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
  "All time",
];

function rideDate(ride: Ride) {
  return ride.scheduledAt ?? ride.createdAt;
}

function formatRideDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
  const sameDay = dateFormatter.format(date) === dateFormatter.format(today);
  const time = new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(date);
  if (sameDay) return `Today, ${time}`;
  const day = new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  }).format(date);
  return `${day} at ${time}`;
}

function withinDateFilter(ride: Ride, filter: DateFilter) {
  if (filter === "All time" || isActive(ride)) return true;
  const days = Number.parseInt(filter, 10);
  return Date.parse(rideDate(ride)) >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function matchesSearch(ride: Ride, query: string) {
  return (
    !query ||
    `${ride.pickup.name} ${ride.pickup.address} ${ride.destination.name} ${ride.destination.address}`
      .toLocaleLowerCase()
      .includes(query)
  );
}

function RideStatusBadge({ ride }: { ride: Ride }) {
  const style =
    ride.status === "completed"
      ? styles.completedBadge
      : ride.status === "cancelled"
        ? styles.cancelledBadge
        : styles.upcomingBadge;
  const textStyle =
    ride.status === "completed"
      ? styles.completedBadgeText
      : ride.status === "cancelled"
        ? styles.cancelledBadgeText
        : styles.upcomingBadgeText;
  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {statusLabels[ride.status]}
      </Text>
    </View>
  );
}

function UpcomingRideCard({
  ride,
  onPress,
}: {
  ride: Ride;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View upcoming ride to ${ride.destination.name}, ${statusLabels[ride.status]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.upcomingCard, pressed && styles.pressed]}
    >
      <View style={styles.calendarTile}>
        <Icon name="calendar-outline" size={27} color={c.link} />
      </View>
      <View style={styles.upcomingDetails}>
        <View style={ui.between}>
          <Text style={styles.upcomingTitle}>Upcoming ride</Text>
          <RideStatusBadge ride={ride} />
        </View>
        <Text style={styles.rideDate}>{formatRideDate(rideDate(ride))}</Text>
        <View style={styles.addressRow}>
          <Icon name="location-outline" size={17} color={c.muted} />
          <Text numberOfLines={1} style={styles.addressText}>
            {ride.pickup.address}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={22} color={c.ink} />
    </Pressable>
  );
}

function PastRideCard({ ride, onPress }: { ride: Ride; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ride from ${ride.pickup.name} to ${ride.destination.name}, ${statusLabels[ride.status]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pastCard, pressed && styles.pressed]}
    >
      <View style={styles.pastHeading}>
        <Text numberOfLines={1} style={styles.pastDate}>
          {formatRideDate(rideDate(ride))}
        </Text>
        <RideStatusBadge ride={ride} />
      </View>
      <View style={styles.pastBody}>
        <View style={styles.route}>
          <View style={styles.routeOrigin} />
          <View style={styles.routeLine} />
          <View style={styles.routeDestination} />
        </View>
        <View style={styles.routeAddresses}>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {ride.pickup.name}
          </Text>
          <Text numberOfLines={1} style={styles.routeAddress}>
            {ride.destination.name}
          </Text>
        </View>
        <View style={styles.fare}>
          <Text numberOfLines={1} style={styles.fareText}>
            {money(ride.fare)}
          </Text>
          <Icon name="chevron-forward" size={22} color={c.ink} />
        </View>
      </View>
    </Pressable>
  );
}

export function ActivityScreen({
  onRide,
  onBook,
}: {
  onRide: (id: string) => void;
  onBook: () => void;
}) {
  const { state } = usePassenger();
  const [filter, setFilter] = useState<RideFilter>("Upcoming");
  const [dateFilter, setDateFilter] = useState<DateFilter>("Last 30 days");
  const [serviceFilter, setServiceFilter] = useState<ServiceId | "all">("all");
  const [search, setSearch] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const query = search.trim().toLocaleLowerCase();
  const upcomingRide = state.rides.find(
    (ride) =>
      !ride.id.startsWith("VP-") &&
      isActive(ride) &&
      matchesSearch(ride, query) &&
      (serviceFilter === "all" || ride.service === serviceFilter),
  );
  const rides = useMemo(() => {
    return state.rides.filter((ride) => {
      // Legacy local simulations are retained in storage, not presented as real rides.
      if (ride.id.startsWith("VP-")) return false;
      const matchesStatus =
        filter === "Upcoming"
          ? isActive(ride)
          : ride.status === filter.toLocaleLowerCase();
      return (
        matchesStatus &&
        matchesSearch(ride, query) &&
        withinDateFilter(ride, dateFilter) &&
        (serviceFilter === "all" || ride.service === serviceFilter)
      );
    });
  }, [dateFilter, filter, query, serviceFilter, state.rides]);
  const listRides =
    filter === "Upcoming"
      ? rides.filter((ride) => ride.id !== upcomingRide?.id)
      : rides;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Rides"
        subtitle="Your upcoming trips and ride history."
      />

      <View style={styles.tabs}>
        {(["Upcoming", "Completed", "Cancelled"] as const).map((item) => {
          const selected = item === filter;
          return (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item)}
              style={[styles.tab, selected && styles.selectedTab]}
            >
              <Text
                style={[styles.tabText, selected && styles.selectedTabText]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchAndDate}>
          <Icon name="search" size={23} color={c.muted} />
          <TextInput
            accessibilityLabel="Search rides"
            onChangeText={setSearch}
            placeholder="Search rides"
            placeholderTextColor={c.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
          <View style={styles.toolbarDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Date range: ${dateFilter}`}
            onPress={() => setShowDates((visible) => !visible)}
            style={styles.dateButton}
          >
            <Icon name="calendar-outline" size={21} color={c.muted} />
            <Text numberOfLines={1} style={styles.dateButtonText}>
              {dateFilter}
            </Text>
            <Icon name="chevron-down" size={18} color={c.ink} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter by ride type"
          accessibilityState={{ expanded: showServices }}
          onPress={() => setShowServices((visible) => !visible)}
          style={({ pressed }) => [
            styles.filterButton,
            pressed && styles.pressed,
          ]}
        >
          <Icon name="options-outline" size={25} color={c.ink} />
        </Pressable>
      </View>

      {showDates && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Date range</Text>
          <View style={styles.optionRow}>
            {dateFilters.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: dateFilter === item }}
                onPress={() => {
                  setDateFilter(item);
                  setShowDates(false);
                }}
                style={[
                  styles.option,
                  dateFilter === item && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    dateFilter === item && styles.selectedOptionText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {showServices && (
        <View style={styles.filterPanel}>
          <View style={ui.between}>
            <Text style={styles.filterTitle}>Ride type</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear ride type filter"
              onPress={() => setServiceFilter("all")}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.optionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: serviceFilter === "all" }}
              onPress={() => setServiceFilter("all")}
              style={[
                styles.option,
                serviceFilter === "all" && styles.selectedOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  serviceFilter === "all" && styles.selectedOptionText,
                ]}
              >
                All rides
              </Text>
            </Pressable>
            {services.map((service) => (
              <Pressable
                key={service.id}
                accessibilityRole="button"
                accessibilityState={{ selected: serviceFilter === service.id }}
                onPress={() => setServiceFilter(service.id)}
                style={[
                  styles.option,
                  serviceFilter === service.id && styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    serviceFilter === service.id && styles.selectedOptionText,
                  ]}
                >
                  {service.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {upcomingRide && (
        <UpcomingRideCard
          ride={upcomingRide}
          onPress={() => onRide(upcomingRide.id)}
        />
      )}

      {!listRides.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            {filter === "Upcoming"
              ? "No upcoming rides"
              : `No ${filter.toLowerCase()} rides`}
          </Text>
          <Text style={styles.emptyDescription}>
            {filter === "Upcoming"
              ? "Your planned rides will show up here."
              : `Rides from the last ${dateFilter.toLowerCase()} will appear here.`}
          </Text>
          {filter === "Upcoming" && (
            <Button label="Plan a ride" icon="arrow-forward" onPress={onBook} />
          )}
        </View>
      ) : (
        <View style={styles.rideList}>
          {listRides.map((ride) => (
            <PastRideCard
              key={ride.id}
              ride={ride}
              onPress={() => onRide(ride.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  tabs: {
    ...d.card,
    flexDirection: "row",
    borderRadius: 30,
    padding: 7,
    gap: 7,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    minHeight: 44,
    borderRadius: 24,
    paddingVertical: 10,
  },
  selectedTab: {
    backgroundColor: c.action,
  },
  tabText: {
    color: c.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  selectedTabText: { color: c.white },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchAndDate: {
    ...d.field,
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: c.ink,
    fontSize: 15,
  },
  toolbarDivider: { width: 1, height: 34, backgroundColor: c.line },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: "55%",
    minWidth: 0,
    flexShrink: 1,
  },
  dateButtonText: { color: c.ink, fontSize: 14, flexShrink: 1 },
  filterButton: {
    ...d.field,
    width: 56,
    height: 56,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.72 },
  filterPanel: {
    ...d.card,
    gap: 11,
    padding: 15,
  },
  filterTitle: { color: c.ink, fontSize: 15, fontWeight: "700" },
  clearText: { color: c.link, fontSize: 13, fontWeight: "700" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#EAF2FB",
  },
  selectedOption: {
    backgroundColor: c.sky,
  },
  optionText: { color: c.muted, fontSize: 12, fontWeight: "600" },
  selectedOptionText: { color: c.ink },
  upcomingCard: {
    ...d.card,
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  calendarTile: {
    width: 56,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.sky,
    borderRadius: 14,
  },
  upcomingDetails: { flex: 1, minWidth: 0, gap: 5 },
  upcomingTitle: {
    flexShrink: 1,
    color: c.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  rideDate: { color: c.muted, fontSize: 14 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  addressText: { flex: 1, color: c.muted, fontSize: 13 },
  badge: {
    flexShrink: 0,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  upcomingBadge: { backgroundColor: c.sky },
  upcomingBadgeText: { color: c.ink },
  completedBadge: { backgroundColor: "#D1F5DF" },
  completedBadgeText: { color: "#176B46" },
  cancelledBadge: { backgroundColor: "#FDE2E2" },
  cancelledBadgeText: { color: "#B32736" },
  emptyCard: {
    ...d.card,
    alignItems: "center",
    gap: 11,
    padding: 24,
  },
  emptyTitle: { color: c.ink, fontSize: 18, fontWeight: "700" },
  emptyDescription: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  rideList: { gap: 14 },
  pastCard: {
    ...d.card,
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  pastHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pastDate: { flex: 1, color: c.ink, fontSize: 15, fontWeight: "700" },
  pastBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  route: {
    width: 14,
    height: 45,
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeOrigin: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: c.white,
    borderColor: "#1686FF",
  },
  routeLine: {
    position: "absolute",
    top: 11,
    bottom: 11,
    left: 6,
    borderLeftWidth: 2,
    borderStyle: "dashed",
    borderColor: "#8C9BB0",
  },
  routeDestination: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#44546A",
    borderWidth: 2,
    borderColor: "#C6CFDB",
  },
  routeAddresses: { flex: 1, minWidth: 0, gap: 9 },
  routeAddress: { color: c.ink, fontSize: 14 },
  fare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderLeftWidth: 1,
    borderLeftColor: c.line,
    paddingLeft: 12,
  },
  fareText: { color: c.ink, fontSize: 15, fontWeight: "700" },
});
