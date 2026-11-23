import { StyleSheet, Text, View } from "react-native";
import { EntryLogo } from "../brand/EntryLogo";
import { HomeArtwork } from "./HomeArtwork";
import { dashboardColors as c, dashboardStyles as d } from "./theme";

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.hero}>
      <HomeArtwork skylineOpacity={0.4} />
      <View style={styles.brand}>
        <EntryLogo size={32} />
        <Text style={styles.wordmark}>vooma</Text>
        <Text style={styles.passenger}>Passenger</Text>
      </View>
      <Text accessibilityRole="header" style={d.title}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -14,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 26,
    overflow: "hidden",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  wordmark: {
    color: c.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  passenger: { color: c.link, fontSize: 16, fontWeight: "500" },
  subtitle: { color: "#527193", fontSize: 16, lineHeight: 23, marginTop: 6 },
});
