import { useEffect, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { EntryLogo } from "../brand/EntryLogo";
import { usePassenger } from "../state/PassengerProvider";

export function LaunchSplash({ children }: { children: ReactNode }) {
  const { ready, error } = usePassenger();
  const [finished, setFinished] = useState(false);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [splash] = useState(() => new Animated.Value(1));
  const [logoReveal] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.9));
  const canContinue = ready || !!error;

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
    if (finished || reduced === null) return;
    if (reduced) {
      logoReveal.setValue(1);
      logoScale.setValue(1);
      if (canContinue) setFinished(true);
      return;
    }
    if (!canContinue) return;
    // Match the driver's logo reveal, pulse, three-second hold and fade.
    const timing = (value: Animated.Value, duration: number, toValue = 1) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.delay(3000),
        Animated.sequence([
          Animated.parallel([timing(logoReveal, 700), timing(logoScale, 700)]),
          timing(logoScale, 650, 1.035),
          timing(logoScale, 650),
        ]),
      ]),
      timing(splash, 450, 0),
    ]);
    let active = true;
    animation.start(({ finished: completed }) => {
      if (active && completed) setFinished(true);
    });
    return () => {
      active = false;
      animation.stop();
    };
  }, [canContinue, reduced, finished, splash, logoReveal, logoScale]);

  return (
    <View style={styles.root}>
      {finished && children}
      {!finished && (
        <Animated.View
          testID="launch-splash"
          accessibilityViewIsModal
          style={[StyleSheet.absoluteFill, styles.splash, { opacity: splash }]}
        >
          <StatusBar style="dark" />
          <Animated.View
            style={[
              styles.logo,
              {
                opacity: logoReveal,
                transform: [
                  { scale: logoScale },
                  {
                    translateY: logoReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <EntryLogo size={114} wordmark />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  splash: { backgroundColor: "#FFFFFF", zIndex: 10 },
  logo: { position: "absolute", bottom: "12%", alignSelf: "center" },
});
