import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { usePassenger } from "../state/PassengerProvider";
import {
  Button,
  c,
  Icon,
  Notice,
  Sheet,
  ui,
  type IconName,
} from "../ui/components";

type Panel = "profile" | "payments" | "privacy" | "help" | "reset" | null;
export function ProfileScreen() {
  const { state, update, reset } = usePassenger();
  const [panel, setPanel] = useState<Panel>(null);
  const [name, setName] = useState(state.name);
  const [message, setMessage] = useState("");
  const rows: {
    id: Exclude<Panel, null | "reset">;
    icon: IconName;
    title: string;
    subtitle: string;
  }[] = [
    {
      id: "profile",
      icon: "person-outline",
      title: "Your details",
      subtitle: "Make this demo your own",
    },
    {
      id: "payments",
      icon: "wallet-outline",
      title: "Payment method",
      subtitle: "Cash · demo only",
    },
    {
      id: "privacy",
      icon: "lock-closed-outline",
      title: "Privacy & local data",
      subtitle: "You’re in control",
    },
    {
      id: "help",
      icon: "chatbubble-ellipses-outline",
      title: "Help & about",
      subtitle: "Get to know Vooma Passenger",
    },
  ];
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={ui.label}>YOUR LITTLE CORNER OF VOOMA</Text>
        <Text accessibilityRole="header" style={ui.h1}>
          Your profile
        </Text>
        <Text style={ui.body}>The details that make the journey yours.</Text>
      </View>
      <View style={[ui.card, { backgroundColor: c.sky, borderWidth: 0 }]}>
        <View style={ui.row}>
          <View style={[ui.emptyIcon, { backgroundColor: c.white }]}>
            <Text style={{ color: c.navy, fontSize: 30, fontWeight: "700" }}>
              {state.name ? state.name[0].toUpperCase() : "V"}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={ui.h2}>{state.name || "Vooma explorer"}</Text>
            <Text style={ui.body}>Passenger demo profile</Text>
          </View>
          <Icon name="sparkles-outline" size={26} />
        </View>
      </View>
      <View style={ui.card}>
        {rows.map((row, index) => (
          <View key={row.id} style={{ gap: 16 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPanel(row.id);
                setMessage("");
                setName(state.name);
              }}
              style={[ui.row, { minHeight: 58 }]}
            >
              <View style={ui.iconButton}>
                <Icon name={row.icon} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.h3}>{row.title}</Text>
                <Text style={ui.small}>{row.subtitle}</Text>
              </View>
              <Icon name="chevron-forward" size={18} />
            </Pressable>
            {index < rows.length - 1 && <View style={ui.divider} />}
          </View>
        ))}
      </View>
      <Notice>
        This is a local demo profile, not a registered passenger account.
        Sign-in will be available after passenger authentication is added to
        Vooma’s API.
      </Notice>
      <Text style={[ui.small, { textAlign: "center" }]}>
        Vooma Passenger · Version 0.1.0{"\n"}Made for the way you move.
      </Text>
      <Sheet
        visible={panel === "profile"}
        title="Your details"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.body}>
          What should we call you? Use a sample name while exploring.
        </Text>
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
        title="Payment method"
        onClose={() => setPanel(null)}
      >
        <View style={[ui.card, ui.row]}>
          <Icon name="cash-outline" size={30} />
          <View style={{ flex: 1 }}>
            <Text style={ui.h3}>Cash</Text>
            <Text style={ui.body}>Selected for demo rides</Text>
          </View>
          <Icon name="checkmark-circle" color={c.success} />
        </View>
        <Notice>
          No payment is collected or due for demo rides. Card payments, wallet
          balances, refunds and receipts require the payment service and are not
          available yet.
        </Notice>
      </Sheet>
      <Sheet
        visible={panel === "privacy"}
        title="Privacy & local data"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.h3}>Saved on this device</Text>
        <Text style={ui.body}>
          Your demo name, favourite places, trip details and ratings are stored
          locally. Trip details include pickup and destination coordinates. They
          are not synced to Vooma’s API.
        </Text>
        <Text style={ui.h3}>Location is your choice</Text>
        <Text style={ui.body}>
          Location is requested only when you tap “Use my current location”.
          There is no background tracking. You can revoke permission in device
          or browser settings.
        </Text>
        <Text style={ui.h3}>Starting fresh</Text>
        <Text style={ui.body}>
          Resetting clears the Vooma Passenger demo profile and trip history on
          this device. It does not affect your driver or admin apps.
        </Text>
        <Button
          label="Reset local demo data"
          secondary
          icon="trash-outline"
          onPress={() => setPanel("reset")}
        />
      </Sheet>
      <Sheet
        visible={panel === "help"}
        title="Meet Vooma Passenger"
        onClose={() => setPanel(null)}
      >
        <Text style={ui.h3}>Take the passenger seat</Text>
        <Text style={ui.body}>
          Choose a pickup and destination on Home, select a ride and request a
          demo. Use the simulation buttons to follow it from matching to
          arrival. Your history and ratings are saved under Rides.
        </Text>
        <Text style={ui.h3}>What’s still being connected?</Text>
        <Text style={ui.body}>
          Passenger accounts, live address search, road routing, driver
          dispatch, actual fares, contact tools and payments. Support messaging
          is also unavailable in this version.
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
          This removes your local demo profile, saved places, all demo rides and
          ratings. This cannot be undone.
        </Text>
        <Button
          label="Delete local demo data"
          onPress={() => {
            setPanel(null);
            reset();
          }}
        />
        <Button label="Keep my data" secondary onPress={() => setPanel(null)} />
      </Sheet>
    </View>
  );
}
