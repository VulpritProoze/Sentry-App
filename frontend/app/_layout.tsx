import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TamaguiProvider } from "tamagui";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "../lib/queryClient";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useThemeContext } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { ToastContainer } from "../components/ToastContainer";
import config from "../tamagui.config";

function ThemedApp() {
  const { activeTheme } = useThemeContext();

  return (
    <TamaguiProvider config={config} defaultTheme={activeTheme}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <ToastContainer />
      </ToastProvider>
    </TamaguiProvider>
  );
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ThemedApp />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
