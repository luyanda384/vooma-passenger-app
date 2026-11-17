import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const key = "vooma.passenger.session.v1";
export const sessionStorage = {
  read: async () => Platform.OS === "web" ? null : SecureStore.getItemAsync(key),
  write: async (token: string) => { if (Platform.OS !== "web") await SecureStore.setItemAsync(key, token); },
  clear: async () => { if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key); },
};
