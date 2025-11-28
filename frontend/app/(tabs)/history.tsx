import { Colors } from "@/constants/colors";
import { Activity, CheckCircle } from "@tamagui/lucide-icons";
import React from "react";
import { Card, ScrollView, Square, Text, XStack, YStack } from "tamagui";
const history = () => {
  return (
    <ScrollView>
      <YStack padding={"$4"}>
        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
        >
          <YStack gap={"$4"}>
            <XStack alignItems="center" gap={"$2"}>
              <Activity color={Colors.green[500]} />
              <Text>Alert History</Text>
            </XStack>
            <Card padded borderColor={Colors.gray[200]} bordered>
              <XStack gap={"$2"} alignItems="center">
                <CheckCircle color={Colors.gray[100]} />
                <Text>False Alarm</Text>
                <Square backgroundColor="#cec5c5ff" padding={"$1"} radiused>
                  <Text>Cancelled</Text>
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
