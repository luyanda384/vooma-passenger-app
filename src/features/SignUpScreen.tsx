import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
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
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { passengerApi, type Challenge } from "../api/passenger";
import { useAuthRequest } from "../api/useAuthRequest";
import { VerifyEmailScreen } from "./VerifyEmailScreen";
import { useAuth } from "../state/AuthProvider";
import Svg, { Path } from "react-native-svg";
import { AccountBackground } from "../ui/AccountBackground";
import {
  Button,
  Icon,
  Notice,
  Sheet,
  ui,
  type IconName,
} from "../ui/components";

type Form = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
};
type FieldName = keyof Form;
const emptyForm: Form = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
};
const ink = "#0B2346";
const muted = "#667D9F";

function GoogleMark() {
  return (
    <Svg width={26} height={26} viewBox="0 0 48 48" accessible={false}>
      <Path
        fill="#4285F4"
        d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.43h11a9.4 9.4 0 0 1-4.08 6.16v5.12h6.61c3.87-3.57 6.08-8.83 6.08-14.79Z"
      />
      <Path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.82 13.53-4.95l-6.61-5.12c-1.83 1.23-4.17 1.97-6.92 1.97-5.3 0-9.79-3.58-11.4-8.4H5.77v5.29A20.43 20.43 0 0 0 24 44Z"
      />
      <Path
        fill="#FBBC05"
        d="M12.6 27.5a12.27 12.27 0 0 1 0-7V15.2H5.77a20.4 20.4 0 0 0 0 17.6l6.83-5.3Z"
      />
      <Path
        fill="#EA4335"
        d="M24 12.1c3 0 5.68 1.03 7.8 3.04l5.85-5.85A19.6 19.6 0 0 0 24 4a20.43 20.43 0 0 0-18.23 11.2l6.83 5.3c1.61-4.82 6.1-8.4 11.4-8.4Z"
      />
    </Svg>
  );
}

