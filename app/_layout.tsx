import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import "../global.css";
import dataSyncService from "../services/DataSyncService";
import notificationService from "../services/NotificationService";
import { ThemeProvider, useTheme } from "../utils/ThemeContext";

// Root layout component
export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<AuthProvider>
					<RootLayoutNav />
				</AuthProvider>
			</ThemeProvider>
		</SafeAreaProvider>
	);
}

// Navigation component with auth protection
function RootLayoutNav() {
	const { isAuthenticated, loading } = useAuth();
	const { isDarkMode } = useTheme();
	const router = useRouter();
	const segments = useSegments();

	// Load data when authenticated
	useEffect(() => {
		if (isAuthenticated) {
			dataSyncService.loadAllData();
			notificationService.scheduleRentReminders();
		}
	}, [isAuthenticated]);

	// Handle auth state changes
	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === "(auth)";

		if (!isAuthenticated && !inAuthGroup) {
			console.log("Redirecting to login");
			// Redirect to login if not authenticated
			router.replace("/(auth)/login");
		} else if (isAuthenticated && inAuthGroup) {
			console.log("Redirecting to home");
			// Redirect to home if authenticated
			router.replace("/(app)/(tabs)");
		}
	}, [isAuthenticated, loading, segments]);

	return (
		<>
			<StatusBar style={isDarkMode ? "light" : "dark"} />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				<Stack.Screen name="(app)" options={{ headerShown: false }} />
			</Stack>
		</>
	);
}
