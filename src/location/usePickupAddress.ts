import {
  reverseGeocodeAsync,
  type LocationGeocodedAddress,
} from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
type Coordinate = [longitude: number, latitude: number];

export function formatAddress(address: LocationGeocodedAddress): string {
  if (address.formattedAddress?.trim()) return address.formattedAddress.trim();
  const street = [address.streetNumber, address.street]
    .filter(Boolean)
    .join(' ');
  return [
    ...new Set(
      [street || address.name, address.district, address.city, address.region]
        .map((part) => part?.trim())
        .filter(Boolean),
    ),
  ].join(', ');
}

function nearby(a: Coordinate, b: Coordinate) {
  const latitude = ((a[1] + b[1]) * Math.PI) / 360;
  const metres =
    Math.hypot((a[0] - b[0]) * Math.cos(latitude), a[1] - b[1]) * 111_320;
  return metres < 30;
}

/** Resolve a real GPS/pickup point, never the map's preview centre. */
export function usePickupAddress(position: Coordinate | null) {
  const latest = useRef(position);
  const [result, setResult] = useState<{
    position: Coordinate;
    address: string;
  } | null>(null);
  const enabled = position !== null && Platform.OS !== 'web';
  useEffect(() => {
    latest.current = position;
  }, [position]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resolved: Coordinate | null = null;
    async function lookup() {
      const current = latest.current;
      if (!current || cancelled) return;
      if (!resolved || !nearby(resolved, current)) {
        try {
          const addresses = await reverseGeocodeAsync({
            longitude: current[0],
            latitude: current[1],
          });
          if (cancelled) return;
          const address = addresses[0] ? formatAddress(addresses[0]) : '';
          setResult({ position: current, address });
          if (address) resolved = current;
        } catch {
          if (cancelled) return;
          setResult({ position: current, address: '' });
        }
      }
      // Serialize lookups and limit geocoder use while driving.
      if (!cancelled) timer = setTimeout(() => void lookup(), 15_000);
    }
    void lookup();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled]);
  return enabled && position && result && nearby(position, result.position)
    ? result.address
    : null;
}
