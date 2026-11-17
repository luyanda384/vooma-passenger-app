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
export function IllustratedMap({ route = false }: { route?: boolean }) {
  return (
    <View
      style={styles.map}
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
        <Rect width="500" height="400" fill="#E7EFF2" />
        <G fill="#D1E5DC">
          <Path d="M0 0h156l-20 95-76 45H0ZM340 250l160-18v168H374Z" />
          <Rect x="190" y="135" width="60" height="54" rx="18" />
        </G>
        <G fill="#DCE5E8">
          <Rect x="184" y="20" width="89" height="78" rx="8" />
          <Rect x="303" y="23" width="90" height="77" rx="8" />
          <Rect x="77" y="177" width="79" height="75" rx="8" />
          <Rect x="184" y="220" width="90" height="83" rx="8" />
          <Rect x="305" y="138" width="85" height="61" rx="8" />
          <Rect x="70" y="310" width="83" height="80" rx="8" />
        </G>
        <G fill="none" stroke="#FAFDFE" strokeWidth="13">
          <Path d="M-20 157 520 114M-30 287 520 211M165-20 169 420M287-20 291 420M414-20 417 420M-10 50 520 362M-20 354 520 291" />
        </G>
        <G fill="none" stroke="#D2DEE4" strokeWidth="1">
          <Path d="M-20 157 520 114M-30 287 520 211M165-20 169 420M287-20 291 420" />
        </G>
        <G
          fill="#788D98"
          fontFamily="sans-serif"
          fontSize="11"
          fontWeight="600"
        >
          <SvgText x="187" y="64">
            SANDTON
          </SvgText>
          <SvgText x="83" y="231">
            HYDE PARK
          </SvgText>
          <SvgText x="311" y="273">
            MELROSE
          </SvgText>
          <SvgText x="184" y="358">
            ROSEBANK
          </SvgText>
        </G>
        <G fill="#87A799" fontFamily="sans-serif" fontSize="9">
          <SvgText x="30" y="50">
            GREEN SPACE
          </SvgText>
          <SvgText x="399" y="350">
            PARK
          </SvgText>
        </G>
        {route && (
          <Path
            d="M169 290v-81l120-17v-64l54-5"
            stroke="#203147"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="8 6"
          />
        )}
        <Circle cx="169" cy="290" r="27" fill="#FF7A00" opacity=".14" />
        <Circle
          cx="169"
          cy="290"
          r="11"
          fill="#FF7A00"
          stroke="#FFF"
          strokeWidth="4"
        />
        {route && (
          <G>
            <Circle
              cx="343"
              cy="123"
              r="16"
              fill="#203147"
              stroke="#FFF"
              strokeWidth="4"
            />
            <Rect x="338" y="118" width="10" height="10" rx="2" fill="#FFF" />
          </G>
        )}
      </Svg>
      <View style={styles.top}>
        <View style={[ui.row, styles.chip]}>
          <Icon name="location-outline" size={16} />
          <Text style={styles.chipText}>Johannesburg</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: c.navy }]}>
          <Text style={[styles.chipText, { color: c.white }]}>DEMO AREA</Text>
        </View>
      </View>
      <View style={styles.caption}>
        <Text style={ui.small}>Illustrative map · not live navigation</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  map: {
    height: 310,
    minHeight: 240,
    flexGrow: 1,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E7EFF2",
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
