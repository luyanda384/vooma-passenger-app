import { useLanguage } from "../i18n/LanguageProvider";
import { LanguageChoice } from "../ui/LanguageChoice";
import { dashboardColors } from "../ui/theme";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthProvider";
import { useAuthRequest } from "../api/useAuthRequest";
import { Button, Notice, ui } from "../ui/components";

export function CompleteProfileScreen() {
  const { t } = useLanguage();
  const { pending, complete, cancelSocial } = useAuth();
  const [name, setName] = useState(pending?.name ?? "");
  const [phone, setPhone] = useState("");
  const request = useAuthRequest();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dashboardColors.tint }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 26,
            gap: 20,
            maxWidth: 500,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <LanguageChoice />
          <Text accessibilityRole="header" style={ui.h1}>
            {t("Complete your profile")}
          </Text>
          <Text style={ui.body}>
            {t("Signed in with Google as")} {pending?.email}.{" "}
            {t(
              "Add your details to finish creating your Vooma passenger account.",
            )}
          </Text>
          <TextInput
            accessibilityLabel={t("Full name")}
            placeholder={t("Full name")}
            value={name}
            maxLength={80}
            onChangeText={setName}
            autoComplete="name"
            style={ui.input}
          />
          <TextInput
            accessibilityLabel={t("Phone number")}
            placeholder="082 123 4567"
            value={phone}
            maxLength={24}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={ui.input}
          />
          <Text style={ui.small}>
            {t(
              "Your phone number is recorded but not yet verified. Rides and payments in this development build are demonstrations.",
            )}
          </Text>
          {request.error !== "" && <Notice error>{t(request.error)}</Notice>}
          <Button
            label={t(request.busy ? "Saving profile…" : "Complete account")}
            disabled={request.busy}
            onPress={() =>
              void request.run(
                async () => {
                  if (
                    name.trim().length < 2 ||
                    !/^(?:0\d{9}|\+[1-9]\d{7,14})$/.test(
                      phone.replace(/[\s()-]/g, ""),
                    )
                  )
                    throw new Error(
                      "Enter your full name and a valid phone number.",
                    );
                  await complete({ name, phone });
                },
                () => {},
              )
            }
          />
          <Button
            label={t("Cancel and return to welcome")}
            secondary
            disabled={request.busy}
            onPress={() => void request.run(cancelSocial, () => {})}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
