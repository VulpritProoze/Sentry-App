import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";

export default function Layout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme={colorScheme!}>
        <Stack screenOptions={{ headerShown: false }} />
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
