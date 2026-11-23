import { dashboardColors as c, dashboardStyles as d } from "../ui/theme";
import { ScreenHeader } from "../ui/ScreenHeader";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { usePassenger } from "../state/PassengerProvider";
import { useAuth } from "../state/AuthProvider";
import {
  Button,
  Icon,
  Notice,
  Sheet,
  ui,
  type IconName,
} from "../ui/components";

type Panel =
  | "profile"
  | "payments"
  | "promotions"
  | "notifications"
  | "privacy"
  | "help"
  | "reset"
  | "logout"
  | null;

type ProfileRow = {
  id: Exclude<Panel, null | "reset" | "logout"> | "saved";
  icon: IconName;
  title: string;
};

const accountRows: ProfileRow[] = [
  { id: "profile", icon: "person-outline", title: "Personal details" },
  { id: "saved", icon: "bookmark-outline", title: "Saved places" },
  { id: "payments", icon: "card-outline", title: "Payment methods" },
  { id: "promotions", icon: "ticket-outline", title: "Promotions" },
];

const supportRows: ProfileRow[] = [
  {
    id: "notifications",
    icon: "notifications-outline",
    title: "Notifications",
  },
  { id: "help", icon: "help-circle-outline", title: "Help & support" },
  { id: "privacy", icon: "shield-outline", title: "Privacy policy" },
];

function maskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "Phone on file";
  if (digits.startsWith("27"))
    return `+27 ${digits.slice(2, 4)} *** ${digits.slice(-4)}`;
  if (digits.startsWith("0"))
    return `+27 ${digits.slice(1, 3)} *** ${digits.slice(-4)}`;
  return `*** *** ${digits.slice(-4)}`;
}

function maskedEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Email on file";
  return `${name[0]}***@${domain}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase())
    .join("");
}

export function ProfileScreen({ onSaved }: { onSaved: () => void }) {
  const { state, update, reset } = usePassenger();
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [name, setName] = useState(state.name || session?.passenger.name || "");
  const [message, setMessage] = useState("");
  const displayName =
    state.name.trim() || session?.passenger.name || "Passenger";
  const completedRides = state.rides.filter(
    (ride) => !ride.id.startsWith("VP-") && ride.status === "completed",
  );
  const ratedRides = completedRides.filter((ride) => ride.rating !== null);
  const averageRating = ratedRides.length
    ? (
        ratedRides.reduce((total, ride) => total + (ride.rating ?? 0), 0) /
        ratedRides.length
      ).toFixed(1)
    : "—";

  function openPanel(id: ProfileRow["id"]) {
    if (id === "saved") {
      onSaved();
      return;
    }
    setPanel(id);
    setMessage("");
    if (id === "profile") setName(state.name || session?.passenger.name || "");
  }

  function renderRows(rows: ProfileRow[]) {
    return (
      <View style={styles.menuCard}>
        {rows.map((row, index) => (
          <View key={row.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => openPanel(row.id)}
              style={({ pressed }) => [
                styles.menuRow,
                pressed && styles.pressed,
              ]}
            >
              <Icon name={row.icon} size={24} color={c.ink} />
              <Text style={styles.menuLabel}>{row.title}</Text>
              <Icon name="chevron-forward" size={21} color={c.muted} />
            </Pressable>
            {index < rows.length - 1 && <View style={styles.menuDivider} />}
          </View>
        ))}
      </View>
    );
  }

  async function logOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
      setPanel(null);
    } catch {
      setSignOutError(
        "Could not sign out. Check your connection and try again.",
      );
      setSigningOut(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Profile"
        subtitle="Your account, preferences and support."
      />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(displayName)}</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text numberOfLines={2} style={styles.profileName}>
            {displayName}
          </Text>
          {session && (
            <>
              <View style={styles.contactRow}>
                <Icon name="call-outline" size={20} color={c.muted} />
                <Text numberOfLines={1} style={styles.contactText}>
                  {maskedPhone(session.passenger.phone)}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Icon name="mail-outline" size={20} color={c.muted} />
                <Text numberOfLines={1} style={styles.contactText}>
                  {maskedEmail(session.passenger.email)}
                </Text>
              </View>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => openPanel("profile")}
            style={({ pressed }) => [
              styles.editButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <Icon name="car-outline" size={26} color={c.ink} />
          </View>
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>Trips taken</Text>
            <Text style={styles.statValue}>{completedRides.length}</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <Icon name="star-outline" size={27} color={c.ink} />
          </View>
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>Average rating</Text>
            <Text style={styles.statValue}>
              {averageRating}
              {ratedRides.length > 0 && (
                <Text style={styles.ratingStar}> ★</Text>
              )}
            </Text>
          </View>
        </View>
      </View>

      {renderRows(accountRows)}
      {renderRows(supportRows)}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setSignOutError("");
          setPanel("logout");
        }}
        style={({ pressed }) => [
          styles.menuCard,
          styles.logoutRow,
          pressed && styles.pressed,
        ]}
      >
        <Icon name="log-out-outline" size={24} color={c.ink} />
        <Text style={styles.menuLabel}>Log out</Text>
        <Icon name="chevron-forward" size={21} color={c.muted} />
      </Pressable>

      {signOutError !== "" && <Notice error>{signOutError}</Notice>}
      <Text style={styles.version}>
        Vooma Passenger · Version 0.1.0{"\n"}Made for the way you move.
      </Text>

      <Sheet
        visible={panel === "profile"}
        title="Personal details"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          Set a local display name. This does not change your registered account
          details.
        </Text>
        {session && (
          <>
            <Text style={ui.label}>EMAIL ADDRESS</Text>
            <Text style={ui.body}>{session.passenger.email}</Text>
            <Text style={ui.label}>PHONE NUMBER</Text>
            <Text style={ui.body}>{session.passenger.phone}</Text>
          </>
        )}
        <Text style={ui.label}>DISPLAY NAME</Text>
        <TextInput
          accessibilityLabel="Display name"
          placeholder="Your name"
          placeholderTextColor={c.muted}
          style={ui.input}
          value={name}
          onChangeText={setName}
          maxLength={60}
          autoCapitalize="words"
        />
        {message !== "" && <Notice error>{message}</Notice>}
        <Button
          label="Save details"
          onPress={() => {
            if (!name.trim()) {
              setMessage("Enter a display name.");
              return;
            }
            update((previous) => ({ ...previous, name: name.trim() }));
            setPanel(null);
          }}
        />
      </Sheet>

      <Sheet
        visible={panel === "payments"}
        title="Payment methods"
        onClose={() => setPanel(null)}
      >
        <View style={[ui.card, ui.row]}>
          <Icon name="cash-outline" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={ui.h3}>Cash</Text>
            <Text style={ui.body}>Payment options are not available yet</Text>
          </View>
          <Icon name="checkmark-circle" color={c.success} />
        </View>
        <Notice>
          No payment is collected. Card payments, wallet balances, refunds and
          receipts require the payment service and are not available yet.
        </Notice>
      </Sheet>

      <Sheet
        visible={panel === "promotions"}
        title="Promotions"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          Promotions are not available yet. No promo codes or discounts have
          been applied to your rides.
        </Text>
      </Sheet>

      <Sheet
        visible={panel === "notifications"}
        title="Notifications"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          Notification preferences are not available in this version. The app
          does not send push notifications.
        </Text>
      </Sheet>

      <Sheet
        visible={panel === "privacy"}
        title="Privacy policy"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.h3}>Saved on this device</Text>
        <Text style={ui.body}>
          Your display name, favourite places, trip details and ratings are
          stored locally. Trip details include pickup and destination
          coordinates. They are not synced to Vooma’s API.
        </Text>
        <Text style={ui.h3}>Location is your choice</Text>
        <Text style={ui.body}>
          Home uses your live location by default. The pickup dropdown lets you
          choose a fixed address or switch back to live location. Tracking stops
          when you choose a fixed pickup, leave Home or background the app. You
          can revoke permission in device or browser settings. Address searches
          send your typed query and, when available, pickup coordinates to Apple
          Maps on iOS or Google Maps on Android to find matching places.
        </Text>
        <Notice>
          A full Vooma Passenger privacy policy has not yet been published in
          this development build.
        </Notice>
        <Text style={ui.h3}>Starting fresh</Text>
        <Text style={ui.body}>
          Resetting clears the Vooma Passenger local profile and trip history on
          this device. It does not affect your driver or admin apps.
        </Text>
        <Button
          label="Reset local data"
          secondary
          icon="trash-outline"
          onPress={() => setPanel("reset")}
        />
      </Sheet>

      <Sheet
        visible={panel === "help"}
        title="Help & support"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.h3}>Take the passenger seat</Text>
        <Text style={ui.body}>
          Type a place or address in pickup or destination search on Home.
          Select a matching result to show it on the map. Add your favourite
          addresses from Saved, then choose them again from pickup or
          destination search.
        </Text>
        <Text style={ui.h3}>What’s still being connected?</Text>
        <Text style={ui.body}>
          Road routing, driver dispatch, actual fares, contact tools and
          payments. Support messaging is also unavailable in this version.
        </Text>
        <Notice>
          Vooma Go, Comfort and XL are proposed passenger options. The current
          driver API does not yet assign vehicles to these service categories.
        </Notice>
      </Sheet>

      <Sheet
        visible={panel === "reset"}
        title="Start fresh?"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          This removes your local profile, saved places, locally stored rides
          and ratings. This cannot be undone.
        </Text>
        <Button
          label="Delete local data"
          onPress={() => {
            setPanel(null);
            reset();
          }}
        />
        <Button label="Keep my data" secondary onPress={() => setPanel(null)} />
      </Sheet>

      <Sheet
        visible={panel === "logout"}
        title="Log out?"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          You’ll be signed out of your passenger account. Your locally stored
          rides and saved places will remain on this device.
        </Text>
        {signOutError !== "" && <Notice error>{signOutError}</Notice>}
        <Button
          label={signingOut ? "Logging out…" : "Log out"}
          disabled={signingOut}
          onPress={() => void logOut()}
        />
        <Button
          label="Stay signed in"
          secondary
          disabled={signingOut}
          onPress={() => setPanel(null)}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 22,
  },
  profileCard: {
    ...d.menuCard,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: c.profile,
    padding: 22,
    borderRadius: 18,
  },
  avatar: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.white,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 25,
    fontWeight: "600",
    color: c.ink,
  },
  profileDetails: { flex: 1, minWidth: 0, gap: 9 },
  profileName: {
    color: c.ink,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  contactText: { flex: 1, color: c.muted, fontSize: 14 },
  editButton: {
    alignSelf: "flex-start",
    minWidth: 132,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: c.action,
    borderRadius: 24,
    minHeight: 44,
  },
  editButtonText: {
    fontWeight: "700",
    color: c.white,
    fontSize: 14,
  },
  statsCard: {
    ...d.menuCard,
    minHeight: 106,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 55,
    height: 58,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5F2FF",
    borderRadius: 14,
  },
  statCopy: { flex: 1, minWidth: 0, gap: 2 },
  statLabel: { color: c.muted, fontSize: 13 },
  statValue: {
    color: c.ink,
    fontWeight: "800",
    fontSize: 22,
  },
  ratingStar: { color: c.ink, fontSize: 17 },
  statDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 12,
    backgroundColor: c.line,
  },
  menuCard: {
    ...d.menuCard,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    minHeight: 52,
    paddingVertical: 12,
  },
  menuLabel: {
    flex: 1,
    color: c.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#DCE6F2",
  },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  pressed: { opacity: 0.72 },
  version: {
    color: c.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
