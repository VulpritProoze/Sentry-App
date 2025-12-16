import { useThemeColors } from "@/hooks/useThemeColors";
import { useThemeContext } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { Moon, Palette, Settings, Sun } from "@tamagui/lucide-icons";
import React, { useEffect } from "react";
import { Card, ScrollView, Text, XStack, YStack, Button } from "tamagui";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const settings = () => {
  const colors = useThemeColors();
  const { themePreference, toggleTheme, activeTheme } = useThemeContext();
  const toast = useToast();
  const isDark = activeTheme === "dark";
  
  // Animated value for switch position (0 = left, 24 = right)
  const translateX = useSharedValue(isDark ? 24 : 0);

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
  
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"} gap={"$4"}>
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
          </YStack>
        </Card>

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
        </Card>

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
              <Text color={colors.text} fontSize={"$5"} fontWeight={"500"}>
                Test Toast Notifications
              </Text>
            </XStack>
            <YStack gap={"$3"}>
              <Button
                onPress={() => toast.showSuccess("Success!", "Operation completed successfully")}
                backgroundColor={colors.green?.[500] || colors.primary}
                color="white"
                fontWeight="600"
              >
                Show Success Toast
              </Button>
              <Button
                onPress={() => toast.showError("Error!", "Something went wrong")}
                backgroundColor={colors.red}
                color="white"
                fontWeight="600"
              >
                Show Error Toast
              </Button>
              <Button
                onPress={() => toast.showInfo("Information", "Here is some useful information")}
                backgroundColor={colors.primary}
                color="white"
                fontWeight="600"
              >
                Show Info Toast
              </Button>
              <Button
                onPress={() => toast.showWarning("Warning!", "Please be careful")}
                backgroundColor="#eab308"
                color="white"
                fontWeight="600"
              >
                Show Warning Toast
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
