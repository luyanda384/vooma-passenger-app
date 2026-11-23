import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const key = "vooma.passenger.session.v1";
let browserToken: string | null = null;
export const sessionStorage = {
  read: async () =>
    Platform.OS === "web" ? browserToken : SecureStore.getItemAsync(key),
  write: async (token: string) => {
    if (Platform.OS === "web") browserToken = token;
    else await SecureStore.setItemAsync(key, token);
  },
  clear: async () => {
    browserToken = null;
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  },
};
