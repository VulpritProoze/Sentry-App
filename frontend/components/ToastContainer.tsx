import React from 'react';
import { YStack, Text, XStack, Card } from 'tamagui';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@tamagui/lucide-icons';
import { useToast } from '@/context/ToastContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ToastContainer = () => {
  const { toasts, hideToast } = useToast();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const getIcon = (type: string) => {
    const iconSize = 20;
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color="white" />;
      case 'error':
        return <XCircle size={iconSize} color="white" />;
      case 'warning':
        return <AlertTriangle size={iconSize} color="white" />;
      default:
        return <Info size={iconSize} color="white" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return colors.green?.[600] || colors.green?.[500] || '#16a34a';
      case 'error':
        return colors.red || '#dc2626';
      case 'warning':
        return '#eab308';
      default:
        return colors.primary || '#22c55e';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <YStack
      position="absolute"
      top={insets.top + 8}
      left="$4"
      right="$4"
      zIndex={9999}
      gap="$2"
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          backgroundColor={getBackgroundColor(toast.type)}
          borderRadius="$4"
          padding="$3"
          enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
          exitStyle={{ opacity: 0, scale: 1, y: -20 }}
          opacity={1}
          scale={1}
          y={0}
          animation="bouncy"
          pointerEvents="auto"
        >
          <XStack gap="$2" alignItems="center" justifyContent="space-between">
            <XStack gap="$2" alignItems="center" flex={1}>
              {getIcon(toast.type)}
              <YStack gap="$1" flex={1}>
                <Text color="white" fontWeight="600" fontSize="$4">
                  {toast.title}
                </Text>
                {toast.message && (
                  <Text color="white" fontSize="$3" opacity={0.9}>
                    {toast.message}
                  </Text>
                )}
              </YStack>
            </XStack>
            <Pressable onPress={() => hideToast(toast.id)}>
              <X size={18} color="white" opacity={0.8} />
            </Pressable>
          </XStack>
        </Card>
      ))}
    </YStack>
  );
};

