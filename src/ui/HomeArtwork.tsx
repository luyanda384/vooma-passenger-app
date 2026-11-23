import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  G,
  Path,
} from "react-native-svg";

/** Decorative skyline; kept separate from the real map below it. */
export function HomeArtwork({
  skylineOpacity = 0.18,
}: {
  skylineOpacity?: number;
}) {
  const id = `home-${useId().replace(/:/g, "")}`;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 420 190"
        preserveAspectRatio="xMidYMax slice"
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#EDF7FF" />
            <Stop offset="1" stopColor="#B8DCFF" />
          </LinearGradient>
        </Defs>
        <Rect width="420" height="190" fill={`url(#${id})`} />
        <G fill="#70B7EF" opacity={skylineOpacity}>
          <Path d="M167 163v-18h9v-12h7v30h7v-39h13v39h6v-62h14v62h7v-42h8v42h8V83h4V69h3V53h2v16h3v14h4v80h9v-50h14v50h8V96h13v67h7v-25h11v25h8V90h4V72h3V44h2v28h3v18h4v73h8v-48h12v48h9v-27h8v27Z" />
          <Path d="M198 104h4v-5h3v5h4v59h-11ZM275 100h12v63h-12ZM319 131h13v32h-13Z" />
        </G>
        <G stroke="#E2F2FF" strokeWidth="1" opacity={0.5}>
          <Path d="M213 106v54m5-54v54m32-72v72m5-72v72m23-43v43m5-43v43m15-58v58m5-58v58m34-65v65m5-65v65" />
        </G>
      </Svg>
    </View>
  );
}
