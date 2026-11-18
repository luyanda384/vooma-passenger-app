import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "./src/brand/Logo";
import { HomeScreen } from "./src/features/HomeScreen";
import { ActivityScreen } from "./src/features/ActivityScreen";
import { SavedScreen } from "./src/features/SavedScreen";
import { ProfileScreen } from "./src/features/ProfileScreen";
import { RideDetail } from "./src/features/RideDetail";
import { LaunchSplash } from "./src/features/LaunchSplash";
import { WelcomeScreen } from "./src/features/WelcomeScreen";
import { CompleteProfileScreen } from "./src/features/CompleteProfileScreen";
import { PassengerProvider, usePassenger } from "./src/state/PassengerProvider";
import { STORAGE_KEY } from "./src/state/PassengerProvider";
import { AuthProvider, useAuth } from "./src/state/AuthProvider";
import {
  Button,
  c,
  Icon,
  Notice,
  Sheet,
  ui,
  type IconName,
} from "./src/ui/components";

type Tab = "home" | "rides" | "saved" | "profile";
const tabs: { id: Tab; label: string; icon: IconName; activeIcon: IconName }[] =
  [
    { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
    {
      id: "rides",
      label: "Rides",
      icon: "receipt-outline",
      activeIcon: "receipt",
    },
    { id: "saved", label: "Saved", icon: "heart-outline", activeIcon: "heart" },
    {
      id: "profile",
      label: "Profile",
      icon: "person-outline",
      activeIcon: "person",
    },
  ];
function PassengerApp() {
  const { ready, error, retry, reset } = usePassenger();
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [rideId, setRideId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const wide = useWindowDimensions().width >= 850;
  if (!ready)
    return (
      <SafeAreaView style={styles.loading}>
        <Logo size={180} />
        {error ? (
          <>
            <Notice error>{error}</Notice>
            <Button label="Retry loading" onPress={retry} />
            <Button
              label="Reset local demo data"
              secondary
              onPress={() => setConfirmReset(true)}
            />
            <Sheet
              visible={confirmReset}
              title="Reset saved demo?"
              onClose={() => setConfirmReset(false)}
            >
              <Text style={ui.body}>
                This deletes the saved passenger demo on this device, including
                any trip history.
              </Text>
              <Button
                label="Delete and start again"
                onPress={() => {
                  setConfirmReset(false);
                  reset();
                }}
              />
              <Button
                label="Keep data"
                secondary
                onPress={() => setConfirmReset(false)}
              />
            </Sheet>
          </>
        ) : (
          <ActivityIndicator size="large" color={c.navy} />
        )}
      </SafeAreaView>
    );
  if (!session)
    return (
      <WelcomeScreen
        error={error}
        onRetry={retry}
      />
    );
  const navigation = (
    <View
      accessibilityRole="tablist"
      style={[styles.tabs, wide && styles.desktopTabs]}
    >
      {tabs.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.id === tab }}
          onPress={() => setTab(item.id)}
          style={[
            styles.tab,
            wide && styles.desktopTab,
            tab === item.id && styles.selectedTab,
          ]}
        >
          <Icon
            name={tab === item.id ? item.activeIcon : item.icon}
            color={tab === item.id ? c.navy : c.muted}
            size={21}
          />
          <Text
            style={[
              styles.tabText,
              tab === item.id && { color: c.navy, fontWeight: "700" },
            ]}
          >
            {item.label}
          </Text>
          {tab === item.id && !wide && <View style={styles.tabDot} />}
        </Pressable>
      ))}
    </View>
  );
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {(tab !== "home" || wide) && (
        <View style={styles.header}>
          <View style={[styles.headerContent, wide && { paddingHorizontal: 30 }]}>
            <View style={{ gap: 5 }}>
              <Logo size={130} />
              <Text style={styles.passenger}>PASSENGER</Text>
            </View>
            {wide && navigation}
            <View style={styles.demoPill}>
              <View style={styles.orangeDot} />
              <Text style={styles.demoText}>DEMO MODE</Text>
            </View>
          </View>
        </View>
      )}
      <ScrollView
        key={tab}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, wide && { padding: 30 }]}
      >
        {error !== "" && (
          <View style={{ gap: 10 }}>
            <Notice error>{error}</Notice>
            <Button label="Retry saving" secondary onPress={retry} />
          </View>
        )}
        {tab === "home" && (
          <HomeScreen onRide={setRideId} />
        )}
        {tab === "rides" && (
          <ActivityScreen onRide={setRideId} onBook={() => setTab("home")} />
        )}
        {tab === "saved" && <SavedScreen />}
        {tab === "profile" && <ProfileScreen />}
      </ScrollView>
      {!wide && <View style={styles.bottomNav}>{navigation}</View>}
      {rideId && <RideDetail id={rideId} onClose={() => setRideId(null)} />}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider><AccountApp /></AuthProvider>
    </SafeAreaProvider>
  );
}
function AccountApp() {
  const { session, ready, startupError, retry, signOut, pending } = useAuth();
  if (!ready) return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={c.navy} /></SafeAreaView>;
  if (startupError) return <SafeAreaView style={styles.loading}>
    <Notice error>{startupError}</Notice><Button label="Retry sign-in" onPress={retry} />
    <Button label="Return to welcome" secondary onPress={() => void signOut().catch(() => {})} />
  </SafeAreaView>;
  if (pending) return <CompleteProfileScreen />;
  return <PassengerProvider key={session?.passenger.id ?? "guest"} storageKey={session ? `${STORAGE_KEY}.${session.passenger.id}` : STORAGE_KEY}>
    {session ? <PassengerApp /> : <LaunchSplash><PassengerApp /></LaunchSplash>}
  </PassengerProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.tint },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 25,
    backgroundColor: c.tint,
  },
  header: {
    backgroundColor: c.white,
    borderBottomColor: c.line,
    borderBottomWidth: 1,
  },
  headerContent: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    minHeight: 91,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  passenger: {
    color: c.muted,
    fontSize: 8,
    letterSpacing: 3,
    marginLeft: 41,
    fontWeight: "600",
  },
  demoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  demoText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#804600",
    letterSpacing: 1,
  },
  orangeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.orange,
  },
  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 30,
    gap: 20,
  },
  bottomNav: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: c.tint,
  },
  tabs: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: c.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.line,
    padding: 6,
  },
  desktopTabs: { borderWidth: 0, gap: 9, padding: 0 },
  tab: {
    flex: 1,
    minHeight: 57,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    gap: 4,
    paddingVertical: 8,
  },
  desktopTab: {
    flex: 0,
    minWidth: 105,
    flexDirection: "row",
    paddingHorizontal: 20,
    minHeight: 44,
    gap: 8,
  },
  selectedTab: { backgroundColor: c.sky },
  tabText: { fontSize: 11, color: c.muted },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.orange,
    position: "absolute",
    bottom: 3,
  },
});
