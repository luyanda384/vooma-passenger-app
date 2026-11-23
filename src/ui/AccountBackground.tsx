import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

export function AccountBackground() {
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
        preserveAspectRatio="xMidYMin slice"
        viewBox="0 0 430 820"
      >
        <Defs>
          <LinearGradient id="account-sky" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F5F9FF" />
            <Stop offset="0.55" stopColor="#EDF5FF" />
            <Stop offset="1" stopColor="#E7F1FE" />
          </LinearGradient>
          <LinearGradient id="account-city" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CBE1F6" stopOpacity=".4" />
            <Stop offset="1" stopColor="#D9EAFB" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="430" height="820" fill="url(#account-sky)" />
        <G fill="url(#account-city)">
          <Path d="M64 195V96h9V88h7v8h9v99h7v-65h19v65h9V83h4V68h5v15h4v112h14v-53h15v53h12V116h14v-13h5v13h14v79h12V95h7v-8h6v8h10v100h13V82h6V71h6v11h10v113h13V59h6V49h4V29h3v20h4v10h6v136h8V98h10v-8h4v8h10v97h10v-53h8v-14h5v14h11v53h11v-84h18v84h11v-62h17v62Z" />
        </G>
      </Svg>
    </View>
  );
}
