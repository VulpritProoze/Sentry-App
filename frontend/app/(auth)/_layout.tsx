import { Stack } from "expo-router";
import React from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

const AuthLayout = () => {
  const colors = useThemeColors();

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
        name="login"
        options={{
          title: "Login",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
        }}
      />
    </Stack>
  );
};

export default AuthLayout;


