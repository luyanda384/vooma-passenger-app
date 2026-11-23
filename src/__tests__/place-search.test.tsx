import { act, renderHook } from "@testing-library/react-native";
import { usePlaceSearch } from "../places/usePlaceSearch";
import { placeSearch, type Suggestion } from "../places/service";

jest.mock("../places/service", () => ({
  placeSearch: {
    suggest: jest.fn(),
    resolve: jest.fn(),
    saved: jest.fn(),
    end: jest.fn(),
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "search-session" }));
const suggestion: Suggestion = {
  id: "one",
  title: "Example Road",
  subtitle: "Johannesburg",
  provider: "apple",
};
beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(placeSearch.suggest).mockReset().mockResolvedValue([suggestion]);
});
afterEach(() => jest.useRealTimers());

test("debounces typing, passes the current pickup bias, and ignores old responses", async () => {
  let first: (value: Suggestion[]) => void = () => {};
  jest.mocked(placeSearch.suggest).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        first = resolve;
      }),
  );
  const hook = renderHook(() =>
    usePlaceSearch({ latitude: -26, longitude: 28 }),
  );
  act(() => hook.result.current.change("Ex"));
  act(() => jest.advanceTimersByTime(299));
  expect(placeSearch.suggest).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  act(() => hook.result.current.change("Example"));
  await act(async () => jest.advanceTimersByTime(300));
  expect(placeSearch.suggest).toHaveBeenLastCalledWith(
    "Example",
    "search-session",
    { latitude: -26, longitude: 28 },
  );
  expect(hook.result.current.suggestions).toEqual([suggestion]);
  act(() => hook.result.current.change("Example"));
  expect(hook.result.current.status).toBe("ready");
  expect(hook.result.current.suggestions).toEqual([suggestion]);
  await act(async () =>
    first([{ ...suggestion, id: "old", title: "Old result" }]),
  );
  expect(hook.result.current.suggestions).toEqual([suggestion]);
  act(() => hook.result.current.change(""));
  expect(hook.result.current.suggestions).toEqual([]);
  expect(hook.result.current.status).toBe("idle");
  hook.unmount();
  expect(placeSearch.end).toHaveBeenCalledWith("search-session");
});

test("search failures offer retry and an empty provider response does not invent results", async () => {
  jest
    .mocked(placeSearch.suggest)
    .mockRejectedValueOnce(new Error("Search offline"))
    .mockResolvedValueOnce([]);
  const hook = renderHook(() => usePlaceSearch());
  act(() => hook.result.current.change("Example"));
  await act(async () => jest.advanceTimersByTime(300));
  expect(hook.result.current.error).toBe("Search offline");
  act(() => hook.result.current.retry());
  await act(async () => jest.advanceTimersByTime(300));
  expect(hook.result.current.error).toBe("");
  expect(hook.result.current.status).toBe("ready");
  expect(hook.result.current.suggestions).toEqual([]);
});

test("resolves only once and discards a selection after the picker closes", async () => {
  let finish: (value: any) => void = () => {};
  jest.mocked(placeSearch.resolve).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const hook = renderHook(() => usePlaceSearch());
  let pending!: ReturnType<typeof hook.result.current.select>;
  act(() => {
    pending = hook.result.current.select(suggestion);
  });
  await act(async () => {
    expect(await hook.result.current.select(suggestion)).toBeNull();
  });
  expect(placeSearch.resolve).toHaveBeenCalledTimes(1);
  hook.unmount();
  await act(async () =>
    finish({
      id: "one",
      name: "Example Road",
      address: "Johannesburg",
      latitude: -26,
      longitude: 28,
    }),
  );
  expect(await pending).toBeNull();
});
