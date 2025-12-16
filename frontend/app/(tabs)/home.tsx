import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Activity,
  AlertTriangle,
  MapPin,
  Send,
  Shield,
  Mail,
  RefreshCw,
} from "@tamagui/lucide-icons";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  ScrollView,
  Square,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { RefreshControl } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/auth.service";

const home = () => {
  const colors = useThemeColors();
  const { isVerified, user, refreshUser } = useAuth();
  const toast = useToast();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSendVerificationEmail = async () => {
    if (!user?.email) {
      toast.showError("Error", "Email address not found");
      return;
    }

    if (cooldownSeconds > 0 || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await authService.sendVerificationEmail(user.email);
      toast.showSuccess("Email Sent", "Verification email has been sent to your inbox");
      setCooldownSeconds(300); // 5 minutes = 300 seconds
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to send verification email";
      toast.showError("Error", errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const formatCooldownTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      toast.showSuccess("Refreshed", "Page data has been updated");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to refresh data";
      toast.showError("Refresh Failed", errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <ScrollView 
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <YStack padding={"$4"} gap={"$4"}>
        {/* Refresh Button */}
        <XStack justifyContent="flex-end">
          <Button
            variant="outlined"
            borderWidth={1}
            borderColor={colors.border}
            backgroundColor={colors.cardBackground}
            onPress={handleRefresh}
            disabled={isRefreshing}
            opacity={isRefreshing ? 0.6 : 1}
            paddingHorizontal="$3"
            paddingVertical="$2"
          >
            <XStack gap={"$2"} alignItems="center">
              <RefreshCw 
                size={16} 
                color={colors.primary}
              />
              <Text color={colors.primary} fontSize={"$3"} fontWeight="500">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Text>
            </XStack>
          </Button>
        </XStack>

        {/* Verification Warning */}
        {!isVerified && (
          <Card
            elevate
            bordered
            borderColor={colors.red}
            padded
            gap={"$3"}
            enterStyle={{ opacity: 0, y: 10 }}
            animation={"bouncy"}
            backgroundColor={colors.cardBackground}
          >
            <XStack gap={"$2"} alignItems="center">
              <AlertTriangle color={colors.red} size={24} />
              <Text color={colors.red} fontWeight="bold" fontSize={"$5"}>
                Verification Required
              </Text>
            </XStack>
            <Text color={colors.text} fontSize={"$4"}>
              You must be verified before you can access all features.
            </Text>
            <YStack gap={"$2"} marginTop={"$2"}>
              <Text color={colors.gray[200]} fontSize={"$3"}>
                Didn't get an email? Send another one
              </Text>
              <Button
                backgroundColor={colors.primary}
                onPress={handleSendVerificationEmail}
                disabled={cooldownSeconds > 0 || isSending}
                opacity={cooldownSeconds > 0 || isSending ? 0.6 : 1}
              >
                <XStack gap={"$2"} alignItems="center">
                  <Mail size={16} color="#ffffff" />
                  <Text color="#ffffff" fontWeight="semibold">
                    {isSending
                      ? "Sending..."
                      : cooldownSeconds > 0
                      ? `Resend in ${formatCooldownTime(cooldownSeconds)}`
                      : "Send Verification Email"}
                  </Text>
                </XStack>
              </Button>
            </YStack>
          </Card>
        )}

        <Card
          elevate
          bordered
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          animation={"bouncy"}
          backgroundColor={colors.cardBackground}
        >
          <XStack gap={"$2"} alignItems="center" marginBottom={"$2"}>
            <Shield color={colors.primary} />
            <Text color={colors.text}>Helmet Status</Text>
          </XStack>

          <XStack justifyContent="space-between">
            <Text color={colors.text}>Riding Status</Text>
            <Text color={colors.text}>Idle</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text color={colors.text}>Current Speed</Text>
            <Text color={colors.text}>0 km/h</Text>
          </XStack>

          <XStack justifyContent="space-between">
            <Text color={colors.text}>AI Detection</Text>
            <Text color={colors.text}>Active</Text>
          </XStack>

          <XStack justifyContent="flex-end">
            <Text color={colors.text}>Last update: </Text>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          animation={"bouncy"}
          backgroundColor={colors.cardBackground}
        >
          <XStack gap={"$2"} alignItems="center">
            <Activity color={colors.primary} />
            <Text color={colors.text}>Real-Time Monitoring</Text>
          </XStack>

          <XStack gap={"$2"} alignItems="center" justifyContent="center">
            <Square
              backgroundColor={colors.background}
              paddingEnd={"$8"}
              padded
              radiused
              borderColor={colors.borderHover}
              bordered
            >
              <YStack gap={"$2"}>
                <Text color={colors.text}>Acceleration</Text>
                <Text color={colors.text}>Normal</Text>
              </YStack>
            </Square>
            <Square
              backgroundColor={colors.background}
              paddingEnd={"$8"}
              padded
              radiused
              borderColor={colors.borderHover}
              bordered
            >
              <YStack gap={"$2"}>
                <Text color={colors.text}>Gyroscope</Text>
                <Text color={colors.text}>Stable</Text>
              </YStack>
            </Square>
          </XStack>
          <XStack gap={"$2"} alignItems="center" justifyContent="center">
            <Square
              backgroundColor={colors.background}
              paddingEnd={"$8"}
              padded
              radiused
              borderColor={colors.borderHover}
              bordered
            >
              <YStack gap={"$2"}>
                <Text color={colors.text}>Impact Level</Text>
                <Text color={colors.text}>Low</Text>
              </YStack>
            </Square>
            <Square
              backgroundColor={colors.background}
              paddingEnd={"$8"}
              padded
              radiused
              borderColor={colors.borderHover}
              bordered
            >
              <YStack gap={"$2"}>
                <Text color={colors.text}>GPS Signal</Text>
                <Text color={colors.text}>Strong</Text>
              </YStack>
            </Square>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          backgroundColor={colors.cardBackground}
        >
          <XStack gap={"$2"} alignItems="flex-start">
            <AlertTriangle color={colors.gray[200]} size={20} style={{ marginTop: 2 }} />
            <Text color={colors.text} flex={1} flexShrink={1}>
              Pre-alert warning enabled. You&apos;ll have 10 seconds to cancel
              false alarms.
            </Text>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          backgroundColor={colors.cardBackground}
        >
          <XStack gap={"$2"} alignItems="center">
            <Send color={colors.gray[200]} />
            <Text color={colors.text}>Current Location</Text>
          </XStack>
          <Square backgroundColor={colors.background} padded radiused borderColor={colors.borderHover} bordered>
            <YStack gap={"$2"}>
              <XStack>
                <MapPin color={colors.text} />
                <Text color={colors.text}>Cebu City, Philippines</Text>
              </XStack>
            </YStack>
          </Square>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={colors.red}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap={"$4"}>
            <XStack justifyContent="center">
              <AlertTriangle color={colors.red} size={"$4"} />
            </XStack>
            <Text textAlign="center" color={colors.red}>
              Emergency SOS
            </Text>
            <Text textAlign="center" color={colors.text}>
              Press this button to manually send an emergency alert to your
              contacts
            </Text>
            <Button
              color={"white"}
              backgroundColor={colors.red}
              pressStyle={{
                backgroundColor: colors.red,
                scale: 0.98,
              }}
            >
              Send Emergency SOS
            </Button>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default home;
