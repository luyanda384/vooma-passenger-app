import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import palette from "../brand/tokens.json";
import { dashboardColors as theme, dashboardStyles as d } from "./theme";

export const c = palette;
export type IconName = ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color = c.navy,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} accessible={false} />;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondaryButton,
        (disabled || busy) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.navy : c.white} />
      ) : (
        icon && (
          <Icon name={icon} size={20} color={secondary ? c.navy : c.white} />
        )
      )}
      <Text style={[ui.buttonText, secondary && { color: c.navy }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [ui.iconButton, pressed && { opacity: 0.6 }]}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Sheet({
  title,
  visible,
  onClose,
  closeLabel,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={ui.backdrop} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={ui.sheet}
        >
          <View style={ui.sheetHandle} />
          <View style={ui.sheetHeader}>
            <Text accessibilityRole="header" style={ui.h2}>
              {title}
            </Text>
            <IconButton
              name="close"
              label={closeLabel ?? `Close ${title}`}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={ui.sheetContent}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <View style={[ui.notice, error && { backgroundColor: "#FFF0F1" }]}>
      <Icon
        name={error ? "alert-circle-outline" : "information-circle-outline"}
        size={19}
        color={error ? c.error : c.muted}
      />
      <Text
        accessibilityRole={error ? "alert" : undefined}
        style={[ui.small, { flex: 1 }, error && { color: c.error }]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Empty({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Icon name={icon} size={34} />
      </View>
      <Text style={ui.h2}>{title}</Text>
      <Text style={[ui.body, { textAlign: "center", maxWidth: 340 }]}>
        {description}
      </Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  h1: {
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "800",
    color: theme.ink,
    letterSpacing: -0.8,
  },
  h2: {
    color: theme.ink,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  h3: {
    color: theme.ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  body: { fontSize: 15, lineHeight: 23, color: theme.muted },
  small: {
    fontSize: 12,
    color: theme.muted,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    color: theme.muted,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    ...d.card,
    padding: 16,
    gap: 14,
  },
  divider: { height: 1, backgroundColor: theme.line },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: theme.action,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: theme.white,
    borderColor: "#9CB3CF",
  },
  buttonText: {
    color: theme.white,
    textAlign: "center",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.white,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.white,
    borderColor: "#DCE8F6",
    borderRadius: 15,
    minHeight: 56,
  },
  notice: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    backgroundColor: "#EEF6FF",
    borderRadius: 12,
    padding: 14,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#06234366",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "94%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F9FCFF",
    borderColor: "#DFEAF8",
    borderWidth: 1,
  },
  sheetHeader: {
    padding: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetHandle: {
    width: 54,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#D2DDEB",
    alignSelf: "center",
    marginTop: 10,
  },
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 34,
    padding: 22,
    gap: 16,
  },
  empty: { paddingVertical: 36, alignItems: "center", gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECF5FF",
    borderRadius: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.sky,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: theme.link,
  },
});
