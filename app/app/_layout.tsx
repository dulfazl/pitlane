import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroAnimation } from '../src/components/IntroAnimation';
import { SessionProvider } from '../src/session';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(true);
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          />
          {showIntro ? <IntroAnimation onDone={() => setShowIntro(false)} /> : null}
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
