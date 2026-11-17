import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function EntryLogo({
  size = 44,
  wordmark = false,
}: {
  size?: number;
  wordmark?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel="Vooma"
      style={{ alignItems: "center", gap: (size * 8) / 114 }}
    >
      <Svg
        width={size}
        height={(size * 94) / 114}
        viewBox="0 0 120 100"
        aria-hidden
      >
        <Path
          d="M3 10h24c10 0 14 5 19 13l35 60c-6 17-28 18-36 3Z"
          fill="#1D2A3B"
        />
        <Path
          d="M84 4a28 28 0 00-24 43l24 38 24-38A28 28 0 0084 4Zm0 17a10 10 0 110 20 10 10 0 010-20Z"
          fill="#FF7A00"
          fillRule="evenodd"
        />
      </Svg>
      {wordmark && (
        <Text
          style={{
            fontSize: (size * 34) / 114,
            fontWeight: "800",
            letterSpacing: (size * 3) / 114,
            color: "#1D2A3B",
          }}
        >
          VOOMA
        </Text>
      )}
    </View>
  );
}
