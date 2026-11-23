import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { passengerApi, type Challenge } from "../api/passenger";
import { useAuthRequest } from "../api/useAuthRequest";
import { useAuth } from "../state/AuthProvider";
import { Icon, Notice } from "../ui/components";
import { AccountBackground } from "../ui/AccountBackground";
import { dashboardColors as c } from "../ui/theme";

export function VerifyEmailScreen({
  initial,
  email,
  onBack,
  onSignIn,
}: {
  initial: Challenge;
  email: string;
  onBack: () => void;
  onSignIn: () => void;
}) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [invalid, setInvalid] = useState(false);
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const request = useAuthRequest();
  const { accept } = useAuth();
  const { width, height } = useWindowDimensions();
  const compact = height < 700 || width < 360;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => listener.remove();
  }, [onBack]);

  const wait = Math.max(0, Math.ceil((challenge.resendAt - now) / 1000));
  const countdown = `${Math.floor(wait / 60)
    .toString()
    .padStart(2, "0")}:${(wait % 60).toString().padStart(2, "0")}`;
  const expired = now >= challenge.expiresAt;
  const resendDisabled = request.busy || wait > 0 || expired;

  function verify() {
    if (request.busy || Date.now() >= challenge.expiresAt) return;
    if (!/^\d{6}$/.test(code)) {
      setInvalid(true);
      input.current?.focus();
      return;
    }
    void request.run(
      (signal) => passengerApi.verify(challenge.challengeId, code, signal),
      accept,
    );
  }

  function resend() {
    if (
      request.busy ||
      Date.now() < challenge.resendAt ||
      Date.now() >= challenge.expiresAt
    )
      return;
    void request.run(
      (signal) => passengerApi.resend(challenge.challengeId, signal),
      (next) => {
        setChallenge(next);
        setCode("");
        setInvalid(false);
        setNow(Date.now());
        input.current?.focus();
      },
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <AccountBackground />
      <SafeAreaView style={s.flex}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              s.content,
              compact && { paddingHorizontal: 20 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Create Account"
              onPress={onBack}
              style={s.back}
            >
              <Icon name="arrow-back" size={28} color={c.ink} />
            </Pressable>
            <View style={[s.heading, compact && { marginTop: 18 }]}>
              <Text
                accessibilityRole="header"
                style={[s.title, compact && { fontSize: 28, lineHeight: 35 }]}
              >
                Verify your account
              </Text>
              <Text style={s.subtitle}>
                Enter the 6-digit code sent to your email.
              </Text>
              <Text style={s.email}>{email}</Text>
            </View>

            <View style={[s.codeEntry, compact && { marginTop: 26 }]}>
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={s.codeRow}
              >
                {Array.from({ length: 6 }, (_, index) => {
                  const active =
                    !expired &&
                    !request.busy &&
                    (focused || code.length === 0) &&
                    index === Math.min(code.length, 5);
                  return (
                    <View
                      key={index}
                      style={[
                        s.codeBox,
                        active && s.activeBox,
                        invalid && s.invalidBox,
                      ]}
                    >
                      <Text style={s.digit} maxFontSizeMultiplier={1.5}>
                        {code[index] ?? ""}
                      </Text>
                      {active && !code[index] && <View style={s.cursor} />}
                    </View>
                  );
                })}
              </View>
              {/* One native field preserves full-code paste, backspace and OTP autofill. */}
              <TextInput
                ref={input}
                accessibilityLabel="Verification code"
                accessibilityHint="Enter the six-digit code from your email"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                autoCorrect={false}
                caretHidden
                selection={{ start: code.length, end: code.length }}
                value={code}
                editable={!request.busy && !expired}
                onChangeText={(value) => {
                  setCode(value.replace(/\D/g, "").slice(0, 6));
                  setInvalid(false);
                  request.clearError();
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={verify}
                style={s.nativeInput}
              />
            </View>

            <View style={s.feedback}>
              {invalid && (
                <Notice error>Enter the six-digit code from your email.</Notice>
              )}
              {request.error !== "" && <Notice error>{request.error}</Notice>}
              {expired && (
                <Notice error>
                  This code has expired. Go back to Create Account to request a
                  new one.
                </Notice>
              )}
            </View>

            <View style={s.resendRow}>
              <Text style={s.resendPrompt}>Didn’t receive it?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: resendDisabled }}
                disabled={resendDisabled}
                onPress={resend}
                style={s.textButton}
              >
                <Text style={[s.link, resendDisabled && { opacity: 0.55 }]}>
                  Resend code
                </Text>
              </Pressable>
            </View>
            {!expired && (
              <View style={s.timerRow}>
                <Icon name="time-outline" size={20} color={c.muted} />
                <Text style={s.timerText}>
                  {wait > 0 ? (
                    <>
                      You can request a new code in{" "}
                      <Text style={s.timerValue}>{countdown}</Text>
                    </>
                  ) : (
                    "You can request a new code now"
                  )}
                </Text>
              </View>
            )}

            <View style={s.footer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify & Continue"
                accessibilityState={{
                  disabled: request.busy || expired,
                  busy: request.busy,
                }}
                disabled={request.busy || expired}
                onPress={verify}
                style={({ pressed }) => [
                  s.verifyButton,
                  (request.busy || expired) && { opacity: 0.55 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                {request.busy && <ActivityIndicator color="#FFFFFF" />}
                <Text style={s.verifyLabel}>
                  {request.busy ? "Please wait…" : "Verify & Continue"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={s.changeEmail}
              >
                <Text style={s.link}>Use a different email</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={onSignIn}
                style={s.textButton}
              >
                <Text style={s.signIn}>
                  Already have an account?{" "}
                  <Text style={s.signInLink}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDF5FF" },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { marginTop: 28, gap: 12 },
  title: {
    color: c.ink,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subtitle: { color: "#4C5D7B", fontSize: 18, lineHeight: 27 },
  email: { color: c.muted, fontSize: 14, lineHeight: 21 },
  codeEntry: { marginTop: 36 },
  codeRow: { flexDirection: "row", gap: 8 },
  codeBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D3E3FB",
    backgroundColor: "#FAFCFF",
    shadowColor: "#7B9EC9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  activeBox: { borderColor: "#0962FF", borderWidth: 1.5 },
  invalidBox: { borderColor: c.error },
  digit: { fontSize: 26, lineHeight: 34, fontWeight: "600", color: c.ink },
  cursor: {
    position: "absolute",
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: "#0962FF",
  },
  nativeInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: "transparent",
    backgroundColor: "transparent",
    fontSize: 24,
  },
  feedback: { gap: 10, marginTop: 12 },
  resendRow: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 7,
  },
  resendPrompt: { color: "#4C5D7B", fontSize: 16, lineHeight: 24 },
  textButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  link: {
    color: "#0962FF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  timerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timerText: { color: "#586B8D", fontSize: 14, lineHeight: 22, flexShrink: 1 },
  timerValue: { fontWeight: "700" },
  footer: { marginTop: "auto", paddingTop: 48, gap: 8, paddingBottom: 4 },
  verifyButton: {
    minHeight: 58,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: c.action,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  verifyLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  changeEmail: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  signIn: { color: c.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  signInLink: { color: c.link, fontWeight: "600" },
});
