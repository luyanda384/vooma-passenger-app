import { useEffect, useState } from "react";
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { passengerApi, type Challenge } from "../api/passenger";
import { useAuthRequest } from "../api/useAuthRequest";
import { useAuth } from "../state/AuthProvider";
import { Button, Notice, ui } from "../ui/components";

export function VerifyEmailScreen({ initial, email, onBack, onSignIn }: { initial: Challenge; email: string; onBack: () => void; onSignIn: () => void }) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [invalid, setInvalid] = useState(false);
  const request = useAuthRequest();
  const { accept } = useAuth();
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => { onBack(); return true; });
    return () => listener.remove();
  }, [onBack]);
  const wait = Math.max(0, Math.ceil((challenge.resendAt - now) / 1000));
  const expired = now >= challenge.expiresAt;
  function verify() {
    if (!/^\d{6}$/.test(code)) { setInvalid(true); return; }
    void request.run(signal => passengerApi.verify(challenge.challengeId, code, signal), accept);
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#EFF6FF" }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 26, gap: 20, width: "100%", maxWidth: 500, alignSelf: "center" }}>
        <Button label="Back to Create Account" secondary onPress={onBack} />
        <Text accessibilityRole="header" style={ui.h1}>Verify your email</Text>
        <Text style={ui.body}>If {email} can be registered, a six-digit code will arrive shortly. Already have an account? Sign in below.</Text>
        <TextInput accessibilityLabel="Verification code" placeholder="6-digit code" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} value={code} onChangeText={value => { setCode(value.replace(/\D/g, "")); setInvalid(false); request.clearError(); }} onSubmitEditing={verify} style={ui.input} />
        {invalid && <Notice error>Enter the six-digit code from your email.</Notice>}
        {request.error !== "" && <Notice error>{request.error}</Notice>}
        {expired && <Notice error>This code has expired. Go back to Create Account to request a new one.</Notice>}
        <Button label={request.busy ? "Please wait…" : "Verify email"} disabled={request.busy || expired} onPress={verify} />
        <Button label={wait ? `Resend code in ${wait}s` : "Resend code"} secondary disabled={request.busy || wait > 0 || expired} onPress={() => {
          void request.run(signal => passengerApi.resend(challenge.challengeId, signal), next => { setChallenge(next); setCode(""); setNow(Date.now()); });
        }} />
        <Button label="Sign in" secondary onPress={onSignIn} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
