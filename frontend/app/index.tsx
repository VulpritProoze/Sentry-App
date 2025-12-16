import { useThemeColors } from "@/hooks/useThemeColors";
import { Home, LogIn, Shield, UserPlus } from "@tamagui/lucide-icons";
import { useRouter, Redirect } from "expo-router";
import React from "react";
import {
  Button,
  ScrollView,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useAuth } from "@/context/AuthContext";

const LandingPage = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();

  // Redirect authenticated users to home
  if (!isInitializing && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  // Show loading state while checking auth
  if (isInitializing) {
    return null; // or a loading spinner
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding={"$6"}
        gap={"$6"}
        minHeight="100%"
      >
        {/* Logo Section */}
        <YStack alignItems="center" gap={"$4"} marginTop={"$8"}>
          <YStack
            width={120}
            height={120}
            borderRadius="$12"
            backgroundColor={colors.primary}
            justifyContent="center"
            alignItems="center"
            elevation={8}
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.3}
            shadowRadius={8}
          >
            <Shield size={64} color="#ffffff" />
          </YStack>
          <Text fontSize={"$10"} fontWeight="bold" color={colors.text}>
            Sentry
          </Text>
          <Text
            fontSize={"$5"}
            color={colors.gray[200]}
            textAlign="center"
            maxWidth={300}
          >
            Your intelligent safety companion for motorcycle riders
          </Text>
        </YStack>

        {/* Features Section */}
        <YStack gap={"$3"} width="100%" maxWidth={400} marginTop={"$4"}>
          <XStack gap={"$3"} alignItems="center">
            <Shield size={24} color={colors.primary} />
            <Text color={colors.text} fontSize={"$4"}>
              Real-time helmet detection
            </Text>
          </XStack>
          <XStack gap={"$3"} alignItems="center">
            <Shield size={24} color={colors.primary} />
            <Text color={colors.text} fontSize={"$4"}>
              Emergency contact management
            </Text>
          </XStack>
          <XStack gap={"$3"} alignItems="center">
            <Shield size={24} color={colors.primary} />
            <Text color={colors.text} fontSize={"$4"}>
              Ride history tracking
            </Text>
          </XStack>
        </YStack>

        {/* Action Buttons */}
        <YStack gap={"$3"} width="100%" maxWidth={400} marginTop={"$6"}>
          <Button
            backgroundColor={colors.primary}
            onPress={() => router.push("/(auth)/login")}
            size="$4"
            borderRadius="$4"
          >
            <LogIn size={20} color="#ffffff" />
            <Text color="#ffffff" fontWeight="bold" fontSize={"$5"}>
              Login
            </Text>
          </Button>

          <Button
            backgroundColor={colors.cardBackground}
            borderWidth={2}
            borderColor={colors.primary}
            onPress={() => router.push("/(auth)/register")}
            size="$4"
            borderRadius="$4"
          >
            <UserPlus size={20} color={colors.primary} />
            <Text color={colors.primary} fontWeight="bold" fontSize={"$5"}>
              Register
            </Text>
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default LandingPage;

