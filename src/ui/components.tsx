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
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
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
          <View style={ui.sheetHeader}>
            <Text accessibilityRole="header" style={ui.h2}>
              {title}
            </Text>
            <IconButton
              name="close"
              label={`Close ${title}`}
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
    color: c.ink,
    letterSpacing: -1.2,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700",
    color: c.ink,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  h3: { fontSize: 17, fontWeight: "700", color: c.ink },
  body: { fontSize: 15, lineHeight: 23, color: c.muted },
  small: { fontSize: 12, lineHeight: 18, color: c.muted },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    color: c.muted,
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
    padding: 22,
    borderRadius: 24,
    backgroundColor: c.white,
    borderColor: c.line,
    borderWidth: 1,
    gap: 18,
  },
  divider: { height: 1, backgroundColor: c.line },
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: c.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondaryButton: {
    backgroundColor: c.tint,
    borderWidth: 1,
    borderColor: c.line,
  },
  buttonText: {
    color: c.white,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: c.tint,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.ink,
  },
  notice: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: c.tint,
    alignItems: "flex-start",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#101D2E88",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "94%",
    backgroundColor: c.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetHeader: {
    padding: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetContent: { padding: 22, paddingTop: 8, paddingBottom: 34, gap: 18 },
  empty: { paddingVertical: 36, alignItems: "center", gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: c.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 30,
    backgroundColor: c.sky,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: c.navy,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
