import { History, Home, Settings, Users } from "@tamagui/lucide-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

const _layout = () => {
  const colors = useThemeColors();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[200],
        headerStyle: { backgroundColor: colors.green[400] },
        headerTintColor: "#ffffff",
        tabBarStyle: {
          backgroundColor: colors.background,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Sentry",
          headerTitleAlign: "center",
          tabBarIcon: () => <Home />,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          headerTitle: "Sentry",
          headerTitleAlign: "center",
          tabBarIcon: () => <Users />,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerTitle: "Sentry",
          headerTitleAlign: "center",
          tabBarIcon: () => <History />,
        }}
      ></Tabs.Screen>
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTitle: "Sentry",
          headerTitleAlign: "center",
          tabBarIcon: () => <Settings />,
        }}
      ></Tabs.Screen>
    </Tabs>
  );
};

export default _layout;
