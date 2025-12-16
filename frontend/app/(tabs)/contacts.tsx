import { useThemeColors } from "@/hooks/useThemeColors";
import { Plus, Users } from "@tamagui/lucide-icons";
import React from "react";
import { Button, Card, ScrollView, Text, XStack, YStack } from "tamagui";
const contacts = () => {
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
          <XStack justifyContent="space-between">
            <XStack gap={"$2"} alignItems="center">
              <Users color={colors.primary} />
              <Text color={colors.text}>Emergency Contacts</Text>
            </XStack>
            <Button backgroundColor={colors.primary}>
              <Plus color="#ffffff" />
              <Text color="#ffffff">Add</Text>
            </Button>
          </XStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default contacts;
