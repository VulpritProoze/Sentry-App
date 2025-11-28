import { Colors } from "@/constants/colors";
import { History, Home, Settings, Users } from "@tamagui/lucide-icons";
import { Tabs } from "expo-router";
import React from "react";
const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.green[500],
        tabBarInactiveTintColor: Colors.gray[200],
        headerStyle: { backgroundColor: Colors.green[400] },
        headerTintColor: "#ffffffff",
        sceneStyle: {
          backgroundColor: Colors.green[100],
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
