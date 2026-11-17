import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LineIcon } from "../ui/LineIcon";
import { Button, Sheet, ui } from "../ui/components";
import { passengerApi } from "../api/passenger";
import { useAuthRequest } from "../api/useAuthRequest";
import { useAuth } from "../state/AuthProvider";

export function SignInScreen({
  onBack,
  reducedMotion,
}: {
  onBack: () => void;
  reducedMotion: boolean;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700 || width < 360 || fontScale > 1.3;
  const [panel] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const { accept } = useAuth();
  const request = useAuthRequest();
  const [recovery, setRecovery] = useState(false);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    const animation = Animated.timing(panel, {
      toValue: 1,
      duration: reducedMotion ? 0 : 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [panel, reducedMotion]);
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => listener.remove();
  }, [onBack]);
  function submit() {
    setAttempted(true);
    if (!validEmail || !password.trim()) {
      request.clearError();
      return;
    }
    setAttempted(false);
    setVisible(false);
    void request.run(signal => passengerApi.login(email.trim(), password, signal), session => {
      setPassword("");
      accept(session);
    });
  }

  return (
    <View style={s.root} testID="passenger-signin">
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
                  translateY: panel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -height * 0.12],
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
                { translateX: -width * 0.08 },
                {
                  translateY: panel.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -height * 0.14],
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
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={s.flex}>
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              s.content,
              { minHeight: Math.max(height - insets.top - insets.bottom, 580) },
            ]}
            onContentSizeChange={() => {
              if (request.error) scroll.current?.scrollToEnd({ animated: true });
            }}
          >
            <View style={s.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to welcome"
                onPress={onBack}
                style={s.back}
              >
                <LineIcon name="arrow-left" color="#203147" />
              </Pressable>
            </View>
            <View
              style={[s.heading, { paddingTop: compact ? 16 : height * 0.035 }]}
            >
              <Text
                accessibilityRole="header"
                style={[
                  s.title,
                  {
                    fontSize: compact ? 42 : 52,
                    lineHeight: compact ? 45 : 54,
                  },
                ]}
              >
                {"Welcome\nback"}
              </Text>
              <View style={s.orangeLine} />
              <Text style={s.subtitle}>Sign in to continue</Text>
            </View>
            <View style={{ flex: 1, minHeight: 150 }} />
            <Animated.View
              style={[
                s.form,
                {
                  paddingBottom: Math.max(24, insets.bottom + 12),
                  opacity: panel,
                  transform: [
                    {
                      translateY: panel.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={s.field}>
                <LineIcon name="mail" color="#203147" />
                <TextInput
                  accessibilityLabel="Email address"
                  placeholder="Email address"
                  placeholderTextColor="#687A94"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    request.clearError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  maxLength={254}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                  style={s.input}
                />
              </View>
              {attempted && !validEmail && (
                <Text accessibilityRole="alert" style={s.error}>
                  Enter a valid email address.
                </Text>
              )}
              <View style={s.field}>
                <LineIcon name="lock" color="#203147" />
                <TextInput
                  ref={passwordInput}
                  accessibilityLabel="Password"
                  placeholder="Password"
                  placeholderTextColor="#687A94"
                  value={password}
                  maxLength={128}
                  onChangeText={(value) => {
                    setPassword(value);
                    request.clearError();
                  }}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  style={s.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    visible ? "Hide password" : "Show password"
                  }
                  onPress={() => setVisible((value) => !value)}
                  style={s.eye}
                >
                  <LineIcon
                    name={visible ? "eye" : "eye-off"}
                    color="#687A94"
                  />
                </Pressable>
              </View>
              {attempted && !password.trim() && (
                <Text accessibilityRole="alert" style={s.error}>
                  Enter your password.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue"
                disabled={request.busy}
                accessibilityState={{ disabled: request.busy, busy: request.busy }}
                onPress={submit}
                style={({ pressed }) => [
                  s.button,
                  pressed && { opacity: 0.78 },
                ]}
              >
                <Text style={s.buttonText}>{request.busy ? "Signing in…" : "Continue"}</Text>
                <View style={s.arrow}>
                  <LineIcon name="arrow-right" size={28} color="#FF7A00" />
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={() => {
                  setPassword("");
                  setVisible(false);
                  setAttempted(false);
                  setRecovery(true);
                }}
                style={s.link}
              >
                <Text style={s.linkText}>Forgot password</Text>
              </Pressable>
              {request.error !== "" && (
                <View style={s.boundary}>
                  <Text accessibilityRole="alert" style={s.boundaryText}>
                    {request.error}
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <Sheet
        visible={recovery}
        title="Forgot password"
        onClose={() => setRecovery(false)}
      >
        <Text style={ui.body}>
          Password reset for passenger accounts is not available yet. No reset
          email has been sent.
        </Text>
        <Button label="Back to Sign In" onPress={() => setRecovery(false)} />
      </Sheet>
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
  back: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
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
  form: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: "#FCFDFF",
    padding: 24,
    paddingBottom: 32,
    gap: 14,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#DCE5F1",
    borderRadius: 30,
    backgroundColor: "#F0F5FA",
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    color: "#203147",
    paddingVertical: 16,
    outlineWidth: 0,
  },
  eye: {
    minWidth: 44,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    minHeight: 62,
    borderRadius: 34,
    backgroundColor: "#203147",
    paddingVertical: 15,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 20,
    lineHeight: 28,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  arrow: { position: "absolute", right: 22 },
  link: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: "#203147",
    fontSize: 16,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  error: { color: "#B32736", fontSize: 14, paddingHorizontal: 12 },
  boundary: { padding: 14, backgroundColor: "#EDF4FB", borderRadius: 14 },
  boundaryText: { color: "#465A73", fontSize: 14, lineHeight: 21 },
});
