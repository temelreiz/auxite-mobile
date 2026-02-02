// app/(auth)/_layout.tsx
// Auth Stack Navigator

import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useStore } from '@/stores/useStore';

export default function AuthLayout() {
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
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
