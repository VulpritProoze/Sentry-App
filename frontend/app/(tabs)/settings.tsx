import { useThemeColors } from "@/hooks/useThemeColors";
import { useThemeContext } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Moon, Palette, Settings, Sun, User, AlertTriangle } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Card, ScrollView, Text, XStack, YStack, Button, Input } from "tamagui";
import { Pressable, StyleSheet } from "react-native";
import { storeCrashAlertInterval, getStoredCrashAlertInterval } from "@/lib/storage";
import { CRASH_DETECTION_CONFIG } from "@/utils/constants";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const settings = () => {
  const colors = useThemeColors();
  const { themePreference, toggleTheme, activeTheme } = useThemeContext();
  const toast = useToast();
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [crashAlertInterval, setCrashAlertInterval] = useState<number>(
    CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds
  );
  const [intervalInput, setIntervalInput] = useState<string>(
    CRASH_DETECTION_CONFIG.crashAlertIntervalSeconds.toString()
  );
  const isDark = activeTheme === "dark";
  
  // Animated value for switch position (0 = left, 24 = right)
  const translateX = useSharedValue(isDark ? 24 : 0);

  // Load crash alert interval from storage
  useEffect(() => {
    const loadInterval = async () => {
      const stored = await getStoredCrashAlertInterval();
      if (stored) {
        setCrashAlertInterval(stored);
        setIntervalInput(stored.toString());
      }
    };
    loadInterval();
  }, []);

  // Update animation when theme changes
  useEffect(() => {
    translateX.value = withSpring(isDark ? 24 : 0, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
  }, [isDark, translateX]);

  // Animated style for the thumb
  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.showSuccess("Logged Out", "You have been successfully logged out");
      // Navigate to login page
      router.replace("/(auth)/login");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to logout. Please try again.";
      toast.showError("Logout Failed", errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleIntervalChange = async (value: string) => {
    setIntervalInput(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 300) {
      // Valid range: 1-300 seconds
      setCrashAlertInterval(numValue);
      try {
        await storeCrashAlertInterval(numValue);
        toast.showSuccess("Setting Saved", `Crash alert interval set to ${numValue} seconds`);
      } catch (error) {
        console.error("Error saving crash alert interval:", error);
        toast.showError("Save Failed", "Failed to save crash alert interval");
      }
    }
  };
  
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"} gap={"$4"}>
        {/* Profile Card - Topmost */}
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap={"$4"}>
            <XStack alignItems="center" gap={"$2"}>
              <User color={colors.primary} />
              <Text color={colors.text} fontSize={"$5"} fontWeight={"500"}>
                Profile
              </Text>
            </XStack>
            <Button
              onPress={() => router.push("/(app)/profile")}
              backgroundColor={colors.primary}
              color="white"
              fontWeight="600"
            >
              <User size={20} color="#ffffff" />
              <Text color="#ffffff" fontWeight="600" marginLeft="$2">
                View Profile
              </Text>
            </Button>
          </YStack>
        </Card>

        {/* App Settings Card - Contains Theme and Account */}
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap={"$4"}>
            <XStack alignItems="center" gap={"$2"}>
              <Settings color={colors.primary} />
              <Text color={colors.text} fontSize={"$6"} fontWeight={"600"}>
                App Settings
              </Text>
            </XStack>

            {/* Theme Section */}
            <YStack gap={"$3"} paddingTop={"$2"}>
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap={"$3"} flex={1}>
                  <Palette color={colors.primary} size={20} />
                  <YStack flex={1}>
                    <Text color={colors.text} fontSize={"$5"} fontWeight={"500"}>
                      Theme
                    </Text>
                    <Text color={colors.gray[200]} fontSize={"$3"}>
                      {themePreference === "system"
                        ? "System Default"
                        : isDark
                        ? "Dark Mode"
                        : "Light Mode"}
                    </Text>
                  </YStack>
                </XStack>
                <Pressable
                  onPress={toggleTheme}
                  style={[
                    styles.switchContainer,
                    {
                      backgroundColor: isDark ? colors.primary : colors.gray[200],
                    },
                  ]}
                >
                  <Animated.View style={[styles.switchThumb, animatedThumbStyle]}>
                    {isDark ? (
                      <Moon size={14} color={colors.primary} />
                    ) : (
                      <Sun size={14} color="#FFA500" />
                    )}
                  </Animated.View>
                </Pressable>
              </XStack>
            </YStack>

            {/* Divider */}
            <XStack
              height={1}
              backgroundColor={colors.border}
              marginVertical={"$2"}
            />

            {/* Crash Detection Section */}
            <YStack gap={"$3"}>
              <XStack alignItems="center" gap={"$2"}>
                <AlertTriangle color={colors.orange[500]} size={20} />
                <Text color={colors.text} fontSize={"$5"} fontWeight={"500"}>
                  Crash Detection
                </Text>
              </XStack>
              <YStack gap={"$2"}>
                <Text color={colors.gray[200]} fontSize={"$3"}>
                  Alert Interval (seconds)
                </Text>
                <Text color={colors.gray[300]} fontSize={"$2"}>
                  Minimum time between crash alert API calls. Prevents excessive requests.
                </Text>
                <Input
                  value={intervalInput}
                  onChangeText={handleIntervalChange}
                  keyboardType="numeric"
                  placeholder="15"
                  backgroundColor={colors.background}
                  borderColor={colors.border}
                  color={colors.text}
                  fontSize={"$4"}
                  paddingHorizontal={"$3"}
                  paddingVertical={"$2"}
                />
                <Text color={colors.gray[300]} fontSize={"$2"}>
                  Current: {crashAlertInterval} seconds (Range: 1-300)
                </Text>
              </YStack>
            </YStack>

            {/* Divider */}
            <XStack
              height={1}
              backgroundColor={colors.border}
              marginVertical={"$2"}
            />

            {/* Account Section */}
            <YStack gap={"$3"}>
              <XStack alignItems="center" gap={"$2"}>
                <LogOut color={colors.red} size={20} />
                <Text color={colors.text} fontSize={"$5"} fontWeight={"500"}>
                  Account
                </Text>
              </XStack>
              <Button
                onPress={handleLogout}
                backgroundColor={colors.red}
                color="white"
                fontWeight="600"
                disabled={isLoggingOut}
                opacity={isLoggingOut ? 0.6 : 1}
              >
                <LogOut size={20} color="#ffffff" />
                <Text color="#ffffff" fontWeight="600">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Text>
              </Button>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 4,
    position: "relative",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default settings;
