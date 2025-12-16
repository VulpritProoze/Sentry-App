import { useThemeColors } from "@/hooks/useThemeColors";
import { Check, Eye, EyeOff, Lock, Mail, User } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Input,
  ScrollView,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { API_URL } from "@/lib/api";

const login = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    usernameOrEmail?: string;
    password?: string;
  }>({});

  const validateUsernameOrEmail = (value: string) => {
    if (!value.trim()) {
      return "Username or email is required";
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.includes("@") && !emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    return undefined;
  };

  const handleUsernameOrEmailChange = (value: string) => {
    setUsernameOrEmail(value);
    if (errors.usernameOrEmail) {
      const error = validateUsernameOrEmail(value);
      setErrors((prev) => ({
        ...prev,
        usernameOrEmail: error,
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      const error = validatePassword(value);
      setErrors((prev) => ({
        ...prev,
        password: error,
      }));
    }
  };

  const handleSubmit = async () => {
    const usernameOrEmailError = validateUsernameOrEmail(usernameOrEmail);
    const passwordError = validatePassword(password);

    if (usernameOrEmailError || passwordError) {
      setErrors({
        usernameOrEmail: usernameOrEmailError,
        password: passwordError,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determine if input is email or username
      const isEmail = usernameOrEmail.includes("@");
      const credentials = {
        email: isEmail ? usernameOrEmail : "",
        username: isEmail ? "" : usernameOrEmail,
        password,
      };

      // Pass rememberMe to the login function
      await login(credentials, rememberMe);
      toast.showSuccess("Success!", "Logged in successfully");
      // Navigate to home tab
      router.replace("/(tabs)/home");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Login failed. Please try again.";
      toast.showError("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"} gap={"$4"} maxWidth={600} alignSelf="center" width="100%">
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
            Login
          </Text>

          <YStack gap={"$3"}>
            <YStack gap={"$2"}>
              <Text color={colors.text}>Username or Email</Text>
              <XStack
                alignItems="center"
                borderWidth={1}
                borderColor={errors.usernameOrEmail ? colors.red : colors.border}
                backgroundColor={colors.background}
                borderRadius="$4"
                paddingLeft="$3"
                gap="$2"
              >
                {usernameOrEmail.includes("@") ? (
                  <Mail size={20} color={colors.gray[200]} />
                ) : (
                  <User size={20} color={colors.gray[200]} />
                )}
                <Input
                  placeholder="Enter username or email"
                  value={usernameOrEmail}
                  onChangeText={handleUsernameOrEmailChange}
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => {
                    const error = validateUsernameOrEmail(usernameOrEmail);
                    setErrors((prev) => ({
                      ...prev,
                      usernameOrEmail: error,
                    }));
                  }}
                />
              </XStack>
              {errors.usernameOrEmail && (
                <Text color={colors.red} fontSize={"$2"}>
                  {errors.usernameOrEmail}
                </Text>
              )}
            </YStack>

            <YStack gap={"$2"}>
              <Text color={colors.text}>Password</Text>
              <XStack
                alignItems="center"
                borderWidth={1}
                borderColor={errors.password ? colors.red : colors.border}
                backgroundColor={colors.background}
                borderRadius="$4"
                paddingLeft="$3"
                paddingRight="$2"
                gap="$2"
              >
                <Lock size={20} color={colors.gray[200]} />
                <Input
                  placeholder="Enter password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => {
                    const error = validatePassword(password);
                    setErrors((prev) => ({
                      ...prev,
                      password: error,
                    }));
                  }}
                />
                <Button
                  variant="outlined"
                  borderWidth={0}
                  backgroundColor="transparent"
                  padding="$2"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.gray[200]} />
                  ) : (
                    <Eye size={20} color={colors.gray[200]} />
                  )}
                </Button>
              </XStack>
              {errors.password && (
                <Text color={colors.red} fontSize={"$2"}>
                  {errors.password}
                </Text>
              )}
            </YStack>

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={"$2"} alignItems="center">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  borderColor={rememberMe ? colors.primary : colors.border}
                  backgroundColor={rememberMe ? colors.primary : colors.background}
                  size="$4"
                  borderWidth={2}
                >
                  <Checkbox.Indicator>
                    {rememberMe && <Check size={16} color="#ffffff" />}
                  </Checkbox.Indicator>
                </Checkbox>
                <Text color={colors.text} fontSize={"$3"}>
                  Remember me
                </Text>
              </XStack>

              <Button
                variant="outlined"
                borderWidth={0}
                backgroundColor="transparent"
                padding={0}
                onPress={handleForgotPassword}
              >
                <Text color={colors.primary} fontSize={"$3"}>
                  Forgot password?
                </Text>
              </Button>
            </XStack>

            <Button
              backgroundColor={colors.primary}
              onPress={handleSubmit}
              marginTop={"$2"}
              disabled={isLoading}
              opacity={isLoading ? 0.6 : 1}
            >
              <Text color="#ffffff" fontWeight="bold">
                {isLoading ? "Logging in..." : "Login"}
              </Text>
            </Button>

            <XStack justifyContent="center" alignItems="center" marginTop={"$3"} gap={"$2"}>
              <Text color={colors.text} fontSize={"$3"}>
                Don't have an account?
              </Text>
              <Button
                variant="outlined"
                borderWidth={0}
                backgroundColor="transparent"
                padding={0}
                onPress={() => router.push("/(auth)/register")}
              >
                <Text color={colors.primary} fontSize={"$3"} fontWeight="bold">
                  Register
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default login;

