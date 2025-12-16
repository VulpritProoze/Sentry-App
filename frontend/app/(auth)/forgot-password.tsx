import { useThemeColors } from "@/hooks/useThemeColors";
import { ArrowLeft, Mail } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  ScrollView,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/errorUtils";
import { authService } from "@/services/auth.service";

const ForgotPassword = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      const error = validateEmail(value);
      setErrors((prev) => ({
        ...prev,
        email: error,
      }));
    }
  };

  const handleSubmit = async () => {
    const emailError = validateEmail(email);

    if (emailError) {
      setErrors({
        email: emailError,
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      toast.showSuccess("Email Sent!", "Please check your email for password reset instructions.");
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.showError("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"} gap={"$4"} maxWidth={600} alignSelf="center" width="100%">
        <Button
          variant="outlined"
          borderWidth={0}
          backgroundColor="transparent"
          padding="$2"
          alignSelf="flex-start"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Button>

        <Card
          elevate
          bordered
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          animation={"bouncy"}
          backgroundColor={colors.cardBackground}
        >
          <Text fontSize={"$8"} fontWeight="bold" color={colors.text} marginBottom={"$2"}>
            Forgot Password
          </Text>

          {!isSubmitted ? (
            <>
              <Text color={colors.gray[200]} fontSize={"$4"} marginBottom={"$2"}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              <YStack gap={"$3"}>
                <YStack gap={"$2"}>
                  <Text color={colors.text}>Email</Text>
                  <XStack
                    alignItems="center"
                    borderWidth={1}
                    borderColor={errors.email ? colors.red : colors.border}
                    backgroundColor={colors.background}
                    borderRadius="$4"
                    paddingLeft="$3"
                    gap="$2"
                  >
                    <Mail size={20} color={colors.gray[200]} />
                    <Input
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={handleEmailChange}
                      borderWidth={0}
                      flex={1}
                      backgroundColor="transparent"
                      color={colors.text}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onBlur={() => {
                        const error = validateEmail(email);
                        setErrors((prev) => ({
                          ...prev,
                          email: error,
                        }));
                      }}
                    />
                  </XStack>
                  {errors.email && (
                    <Text color={colors.red} fontSize={"$2"}>
                      {errors.email}
                    </Text>
                  )}
                </YStack>

                <Button
                  backgroundColor={colors.primary}
                  onPress={handleSubmit}
                  marginTop={"$2"}
                  disabled={isLoading}
                  opacity={isLoading ? 0.6 : 1}
                >
                  <Text color="#ffffff" fontWeight="bold">
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Text>
                </Button>
              </YStack>
            </>
          ) : (
            <YStack gap={"$4"} alignItems="center">
              <YStack
                width={80}
                height={80}
                borderRadius="$12"
                backgroundColor={colors.green[400]}
                justifyContent="center"
                alignItems="center"
              >
                <Mail size={40} color="#ffffff" />
              </YStack>
              <Text fontSize={"$6"} fontWeight="bold" color={colors.text} textAlign="center">
                Check Your Email
              </Text>
              <Text color={colors.gray[200]} fontSize={"$4"} textAlign="center">
                We've sent a password reset link to{" "}
                <Text fontWeight="bold" color={colors.text}>
                  {email}
                </Text>
              </Text>
              <Text color={colors.gray[200]} fontSize={"$3"} textAlign="center" marginTop={"$2"}>
                Please check your inbox and follow the instructions to reset your password.
              </Text>
              <Button
                backgroundColor={colors.primary}
                onPress={() => router.replace("/(auth)/login")}
                marginTop={"$4"}
              >
                <Text color="#ffffff" fontWeight="bold">
                  Back to Login
                </Text>
              </Button>
            </YStack>
          )}

          <XStack justifyContent="center" alignItems="center" marginTop={"$3"} gap={"$2"}>
            <Text color={colors.text} fontSize={"$3"}>
              Remember your password?
            </Text>
            <Button
              variant="outlined"
              borderWidth={0}
              backgroundColor="transparent"
              padding={0}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text color={colors.primary} fontSize={"$3"} fontWeight="bold">
                Login
              </Text>
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default ForgotPassword;

