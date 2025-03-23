import { Stack } from 'expo-router';
import { useTheme } from '../../utils/ThemeContext';

export default function AppLayout() {
  const { isDarkMode } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buildings/add" options={{ title: 'Add Building' }} />
      <Stack.Screen name="buildings/[id]" options={{ title: 'Building Details' }} />
      <Stack.Screen name="houses/add" options={{ title: 'Add House' }} />
      <Stack.Screen name="houses/[id]" options={{ title: 'House Details' }} />
      <Stack.Screen name="tenants/add" options={{ title: 'Add Tenant' }} />
      <Stack.Screen name="tenants/[id]" options={{ title: 'Tenant Details' }} />
      <Stack.Screen name="bills/add" options={{ title: 'Add Utility Bill' }} />
      <Stack.Screen name="bills/[id]" options={{ title: 'Bill Details' }} />
      <Stack.Screen name="houseTypes/index" options={{ title: 'House Types' }} />
      <Stack.Screen name="houseTypes/add" options={{ title: 'Add House Type' }} />
      <Stack.Screen name="houseTypes/[id]" options={{ title: 'Edit House Type' }} />
      <Stack.Screen name="serviceProviders/index" options={{ title: 'Service Providers' }} />
      <Stack.Screen name="serviceProviders/add" options={{ title: 'Add Service Provider' }} />
      <Stack.Screen name="serviceProviders/[id]" options={{ title: 'Service Provider Details' }} />
      <Stack.Screen name="services/add" options={{ title: 'Add Service' }} />
      <Stack.Screen name="services/[id]" options={{ title: 'Service Details' }} />
      <Stack.Screen name="import/index" options={{ title: 'Import Data' }} />
      <Stack.Screen name="reminders/index" options={{ title: 'Rent Reminders' }} />
    </Stack>
  );
}