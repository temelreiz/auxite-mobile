// app/(tabs)/trust/_layout.tsx
// Trust Center Stack Navigator

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useStore } from '@/stores/useStore';

export default function TrustLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useStore();
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="reserves" />
      <Stack.Screen name="audits" />
      <Stack.Screen name="custody" />
      <Stack.Screen name="supply" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
