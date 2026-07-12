import { Stack } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PosProvider, usePos } from '../lib/pos-store';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isReady } = usePos();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <View style={styles.root}>
      <View style={styles.appWrapper}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#ffffff' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
          <Stack.Screen name="password" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <PosProvider>
      <RootLayoutNav />
    </PosProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 720 : undefined,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.05 : 0,
    shadowRadius: 20,
    elevation: 0,
  },
});
