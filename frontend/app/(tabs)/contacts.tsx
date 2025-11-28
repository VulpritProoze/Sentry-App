import { Colors } from "@/constants/colors";
import { Plus, Users } from "@tamagui/lucide-icons";
import React from "react";
import { Button, Card, ScrollView, Text, XStack, YStack } from "tamagui";
const contacts = () => {
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
          <XStack justifyContent="space-between">
            <XStack gap={"$2"} alignItems="center">
              <Users color={Colors.green[500]} />
              <Text>Emergency Contacts</Text>
            </XStack>
            <Button backgroundColor={Colors.green[500]}>
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
