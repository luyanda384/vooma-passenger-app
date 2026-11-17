import Svg, { G, Path } from "react-native-svg";
import geometry from "./geometry.json";
import palette from "./tokens.json";

/** Original outlined artwork; no external font or image license required. */
export function Logo({
  size = 148,
  symbol = false,
  inverse = false,
  wordmark = false,
}: {
  size?: number;
  symbol?: boolean;
  inverse?: boolean;
  wordmark?: boolean;
}) {
  const foreground = inverse ? palette.white : palette.blue;
  return (
    <Svg
      width={size}
      height={symbol ? size : size * 0.26}
      viewBox={symbol ? "0 0 128 128" : wordmark ? "0 0 320 72" : "0 0 480 125"}
      aria-hidden
    >
      {!wordmark && (
        <Path d={geometry.pin} fill={palette.orange} fillRule="evenodd" />
      )}
      {!symbol && (
        <G transform={wordmark ? undefined : "translate(150 22)"}>
          <Path d={geometry.wordmark} fill={foreground} fillRule="evenodd" />
        </G>
      )}
    </Svg>
  );
}
