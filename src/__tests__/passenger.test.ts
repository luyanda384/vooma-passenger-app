import {
  advanceRide,
  cancelRide,
  createRide,
  initialState,
  isActive,
  money,
  parseState,
  places,
  quote,
  rateRide,
} from "../domain/passenger";

const now = Date.parse("2026-11-16T12:00:00Z");
const input = {
  pickup: places[0],
  destination: places[1],
  service: "go" as const,
  scheduledAt: null,
};
const makeRide = () => createRide(initialState, input, now);
describe("passenger booking rules", () => {
  it("quotes in integer cents with a minimum fare and service pricing", () => {
    const go = quote(places[0], places[1], "go");
    expect(go.distanceKm).toBeGreaterThan(4);
    expect(Number.isSafeInteger(go.fare)).toBe(true);
    expect(go.fare).toBeGreaterThanOrEqual(4000);
    expect(quote(places[0], places[1], "comfort").fare).toBeGreaterThan(
      go.fare,
    );
    expect(quote(places[0], places[1], "xl").fare).toBeGreaterThan(
      quote(places[0], places[1], "comfort").fare,
    );
    expect(money(12350)).toBe("R 123,5");
  });
  it("rejects identical and out-of-area destinations", () => {
    expect(() =>
      createRide(initialState, { ...input, destination: input.pickup }, now),
    ).toThrow("200 metres");
    expect(() =>
      createRide(
        initialState,
        {
          ...input,
          destination: { ...places[1], latitude: -33.92, longitude: 18.42 },
        },
        now,
      ),
    ).toThrow("150 km");
  });
  it("rejects invalid coordinates", () => {
    expect(() =>
      createRide(
        initialState,
        { ...input, pickup: { ...places[0], latitude: NaN } },
        now,
      ),
    ).toThrow("valid pickup");
  });
  it("allows only one active ride, including a scheduled one", () => {
    const scheduled = createRide(
      initialState,
      { ...input, scheduledAt: new Date(now + 3600000).toISOString() },
      now,
    );
    expect(scheduled.status).toBe("scheduled");
    expect(() =>
      createRide({ ...initialState, rides: [scheduled] }, input, now),
    ).toThrow("current demo ride");
  });
  it("rejects stale and malformed scheduled times", () => {
    for (const scheduledAt of [
      "invalid",
      new Date(now - 1).toISOString(),
      new Date(now + 60000).toISOString(),
    ]) {
      expect(() =>
        createRide(initialState, { ...input, scheduledAt }, now),
      ).toThrow("5 minutes");
    }
  });
  it("moves through the trip lifecycle and prevents completing a terminal trip again", () => {
    let ride = makeRide();
    for (const status of ["matched", "arriving", "in_progress", "completed"]) {
      ride = advanceRide(ride);
      expect(ride.status).toBe(status);
    }
    expect(isActive(ride)).toBe(false);
    expect(() => advanceRide(ride)).toThrow("already ended");
    expect(
      createRide({ ...initialState, rides: [ride] }, input, now).status,
    ).toBe("requested");
  });
  it("permits cancellation before pickup, not during or after a trip", () => {
    const cancelled = cancelRide(makeRide());
    expect(cancelled.status).toBe("cancelled");
    expect(() => advanceRide(cancelled)).toThrow();
    expect(() => cancelRide(cancelled)).toThrow();
    expect(() =>
      cancelRide({ ...makeRide(), status: "in_progress" }),
    ).toThrow();
  });
  it("rates completed trips only, with whole stars from one to five", () => {
    const ride = { ...makeRide(), status: "completed" as const };
    expect(rateRide(ride, 4).rating).toBe(4);
    for (const rating of [0, 6, 1.5, NaN])
      expect(() => rateRide(ride, rating)).toThrow();
    expect(() => rateRide(makeRide(), 5)).toThrow();
  });
});
describe("restoring local demo data", () => {
  it("restores an active ride and saved places without advancing or charging it", () => {
    const state = {
      ...initialState,
      welcomed: true,
      name: "Lebo",
      saved: ["rosebank"],
      rides: [makeRide()],
    };
    expect(parseState(JSON.stringify(state))).toEqual(state);
    expect(parseState(null)).toEqual(initialState);
  });
  it("rejects corrupt or unsupported data rather than silently overwriting it", () => {
    for (const raw of [
      "{broken",
      "{}",
      "null",
      JSON.stringify({ ...initialState, version: 2 }),
      JSON.stringify({ ...initialState, saved: ["unknown"] }),
    ])
      expect(() => parseState(raw)).toThrow();
  });
  it("rejects invalid trip status, fare, dates and multiple active rides", () => {
    for (const ride of [
      { ...makeRide(), status: "paid" },
      { ...makeRide(), fare: -1 },
      { ...makeRide(), createdAt: "bad" },
    ])
      expect(() =>
        parseState(JSON.stringify({ ...initialState, rides: [ride] })),
      ).toThrow();
    expect(() =>
      parseState(
        JSON.stringify({ ...initialState, rides: [makeRide(), makeRide()] }),
      ),
    ).toThrow();
  });
});
