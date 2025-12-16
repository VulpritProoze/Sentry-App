import { useThemeColors } from "@/hooks/useThemeColors";
import { Activity, CheckCircle } from "@tamagui/lucide-icons";
import React from "react";
import { Card, ScrollView, Square, Text, XStack, YStack } from "tamagui";
const history = () => {
  const colors = useThemeColors();
  
  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <YStack padding={"$4"}>
        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={colors.border}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          backgroundColor={colors.cardBackground}
        >
          <YStack gap={"$4"}>
            <XStack alignItems="center" gap={"$2"}>
              <Activity color={colors.primary} />
              <Text color={colors.text}>Alert History</Text>
            </XStack>
            <Card padded borderColor={colors.border} bordered backgroundColor={colors.cardBackground}>
              <XStack gap={"$2"} alignItems="center">
                <CheckCircle color={colors.gray[100]} />
                <Text color={colors.text}>False Alarm</Text>
                <Square backgroundColor={colors.gray[100]} padding={"$1"} radiused>
                  <Text color={colors.text}>Cancelled</Text>
                </Square>
              </XStack>
            </Card>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default history;
