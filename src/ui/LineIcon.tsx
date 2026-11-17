import colors from "../brand/tokens.json";
import Svg, { Circle, Path } from "react-native-svg";

// Small inline icons keep account controls visible before any icon font loads.
const paths = {
  phone: "M7 2h10v20H7ZM11 18h2",
  lock: "M5 10h14v11H5ZM8 10V6a4 4 0 018 0v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 11-6 0 3 3 0 016 0",
  "eye-off":
    "M3 3l18 18M10 5a12 12 0 012 0c6 0 10 7 10 7a22 22 0 01-4 5M6 6a22 22 0 00-4 6s4 7 10 7a12 12 0 005-1M10 10a3 3 0 004 4",
  "arrow-left": "M20 12H4M10 6l-6 6 6 6",
  info: "M12 11v6M12 7h.01",
  settings:
    "M19.4 13a7.5 7.5 0 000-2l2-1.6-2-3.5-2.4 1a8 8 0 00-1.7-1L15 3h-4l-.4 2.9a8 8 0 00-1.7 1l-2.4-1-2 3.5 2 1.6a7.5 7.5 0 000 2l-2 1.6 2 3.5 2.4-1a8 8 0 001.7 1L11 21h4l.4-2.9a8 8 0 001.7-1l2.4 1 2-3.5Z M16.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0Z",
  "arrow-right": "M4 12h16M14 6l6 6-6 6",
  "chevron-left": "M15 5l-7 7 7 7",
  "chevron-down": "M5 9l7 7 7-7",
  check: "M4 12l5 5L20 6",
  mail: "M3 5h18v14H3ZM3 6l9 7 9-7",
  code: "M7 6l-6 6 6 6M17 6l6 6-6 6M14 4l-4 16",
  clock: "M12 6v6l4 2",
  "bar-chart-2": "M5 20v-5M12 20V9M19 20V3",
  users:
    "M2 21v-2a5 5 0 015-5h2a5 5 0 015 5v2M16 14a5 5 0 015 5v2M17 3a4 4 0 010 8",
} as const;

export function LineIcon({
  name,
  size = 24,
  color = colors.blue,
}: {
  name: keyof typeof paths;
  size?: number;
  color?: string;
  accessible?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <Path
        d={paths[name]}
        fill={name === "settings" ? color : "none"}
        fillRule="evenodd"
        strokeWidth={name === "settings" ? 0 : undefined}
      />
      {name === "info" && <Circle cx={12} cy={12} r={9.5} />}
      {name === "clock" && <Circle cx={12} cy={12} r={9.5} />}
      {name === "users" && <Circle cx={8} cy={6} r={4} />}
    </Svg>
  );
}
