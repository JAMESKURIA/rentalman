import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import BuildingsScreen from '../screens/buildings/BuildingsScreen';
import BuildingDetailScreen from '../screens/buildings/BuildingDetailScreen';
import AddBuildingScreen from '../screens/buildings/AddBuildingScreen';
import HousesScreen from '../screens/houses/HousesScreen';
import HouseDetailScreen from '../screens/houses/HouseDetailScreen';
import AddHouseScreen from '../screens/houses/AddHouseScreen';
import TenantsScreen from '../screens/tenants/TenantsScreen';
import TenantDetailScreen from '../screens/tenants/TenantDetailScreen';
import AddTenantScreen from '../screens/tenants/AddTenantScreen';
import UtilityBillsScreen from '../screens/bills/UtilityBillsScreen';
import AddUtilityBillScreen from '../screens/bills/AddUtilityBillScreen';
import UtilityBillDetailScreen from '../screens/bills/UtilityBillDetailScreen';
import ArrearsScreen from '../screens/ArrearsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Stack navigators
const AuthStack = createNativeStackNavigator();
const BuildingStack = createNativeStackNavigator();
const HouseStack = createNativeStackNavigator();
const TenantStack = createNativeStackNavigator();
const BillStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// Building Navigator
const BuildingNavigator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <BuildingStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      }}
    >
      <BuildingStack.Screen name="Buildings" component={BuildingsScreen} />
      <BuildingStack.Screen name="BuildingDetail" component={BuildingDetailScreen} options={({ route }) => ({ title: (route.params as any)?.buildingName || 'Building Details' })} />
      <BuildingStack.Screen name="AddBuilding" component={AddBuildingScreen} options={{ title: 'Add Building' }} />
      <BuildingStack.Screen name="Houses" component={HousesScreen} options={({ route }) => ({ title: (route.params as any)?.buildingName || 'Houses' })} />
      <BuildingStack.Screen name="HouseDetail" component={HouseDetailScreen} options={({ route }) => ({ title: (route.params as any)?.houseNumber || 'House Details' })} />
      <BuildingStack.Screen name="AddHouse" component={AddHouseScreen} options={{ title: 'Add House' }} />
      <BuildingStack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: (route.params as any)?.tenantName || 'Tenant Details' })} />
      <BuildingStack.Screen name="AddTenant" component={AddTenantScreen} options={{ title: 'Add Tenant' }} />
      <BuildingStack.Screen name="UtilityBills" component={UtilityBillsScreen} options={{ title: 'Utility Bills' }} />
      <BuildingStack.Screen name="AddUtilityBill" component={AddUtilityBillScreen} options={{ title: 'Add Utility Bill' }} />
      <BuildingStack.Screen name="UtilityBillDetail" component={UtilityBillDetailScreen} options={({ route }) => ({ title: (route.params as any)?.billType || 'Bill Details' })} />
    </BuildingStack.Navigator>
  );
};

// House Navigator
const HouseNavigator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <HouseStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      }}
    >
      <HouseStack.Screen name="AllHouses" component={HousesScreen} options={{ title: 'Houses' }} />
      <HouseStack.Screen name="HouseDetail" component={HouseDetailScreen} options={({ route }) => ({ title: (route.params as any)?.houseNumber || 'House Details' })} />
      <HouseStack.Screen name="AddHouse" component={AddHouseScreen} options={{ title: 'Add House' }} />
      <HouseStack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: (route.params as any)?.tenantName || 'Tenant Details' })} />
      <HouseStack.Screen name="AddTenant" component={AddTenantScreen} options={{ title: 'Add Tenant' }} />
    </HouseStack.Navigator>
  );
};

// Tenant Navigator
const TenantNavigator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <TenantStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      }}
    >
      <TenantStack.Screen name="AllTenants" component={TenantsScreen} options={{ title: 'Tenants' }} />
      <TenantStack.Screen name="TenantDetail" component={TenantDetailScreen} options={({ route }) => ({ title: (route.params as any)?.tenantName || 'Tenant Details' })} />
      <TenantStack.Screen name="AddTenant" component={AddTenantScreen} options={{ title: 'Add Tenant' }} />
      <TenantStack.Screen name="HouseDetail" component={HouseDetailScreen} options={({ route }) => ({ title: (route.params as any)?.houseNumber || 'House Details' })} />
    </TenantStack.Navigator>
  );
};

// Bill Navigator
const BillNavigator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <BillStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      }}
    >
      <BillStack.Screen name="AllBills" component={UtilityBillsScreen} options={{ title: 'Utility Bills' }} />
      <BillStack.Screen name="AddUtilityBill" component={AddUtilityBillScreen} options={{ title: 'Add Utility Bill' }} />
      <BillStack.Screen name="UtilityBillDetail" component={UtilityBillDetailScreen} options={({ route }) => ({ title: (route.params as any)?.billType || 'Bill Details' })} />
      <BillStack.Screen name="BuildingDetail" component={BuildingDetailScreen} options={({ route }) => ({ title: (route.params as any)?.buildingName || 'Building Details' })} />
    </BillStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Buildings') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Houses') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tenants') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Bills') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Arrears') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Buildings" component={BuildingNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Houses" component={HouseNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Tenants" component={TenantNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Bills" component={BillNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Arrears" component={ArrearsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  
  if (isLoading) {
    // You could return a loading screen here
    return null;
  }
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;