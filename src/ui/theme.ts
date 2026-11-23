import { StyleSheet } from "react-native";
import palette from "../brand/tokens.json";

// Shared passenger styling from the driver's dashboard, activity and home UI.
// Keep the original brand palette separate so the floating navbar stays intact.
export const dashboardColors = {
  ...palette,
  ink: "#082344",
  navy: "#082344",
  muted: "#61748D",
  tint: "#F5FAFF",
  line: "#E5EFFA",
  sky: "#DFEEFF",
  action: "#0C2945",
  link: "#0067CF",
  hero: "#D5EBFF",
  profile: "#CCE3FF",
  shadow: "#5383B1",
};

export const dashboardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderColor: dashboardColors.line,
    borderWidth: 1,
    shadowColor: dashboardColors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 2,
  },
  menuCard: {
    backgroundColor: "#FAFCFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D8E5F5",
    shadowColor: "#8AA8CD",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  field: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8F6",
    borderRadius: 18,
    shadowOpacity: 0,
    elevation: 0,
  },
  title: {
    color: dashboardColors.ink,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  sectionTitle: {
    color: dashboardColors.ink,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
