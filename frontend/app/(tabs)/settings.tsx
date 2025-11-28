import { Colors } from "@/constants/colors";
import { Settings } from "@tamagui/lucide-icons";
import React from "react";
import { Card, ScrollView, Text, XStack, YStack } from "tamagui";
const settings = () => {
  return (
    <ScrollView>
      <YStack padding={"$4"}>
        <Card
          elevate
          bordered
          animation="bouncy"
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
        >
          <YStack>
            <XStack alignItems="center">
              <Settings color={Colors.green[500]} />
              <Text>App Settings</Text>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
};

export default settings;
