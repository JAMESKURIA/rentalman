import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './utils/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { enableReactTracking } from '@legendapp/state/react';

// Enable React tracking for automatic re-renders
enableReactTracking({
  auto: true,
});

// Import expo-router
import { Slot } from 'expo-router';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}