import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Icon, Notice } from "../ui/components";
import { SignUpScreen } from "./SignUpScreen";
import { SignInScreen } from "./SignInScreen";

export function WelcomeScreen({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700 || width < 360 || fontScale > 1.3;
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [arrival] = useState(() => new Animated.Value(0));
  const [actions] = useState(() => new Animated.Value(0));
  const [interactive, setInteractive] = useState(false);
  const [account, setAccount] = useState<"Sign In" | "Sign Up" | null>(null);

  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      if (active) setReduced(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => update(true));
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      update,
    );
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      arrival.setValue(1);
      actions.setValue(1);
      setInteractive(true);
      return;
    }
    const timing = (value: Animated.Value, duration: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const animation = Animated.parallel([
      timing(arrival, 1000),
      Animated.sequence([Animated.delay(850), timing(actions, 500)]),
    ]);
    let active = true;
    animation.start(({ finished }) => {
      if (active && finished) setInteractive(true);
    });
    return () => {
      active = false;
      animation.stop();
    };
  }, [reduced, arrival, actions]);

  if (account === "Sign Up") {
    return (
      <SignUpScreen
        onBack={() => setAccount(null)}
        onSignIn={() => setAccount("Sign In")}
      />
    );
  }
  if (account === "Sign In") {
    return (
      <SignInScreen
        onBack={() => setAccount(null)}
        reducedMotion={reduced !== false}
      />
    );
  }

  return (
    <View style={s.root} testID="passenger-welcome">
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.Image
          source={require("../../assets/onboarding/entry-city.png")}
          resizeMode="cover"
          style={[
            s.background,
            {
              transform: [
                { scale: 1.06 },
                {
                  translateX: arrival.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            s.car,
            {
              top: height * 0.6,
              left: Math.max(0, (width - 520) / 2),
              width: Math.min(width * 0.94, 470),
              height: Math.min(width * 0.4, 200),
              transform: [
                {
                  translateX: arrival.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, -width * 0.08],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require("../../assets/onboarding/entry-car.png")}
            resizeMode="contain"
            style={s.carImage}
          />
        </Animated.View>
      </View>
      <SafeAreaView style={s.flex}>
        <ScrollView
          contentContainerStyle={[
            s.content,
            { minHeight: Math.max(height - insets.top - insets.bottom, 620) },
          ]}
        >
          <View style={s.topBar} />
          <Animated.View
            style={[
              s.heading,
              {
                paddingTop: compact ? 16 : height * 0.07,
                opacity: arrival,
                transform: [
                  {
                    translateY: arrival.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[
                s.title,
                { fontSize: compact ? 42 : 52, lineHeight: compact ? 45 : 54 },
              ]}
            >
              HELLO
            </Text>
            <View style={s.orangeLine} />
            <Text style={s.subtitle}>Your ride starts here</Text>
          </Animated.View>
          <View style={{ flex: 1, minHeight: 260 }} />
          <Animated.View
            pointerEvents={interactive ? "auto" : "none"}
            accessibilityElementsHidden={!interactive}
            importantForAccessibility={
              interactive ? "auto" : "no-hide-descendants"
            }
            style={[
              s.actions,
              {
                opacity: actions,
                transform: [
                  {
                    translateY: actions.interpolate({
                      inputRange: [0, 1],
                      outputRange: [32, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {(["Sign In", "Sign Up"] as const).map((label, index) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                disabled={!interactive}
                onPress={() => setAccount(label)}
                style={({ pressed }) => [
                  s.button,
                  index === 1 && s.lightButton,
                  pressed && { opacity: 0.78 },
                ]}
              >
                <Text
                  style={[s.buttonText, index === 1 && { color: "#203147" }]}
                >
                  {label}
                </Text>
                <View style={s.arrow}>
                  <Icon name="arrow-forward" color="#FF7A00" size={28} />
                </View>
              </Pressable>
            ))}
            {error !== "" && (
              <>
                <Notice error>{error}</Notice>
                <Button label="Retry saving" secondary onPress={onRetry} />
              </>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#D5EDFD", overflow: "hidden" },
  flex: { flex: 1 },
  background: { position: "absolute", width: "100%", height: "100%" },
  car: { position: "absolute", left: 0 },
  carImage: { width: "100%", height: "100%" },
  content: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
  topBar: { height: 48 },
  heading: { paddingHorizontal: 36 },
  title: { color: "#101D2E", fontWeight: "800", letterSpacing: -1.5 },
  orangeLine: {
    width: 48,
    height: 6,
    backgroundColor: "#FF7A00",
    marginTop: 14,
    marginBottom: 12,
  },
  subtitle: { color: "#283D53", fontSize: 20, lineHeight: 28 },
  actions: { gap: 14, padding: 24, paddingBottom: 32 },
  button: {
    minHeight: 62,
    borderRadius: 34,
    backgroundColor: "#203147",
    paddingVertical: 15,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  lightButton: { backgroundColor: "#FFFFFF" },
  buttonText: {
    fontSize: 20,
    lineHeight: 28,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  arrow: { position: "absolute", right: 22 },
});
