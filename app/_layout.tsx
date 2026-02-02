// app/_layout.tsx
// Root Layout with AuthProvider

// ⚠️ CRITICAL: Crypto polyfills MUST be first imports for ethers.js to work
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from '@/stores/useStore';
import AnimatedSplash from '@/components/AnimatedSplash';
import { AuthProvider } from '@/contexts/AuthContext';

// Prevent auto-hide of native splash
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const colorScheme = useColorScheme();
  const { theme } = useStore();

  // Load fonts
  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowAnimatedSplash(false);
  };

  // Determine dark mode
  const systemIsDark = colorScheme === 'dark';
  const isDark = theme === 'system' ? systemIsDark : theme === 'dark';

  if (!appReady || !fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Animated Splash Screen */}
        {showAnimatedSplash && (
          <AnimatedSplash onFinish={handleSplashFinish} duration={5000} />
        )}

        {/* Main App Navigation */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            },
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
