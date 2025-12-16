import { useThemeColors } from "@/hooks/useThemeColors";
import { Eye, EyeOff, Lock, Mail, User } from "@tamagui/lucide-icons";
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
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/errorUtils";
import zxcvbn from "zxcvbn";

const register = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    middle_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
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

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    // Check against common passwords using zxcvbn
    const result = zxcvbn(value);
    if (result.score < 2) {
      return "Password is too weak or too common. Please choose a stronger password.";
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return "Please confirm your password";
    }
    if (value !== formData.password) {
      return "Passwords do not match";
    }
    return undefined;
  };

  const validateRequired = (value: string, fieldName: string) => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    return undefined;
  };

  const validateUsername = (value: string) => {
    if (!value.trim()) {
      return "Username is required";
    }
    if (value.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return undefined;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      let error: string | undefined;
      switch (field) {
        case "email":
          error = validateEmail(value);
          break;
        case "password":
          error = validatePassword(value);
          // Also revalidate confirm password if it exists
          if (formData.confirmPassword) {
            const confirmError = validateConfirmPassword(formData.confirmPassword);
            setErrors((prev) => ({
              ...prev,
              confirmPassword: confirmError,
            }));
          }
          break;
        case "confirmPassword":
          error = validateConfirmPassword(value);
          break;
        case "username":
          error = validateUsername(value);
          break;
        case "first_name":
          error = validateRequired(value, "First name");
          break;
        case "last_name":
          error = validateRequired(value, "Last name");
          break;
        case "middle_name":
          error = undefined; // Optional field
          break;
        default:
          error = undefined;
      }
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleBlur = (field: string) => {
    let error: string | undefined;
    const value = formData[field as keyof typeof formData];
    switch (field) {
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value);
        break;
      case "username":
        error = validateUsername(value);
        break;
      case "first_name":
        error = validateRequired(value, "First name");
        break;
      case "last_name":
        error = validateRequired(value, "Last name");
        break;
      case "middle_name":
        error = undefined; // Optional field
        break;
      default:
        error = undefined;
    }
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword),
      first_name: validateRequired(formData.first_name, "First name"),
      last_name: validateRequired(formData.last_name, "Last name"),
      middle_name: undefined, // Optional
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== undefined)) {
      return;
    }

    setIsLoading(true);
    try {
      await register(
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name || undefined,
        },
        true // rememberMe
      );
      toast.showSuccess("Success!", "Account created successfully! Please verify your email.");
      // Navigate to home tab
      router.replace("/(tabs)/home");
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.showError("Registration Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            Register
          </Text>

          <YStack gap={"$3"}>
            <YStack gap={"$2"}>
              <Text color={colors.text}>Username *</Text>
              <XStack
                alignItems="center"
                borderWidth={1}
                borderColor={errors.username ? colors.red : colors.border}
                backgroundColor={colors.background}
                borderRadius="$4"
                paddingLeft="$3"
                gap="$2"
              >
                <User size={20} color={colors.gray[200]} />
                <Input
                  placeholder="Enter username"
                  value={formData.username}
                  onChangeText={(value) => handleFieldChange("username", value)}
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => handleBlur("username")}
                />
              </XStack>
              {errors.username && (
                <Text color={colors.red} fontSize={"$2"}>
                  {errors.username}
                </Text>
              )}
            </YStack>

            <YStack gap={"$2"}>
              <Text color={colors.text}>Email *</Text>
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
                  placeholder="Enter email"
                  value={formData.email}
                  onChangeText={(value) => handleFieldChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => handleBlur("email")}
                />
              </XStack>
              {errors.email && (
                <Text color={colors.red} fontSize={"$2"}>
                  {errors.email}
                </Text>
              )}
            </YStack>

            <YStack gap={"$2"}>
              <Text color={colors.text}>Password *</Text>
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
                  value={formData.password}
                  onChangeText={(value) => handleFieldChange("password", value)}
                  secureTextEntry={!showPassword}
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => handleBlur("password")}
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

            <YStack gap={"$2"}>
              <Text color={colors.text}>Confirm Password *</Text>
              <XStack
                alignItems="center"
                borderWidth={1}
                borderColor={errors.confirmPassword ? colors.red : colors.border}
                backgroundColor={colors.background}
                borderRadius="$4"
                paddingLeft="$3"
                paddingRight="$2"
                gap="$2"
              >
                <Lock size={20} color={colors.gray[200]} />
                <Input
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleFieldChange("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                  borderWidth={0}
                  flex={1}
                  backgroundColor="transparent"
                  color={colors.text}
                  onBlur={() => handleBlur("confirmPassword")}
                />
                <Button
                  variant="outlined"
                  borderWidth={0}
                  backgroundColor="transparent"
                  padding="$2"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.gray[200]} />
                  ) : (
                    <Eye size={20} color={colors.gray[200]} />
                  )}
                </Button>
              </XStack>
              {errors.confirmPassword && (
                <Text color={colors.red} fontSize={"$2"}>
                  {errors.confirmPassword}
                </Text>
              )}
            </YStack>

            <XStack gap={"$3"}>
              <YStack gap={"$2"} flex={1}>
                <Text color={colors.text}>First Name *</Text>
                <Input
                  placeholder="First name"
                  value={formData.first_name}
                  onChangeText={(value) => handleFieldChange("first_name", value)}
                  borderColor={errors.first_name ? colors.red : colors.border}
                  backgroundColor={colors.background}
                  color={colors.text}
                  onBlur={() => handleBlur("first_name")}
                />
                {errors.first_name && (
                  <Text color={colors.red} fontSize={"$2"}>
                    {errors.first_name}
                  </Text>
                )}
              </YStack>

              <YStack gap={"$2"} flex={1}>
                <Text color={colors.text}>Last Name *</Text>
                <Input
                  placeholder="Last name"
                  value={formData.last_name}
                  onChangeText={(value) => handleFieldChange("last_name", value)}
                  borderColor={errors.last_name ? colors.red : colors.border}
                  backgroundColor={colors.background}
                  color={colors.text}
                  onBlur={() => handleBlur("last_name")}
                />
                {errors.last_name && (
                  <Text color={colors.red} fontSize={"$2"}>
                    {errors.last_name}
                  </Text>
                )}
              </YStack>
            </XStack>

            <YStack gap={"$2"}>
              <Text color={colors.text}>Middle Name (Optional)</Text>
              <Input
                placeholder="Middle name"
                value={formData.middle_name}
                onChangeText={(value) => handleFieldChange("middle_name", value)}
                borderColor={colors.border}
                backgroundColor={colors.background}
                color={colors.text}
              />
            </YStack>

            <Button
              backgroundColor={colors.primary}
              onPress={handleSubmit}
              marginTop={"$2"}
              disabled={isLoading}
              opacity={isLoading ? 0.6 : 1}
            >
              <Text color="#ffffff" fontWeight="bold">
                {isLoading ? "Registering..." : "Register"}
              </Text>
            </Button>

            <XStack justifyContent="center" alignItems="center" marginTop={"$3"} gap={"$2"}>
              <Text color={colors.text} fontSize={"$3"}>
                Already have an account?
              </Text>
              <Button
                variant="outlined"
                borderWidth={0}
                backgroundColor="transparent"
                padding={0}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text color={colors.primary} fontSize={"$3"} fontWeight="bold">
                  Login
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default register;

