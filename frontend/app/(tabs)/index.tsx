import { Colors } from "@/constants/colors";
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
  return (
    <ScrollView>
      <YStack padding={"$4"} gap={"$4"}>
        <Card
          elevate
          bordered
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          animation={"bouncy"}
        >
          <XStack gap={"$2"} alignItems="center" marginBottom={"$2"}>
            <Shield color={Colors.green[500]} />
            <Text>Helmet Status</Text>
          </XStack>

          <XStack justifyContent="space-between">
            <Text>Riding Status</Text>
            <Text>Idle</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text>Current Speed</Text>
            <Text>0 km/h</Text>
          </XStack>

          <XStack justifyContent="space-between">
            <Text>AI Detection</Text>
            <Text>Active</Text>
          </XStack>

          <XStack justifyContent="flex-end">
            <Text>Last update: </Text>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
          animation={"bouncy"}
        >
          <XStack gap={"$2"} alignItems="center">
            <Activity color={Colors.green[500]} />
            <Text>Real-Time Monitoring</Text>
          </XStack>

          <XStack gap={"$2"} alignItems="center" justifyContent="center">
            <Square
              backgroundColor={Colors.green[100]}
              paddingEnd={"$8"}
              padded
              radiused
            >
              <YStack gap={"$2"}>
                <Text>Acceleration</Text>
                <Text>Normal</Text>
              </YStack>
            </Square>
            <Square
              backgroundColor={Colors.green[100]}
              paddingEnd={"$8"}
              padded
              radiused
            >
              <YStack gap={"$2"}>
                <Text>Gyroscope</Text>
                <Text>Stable</Text>
              </YStack>
            </Square>
          </XStack>
          <XStack gap={"$2"} alignItems="center" justifyContent="center">
            <Square
              backgroundColor={Colors.green[100]}
              paddingEnd={"$8"}
              padded
              radiused
            >
              <YStack gap={"$2"}>
                <Text>Impact Level</Text>
                <Text>Low</Text>
              </YStack>
            </Square>
            <Square
              backgroundColor={Colors.green[100]}
              paddingEnd={"$8"}
              padded
              radiused
            >
              <YStack gap={"$2"}>
                <Text>GPS Signal</Text>
                <Text>Strong</Text>
              </YStack>
            </Square>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
        >
          <XStack gap={"$2"} alignItems="center">
            <AlertTriangle color={Colors.gray[200]} />
            <Text>
              Pre-alert warning enabled. You&apos;ll have 10 seconds to cancel
              false alarms.
            </Text>
          </XStack>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={Colors.green[200]}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
        >
          <XStack gap={"$2"} alignItems="center">
            <Send color={Colors.gray[200]} />
            <Text>Current Location</Text>
          </XStack>
          <Square backgroundColor={Colors.green[100]} padded radiused>
            <YStack gap={"$2"}>
              <XStack>
                <MapPin />
                <Text>Cebu City, Philippines</Text>
              </XStack>
            </YStack>
          </Square>
        </Card>

        <Card
          elevate
          bordered
          animation={"bouncy"}
          borderColor={Colors.red}
          padded
          gap={"$4"}
          enterStyle={{ opacity: 0, y: 10 }}
          opacity={1}
          y={0}
        >
          <YStack gap={"$4"}>
            <XStack justifyContent="center">
              <AlertTriangle color={Colors.red} size={"$4"} />
            </XStack>
            <Text textAlign="center" color={Colors.red}>
              Emergency SOS
            </Text>
            <Text textAlign="center">
              Press this button to manually send an emergency alert to your
              contacts
            </Text>
            <Button
              color={"white"}
              backgroundColor={Colors.red}
              pressStyle={{
                backgroundColor: Colors.red,
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
