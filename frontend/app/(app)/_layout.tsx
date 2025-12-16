import { Stack, Redirect } from "expo-router";
import React from "react";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuth } from "@/context/AuthContext";

const AppLayout = () => {
  const colors = useThemeColors();
  const { isAuthenticated, isInitializing } = useAuth();

  // Show nothing while initializing
  if (isInitializing) {
    return null;
  }

  // Redirect unauthenticated users to landing page
  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.green[400] },
        headerTintColor: "#ffffff",
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
        }}
      />
    </Stack>
  );
};

export default AppLayout;