export function SignUpScreen({
  onBack,
  onSignIn,
}: {
  onBack: () => void;
  onSignIn: () => void;
}) {
  const { width } = useWindowDimensions();
  const [form, setForm] = useState<Form>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const request = useAuthRequest();
  const { google } = useAuth();
  const [policy, setPolicy] = useState<
    "Terms & Conditions" | "Privacy Policy" | null
  >(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const fields = useRef<
    Partial<Record<FieldName, ComponentRef<typeof TextInput> | null>>
  >({});

  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => listener.remove();
  }, [onBack]);

  function change(key: FieldName, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setMessage("");
    request.clearError();
  }
  function submit() {
    const next: Partial<Record<FieldName, string>> = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Enter a valid email address.";
    const phone = form.phone.replace(/[\s()-]/g, "");
    if (!/^(?:0\d{9}|\+[1-9]\d{7,14})$/.test(phone))
      next.phone =
        "Enter a phone number, e.g. 082 123 4567 or +27 82 123 4567.";
    if (
      form.password.length < 12 ||
      form.password.length > 128 ||
      !form.password.trim()
    )
      next.password = "Use a password with 12–128 characters.";
    if (!form.confirm || form.confirm !== form.password)
      next.confirm = "Your passwords must match.";
    setErrors(next);
    const first = (Object.keys(next) as FieldName[])[0];
    if (first) {
      fields.current[first]?.focus();
      return;
    }
    void request.run(signal => passengerApi.signup({ name: form.name, email: form.email.trim(), phone: form.phone, password: form.password }, signal), next => {
      setForm(previous => ({ ...previous, password: "", confirm: "" }));
      setVisible({ password: false, confirm: false });
      setChallenge(next);
    });
  }
  function field(
    key: FieldName,
    label: string,
    icon: IconName,
    props: TextInputProps = {},
  ) {
    const password = key === "password" || key === "confirm";
    return (
      <View key={key} style={s.fieldGroup}>
        <View style={[s.field, errors[key] && s.fieldError]}>
          <Icon name={icon} size={23} color={muted} />
          <TextInput
            ref={(input) => {
              fields.current[key] = input;
            }}
            accessibilityLabel={label}
            accessibilityHint={
              password
                ? "Use 12 to 128 characters."
                : undefined
            }
            placeholder={label}
            placeholderTextColor={muted}
            value={form[key]}
            onChangeText={(value) => change(key, value)}
            style={s.input}
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={password ? 128 : 254}
            returnKeyType={key === "confirm" ? "done" : "next"}
            onSubmitEditing={() => {
              const next = (
                {
                  name: "email",
                  email: "phone",
                  phone: "password",
                  password: "confirm",
                } as const
              )[key as Exclude<FieldName, "confirm">];
              if (next) fields.current[next]?.focus();
              else submit();
            }}
            {...props}
            secureTextEntry={password && !visible[key]}
          />
          {password && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${visible[key] ? "Hide" : "Show"} ${key === "confirm" ? "confirm password" : "password"}`}
              onPress={() =>
                setVisible((previous) => ({
                  ...previous,
                  [key]: !previous[key],
                }))
              }
              style={s.eye}
            >
              <Icon
                name={visible[key] ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={muted}
              />
            </Pressable>
          )}
        </View>
        {errors[key] && (
          <Text accessibilityRole="alert" style={s.error}>
            {errors[key]}
          </Text>
        )}
      </View>
    );
  }

  if (challenge) return <VerifyEmailScreen initial={challenge} email={form.email.trim()} onBack={() => setChallenge(null)} onSignIn={onSignIn} />;
  return (
    <View style={s.root} testID="passenger-signup">
      <StatusBar style="dark" />
      <AccountBackground />
      <SafeAreaView style={s.flex}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={s.content}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to welcome"
              onPress={onBack}
              style={s.back}
            >
              <Icon name="arrow-back" size={29} color={ink} />
            </Pressable>
            <View style={s.heading}>
              <Text
                accessibilityRole="header"
                style={[s.title, width < 360 && { fontSize: 30 }]}
              >
                Create Account
              </Text>
              <Text style={s.subtitle}>Join Vooma today</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={request.busy}
              accessibilityState={{ disabled: request.busy, busy: request.busy }}
              onPress={() => void request.run(google, () => {})}
              style={({ pressed }) => [s.google, pressed && { opacity: 0.7 }]}
            >
              <GoogleMark />
              <Text style={s.googleText}>Continue with Google</Text>
            </Pressable>
            <View style={s.separator}>
              <View style={s.line} />
              <Text style={s.or}>or</Text>
              <View style={s.line} />
            </View>
            <View style={s.fields}>
              {field("name", "Full Name", "person-outline", {
                autoCapitalize: "words",
                autoComplete: "name",
                textContentType: "name",
                maxLength: 80,
              })}
              {field("email", "Email Address", "mail-outline", {
                keyboardType: "email-address",
                autoComplete: "email",
                textContentType: "emailAddress",
              })}
              {field("phone", "Phone Number", "call-outline", {
                keyboardType: "phone-pad",
                autoComplete: "tel",
                textContentType: "telephoneNumber",
                maxLength: 24,
              })}
              {field("password", "Password", "lock-closed-outline", {
                autoComplete: "new-password",
                textContentType: "newPassword",
              })}
              {field("confirm", "Confirm Password", "lock-closed-outline", {
                autoComplete: "new-password",
                textContentType: "newPassword",
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create account"
              disabled={request.busy}
              accessibilityState={{ disabled: request.busy, busy: request.busy }}
              onPress={submit}
              style={({ pressed }) => [s.submit, pressed && { opacity: 0.8 }]}
            >
              <Text style={s.submitText}>{request.busy ? "Creating account…" : "Create account"}</Text>
            </Pressable>
            {message !== "" && (
              <View style={s.message}>
                <Notice>{message}</Notice>
              </View>
            )}
            {request.error !== "" && <View style={s.message}><Notice error>{request.error}</Notice></View>}
            <View style={s.signInRow}>
              <Text style={s.footerText}>Already have an account?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={onSignIn}
                style={s.footerLink}
              >
                <Text style={s.link}>Sign in</Text>
              </Pressable>
            </View>
            <View style={s.terms}>
              <Text style={s.termsText}>
                By creating an account, you agree to our
              </Text>
              <View style={s.termsLinks}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPolicy("Terms & Conditions")}
                  style={s.legalLink}
                >
                  <Text style={s.legalText}>Terms &amp; Conditions</Text>
                </Pressable>
                <Text style={s.termsText}>and</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPolicy("Privacy Policy")}
                  style={s.legalLink}
                >
                  <Text style={s.legalText}>Privacy Policy.</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Sheet
        visible={policy !== null}
        title={policy ?? "Account information"}
        onClose={() => setPolicy(null)}
      >
        <Text style={ui.body}>
          {policy === "Terms & Conditions"
            ? "Ride booking and payments are not available yet. Vooma’s full passenger terms have not yet been published here."
            : "Creating an account sends your name, email, phone number and password to Vooma API. Profile details are encrypted and passwords are hashed on the server. Mobile session tokens are saved in secure device storage; web sessions stay in memory. Google sign-in uses Supabase and sends a verified identity token to Vooma API. Demo trip history is stored locally for your account. This describes the development build; Vooma’s full privacy policy has not yet been published here."}
        </Text>
        <Button
          label="Back to Create Account"
          onPress={() => setPolicy(null)}
        />
      </Sheet>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EFF6FF" },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 22,
  },
  back: { width: 48, height: 48, justifyContent: "center", marginLeft: -5 },
  heading: { marginTop: 15, marginBottom: 24, gap: 6 },
  title: {
    color: ink,
    fontSize: 34,
    lineHeight: 43,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subtitle: { color: ink, fontSize: 23, lineHeight: 30 },
  google: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFFD9",
    borderWidth: 1,
    borderColor: "#DFEAF9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    boxShadow: "0 3px 10px rgba(85, 133, 191, 0.1)",
  },
  googleText: { color: ink, fontSize: 17, fontWeight: "700", flexShrink: 1 },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    paddingHorizontal: 13,
    marginVertical: 17,
  },
  line: { flex: 1, height: 1.5, backgroundColor: "#C6DCF5" },
  or: { color: "#587093", fontSize: 17 },
  fields: { gap: 10 },
  fieldGroup: { gap: 5 },
  field: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFFBB",
    borderWidth: 1,
    borderColor: "#E2ECFA",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingLeft: 17,
    paddingRight: 7,
    boxShadow: "0 3px 8px rgba(85, 133, 191, 0.07)",
  },
  fieldError: { borderColor: "#B32736" },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: 13,
    color: ink,
    fontSize: 17,
    outlineWidth: 0,
  },
  eye: {
    width: 44,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    color: "#B32736",
    paddingHorizontal: 10,
  },
  submit: {
    minHeight: 56,
    borderRadius: 30,
    backgroundColor: "#0D2D4D",
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
    marginTop: 25,
  },
  submitText: { fontSize: 21, fontWeight: "700", color: "#FFFFFF" },
  message: { marginTop: 12 },
  signInRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  footerText: { color: "#587093", fontSize: 15, lineHeight: 22 },
  footerLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  link: { color: "#0758F9", fontWeight: "700", fontSize: 16 },
  terms: { alignItems: "center", marginTop: 20 },
  termsText: {
    color: "#587093",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  termsLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 4,
  },
  legalLink: { minHeight: 36, justifyContent: "center" },
  legalText: { color: "#0758F9", fontSize: 13, fontWeight: "700" },
});
