// app/legal/_layout.tsx
// Legal Pages Stack Navigator

import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useStore } from '@/stores/useStore';

export default function LegalLayout() {
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
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="risk" />
      <Stack.Screen name="rwa-disclosure" />
    </Stack>
  );
}
