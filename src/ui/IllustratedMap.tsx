import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { c, Icon, ui } from "./components";

export function Car({ large = false }: { large?: boolean }) {
  return (
    <Svg
      width={large ? 220 : 75}
      height={large ? 100 : 42}
      viewBox="0 0 220 100"
      accessible={false}
    >
      <Path
        d="M16 65 24 44 65 37 88 13h65l31 28 22 9 6 25H12Z"
        fill="#D5EDFD"
        stroke="#203147"
        strokeWidth="3"
      />
      <Path d="m79 37 16-18h52l21 19Z" fill="#203147" />
      <Path d="M126 18v21" stroke="#D5EDFD" strokeWidth="4" />
      <Path d="M20 57h22m142-5h18" stroke="#FF7A00" strokeWidth="7" />
      <Path d="M80 53h12m41 0h12" stroke="#203147" strokeWidth="3" />
      <Circle cx="54" cy="75" r="18" fill="#203147" />
      <Circle cx="54" cy="75" r="9" fill="#fff" />
      <Circle cx="173" cy="75" r="18" fill="#203147" />
      <Circle cx="173" cy="75" r="9" fill="#fff" />
      <Path d="M87 73h55" stroke="#203147" strokeWidth="4" />
    </Svg>
  );
}
/** Deliberately illustrative: never implies live GPS, roads or driver positions. */
export function IllustratedMap({
  route = false,
  variant = "default",
}: {
  route?: boolean;
  variant?: "default" | "saved";
}) {
  const saved = variant === "saved";
  return (
    <View
      style={[styles.map, saved && styles.savedMap]}
      accessible
      accessibilityLabel={
        route
          ? "Illustrative trip map. Not a real route or live driver location."
          : "Illustrative map of the Johannesburg demo area."
      }
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect width="500" height="400" fill="#EEF1F2" />
        <G fill="#DCEBDD">
          <Path d="M0 0h120l-22 75-62 38H0ZM378 252l122-18v166H412Z" />
          <Path d="M342 0h158v92l-72 24-65-43ZM0 295l88-21 45 63-18 63H0Z" />
        </G>
        <G fill="#E2E6E7">
          <Rect x="147" y="22" width="83" height="67" rx="7" />
          <Rect x="270" y="18" width="72" height="80" rx="8" />
          <Rect x="378" y="121" width="83" height="67" rx="7" />
          <Rect x="37" y="152" width="74" height="76" rx="8" />
          <Rect x="160" y="154" width="70" height="58" rx="8" />
          <Rect x="305" y="229" width="71" height="70" rx="8" />
          <Rect x="139" y="309" width="83" height="70" rx="8" />
          <Rect x="260" y="317" width="77" height="65" rx="8" />
        </G>
        <G fill="none" stroke="#FFFFFF" strokeWidth="8">
          <Path d="M-20 125 520 167M-30 277 520 218M118-20 141 420M254-20 270 420M375-20 399 420M-10 46 520 355M-20 354 520 307" />
        </G>
        <G fill="none" stroke="#F5D46A" strokeWidth="4">
          <Path d="M-20 125 520 167M-30 277 520 218M118-20 141 420M254-20 270 420M375-20 399 420M-10 46 520 355M-20 354 520 307" />
        </G>
        <G
          fill="#303B48"
          fontFamily="sans-serif"
          fontSize="15"
          fontWeight="700"
        >
          <SvgText x="220" y="91">
            Sandton
          </SvgText>
          <SvgText x="70" y="236" fontSize="11" fontWeight="500">
            Melville
          </SvgText>
          <SvgText x="216" y="166">
            Rosebank
          </SvgText>
          <SvgText x="180" y="315" fontSize="21" fontWeight="700">
            Johannesburg
          </SvgText>
        </G>
        {route && (
          <Path
            d="M250 232v-71l-55-39v-58"
            stroke="#203147"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="8 6"
          />
        )}
        <Circle cx="250" cy="232" r="31" fill="#1976F3" opacity=".16" />
        <Circle cx="250" cy="232" r="13" fill="#1976F3" stroke="#FFF" strokeWidth="5" />
        {route && (
          <G>
            <Circle
              cx="195"
              cy="103"
              r="16"
              fill="#203147"
              stroke="#FFF"
              strokeWidth="4"
            />
            <Rect x="190" y="98" width="10" height="10" rx="2" fill="#FFF" />
          </G>
        )}
      </Svg>
      {saved ? (
        <>
          <View style={styles.compassControl}>
            <Icon name="navigate-outline" size={19} color={c.muted} />
          </View>
          <View style={styles.locateControl}>
            <Icon name="locate-outline" size={21} color={c.navy} />
          </View>
        </>
      ) : (
        <View style={styles.top}>
          <View style={[ui.row, styles.chip]}>
            <Icon name="location-outline" size={16} />
            <Text style={styles.chipText}>Johannesburg</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: c.navy }]}>
            <Text style={[styles.chipText, { color: c.white }]}>DEMO AREA</Text>
          </View>
        </View>
      )}
      <View style={styles.caption}>
        <Text style={ui.small}>
          {saved ? "Illustrative map · not live location" : "Illustrative map · not live navigation"}
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  map: {
    height: 205,
    minHeight: 190,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E7EFF2",
  },
  savedMap: { height: 220, minHeight: 210, borderRadius: 22 },
  compassControl: {
    position: "absolute",
    top: 13,
    left: 13,
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFF2",
  },
  locateControl: {
    position: "absolute",
    right: 13,
    bottom: 13,
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFF2",
  },
  top: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  chip: {
    backgroundColor: "#FFFFFFF2",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    color: c.navy,
    letterSpacing: 0.6,
  },
  caption: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "#FFFFFFEB",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
});
