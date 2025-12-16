import { useThemeColors } from "@/hooks/useThemeColors";
import {
  Activity,
  AlertTriangle,
  MapPin,
  Send,
  Shield,
} from "@tamagui/lucide-icons";
import React from "react";
import {
  Button,
  Card,
  ScrollView,
  Square,
  Text,
  XStack,
  YStack,
} from "tamagui";

const index = () => {
  const colors = useThemeColors();
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"} gap={"$4"}>
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

export default index;
