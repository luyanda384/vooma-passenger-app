import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../i18n/LanguageProvider";
import { dashboardColors as c } from "./theme";

export function LanguageChoice() {
  const { language, saving, error, selectLanguage, t } = useLanguage();
  return (
    <View style={styles.container}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t("Language")}
        style={styles.pill}
      >
        {(["en-ZA", "fr"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityLabel={value === "fr" ? "Français" : "English"}
            accessibilityState={{
              checked: language === value,
              disabled: saving,
            }}
            disabled={saving}
            onPress={() => void selectLanguage(value)}
            style={[styles.option, language === value && styles.selected]}
          >
            <Text
              style={[styles.label, language === value && styles.selectedLabel]}
            >
              {value === "fr" ? "FR" : "ENG"}
            </Text>
          </Pressable>
        ))}
      </View>
      {error !== "" && (
        <Text accessibilityRole="alert" style={styles.error}>
          {t(error)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexShrink: 1, alignItems: "flex-end", gap: 8 },
  pill: {
    flexDirection: "row",
    backgroundColor: c.tint,
    borderRadius: 28,
    padding: 3,
  },
  option: {
    minHeight: 44,
    minWidth: 56,
    borderRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: c.link },
  label: { color: c.muted, fontSize: 15, fontWeight: "600" },
  selectedLabel: { color: c.white },
  error: { color: c.error, fontSize: 13, maxWidth: 250 },
});
