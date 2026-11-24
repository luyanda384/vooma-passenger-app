export type WebCar = {
  marker: {
    setPosition: (point: { lat: number; lng: number }) => void;
    setIcon: (icon: object) => void;
    setMap: (map: null) => void;
  };
  icon: object;
  position?: { lat: number; lng: number };
  heading?: number;
  frame?: number;
};
/** Self-contained so the driver iframe can use this exact animation function. */
export function moveWebCar(
  car: WebCar,
  target: { lat: number; lng: number },
  svg: string,
  reduced: boolean,
) {
  if (car.frame !== undefined) cancelAnimationFrame(car.frame);
  const from = car.position ?? target;
  const rad = Math.PI / 180;
  const dx =
    (target.lng - from.lng) * Math.cos(((target.lat + from.lat) * rad) / 2);
  const dy = target.lat - from.lat;
  const meters = Math.hypot(dx, dy) * rad * 6371000;
  const startHeading = car.heading ?? 0;
  const bearing = (Math.atan2(dx, dy) / rad + 360) % 360;
  const heading =
    meters >= 3
      ? startHeading + ((((bearing - startHeading) % 360) + 540) % 360) - 180
      : startHeading;
  const duration =
    reduced || !car.position || meters < 3 || meters > 150 ? 0 : 900;
  const began = Date.now();
  function frame() {
    const t = duration ? Math.min(1, (Date.now() - began) / duration) : 1;
    car.position = {
      lat: from.lat + (target.lat - from.lat) * t,
      lng: from.lng + (target.lng - from.lng) * t,
    };
    car.heading = startHeading + (heading - startHeading) * t;
    const rotated = svg
      .replace(
        "<defs>",
        '<g transform="rotate(' + car.heading + ' 24 24)"><defs>',
      )
      .replace("</svg>", "</g></svg>");
    car.marker.setPosition(car.position);
    car.marker.setIcon({
      ...car.icon,
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(rotated),
    });
    if (t < 1) car.frame = requestAnimationFrame(frame);
  }
  frame();
}
