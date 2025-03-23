import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import globalState, { selectors } from '../../../state';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import dataSyncService from '../../../services/DataSyncService';

export default function DashboardScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  
  // Load data on mount
  useEffect(() => {
    dataSyncService.loadAllData();
  }, []);
  
  // Get data from global state
  const buildings = globalState.buildings.get();
  const houses = globalState.houses.get();
  const tenants = globalState.tenants.get();
  const utilityBills = globalState.utilityBills.get();
  const arrears = selectors.getArrears();
  
  // Calculate statistics
  const totalBuildings = buildings.length;
  const totalHouses = houses.length;
  const occupiedHouses = houses.filter(h => h.isOccupied).length;
  const vacantHouses = totalHouses - occupiedHouses;
  const occupancyRate = totalHouses > 0 ? (occupiedHouses / totalHouses) * 100 : 0;
  const totalTenants = tenants.filter(t => t.isActive).length;
  const unpaidBills = utilityBills.filter(b => !b.isPaid).length;
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Dashboard
        </Text>
        <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome, {user?.name}
        </Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <Card className="w-[48%] mb-3">
            <View className="items-center">
              <Ionicons name="business" size={24} color="#3B82F6" />
              <Text className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {totalBuildings}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Buildings
              </Text>
            </View>
          </Card>
          
          <Card className="w-[48%] mb-3">
            <View className="items-center">
              <Ionicons name="home" size={24} color="#10B981" />
              <Text className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {totalHouses}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Houses
              </Text>
            </View>
          </Card>
          
          <Card className="w-[48%] mb-3">
            <View className="items-center">
              <Ionicons name="people" size={24} color="#F59E0B" />
              <Text className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {totalTenants}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Tenants
              </Text>
            </View>
          </Card>
          
          <Card className="w-[48%] mb-3">
            <View className="items-center">
              <Ionicons name="cash" size={24} color="#EF4444" />
              <Text className={`text-lg font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {unpaidBills}
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Unpaid Bills
              </Text>
            </View>
          </Card>
        </View>
        
        {/* Occupancy Card */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Occupancy
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Occupied Houses
            </Text>
            <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {occupiedHouses} / {totalHouses}
            </Text>
          </View>
          
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary"
              style={{ width: `${occupancyRate}%` }}
            />
          </View>
          
          <View className="flex-row justify-between mt-3">
            <View className="items-center">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {occupiedHouses}
              </Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Occupied
              </Text>
            </View>
            
            <View className="items-center">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {vacantHouses}
              </Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Vacant
              </Text>
            </View>
            
            <View className="items-center">
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {occupancyRate.toFixed(0)}%
              </Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Occupancy Rate
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Arrears Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Recent Arrears
            </Text>
            <Link href="/(app)/arrears" asChild>
              <Text className="text-primary text-sm">View All</Text>
            </Link>
          </View>
          
          {arrears.length > 0 ? (
            arrears.slice(0, 3).map((arrear, index) => (
              <View
                key={`${arrear.tenantId}-${arrear.billId}-${index}`}
                className={`py-2 ${
                  index < arrears.length - 1 ? `border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''
                }`}
              >
                <View className="flex-row justify-between">
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {arrear.tenantName}
                  </Text>
                  <Text className="text-red-500 font-medium">
                    ${arrear.amount.toFixed(2)}
                  </Text>
                </View>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {arrear.billType.charAt(0).toUpperCase() + arrear.billType.slice(1)} Bill - House {arrear.houseNumber}
                </Text>
              </View>
            ))
          ) : (
            <View className="py-4 items-center">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No arrears found
              </Text>
            </View>
          )}
        </Card>
        
        {/* Quick Actions Card */}
        <Card className="mb-4">
          <Text className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Quick Actions
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            <Link href="/(app)/buildings/add" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1">
                  <Ionicons name="business-outline" size={24} color="#3B82F6" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add Building
                </Text>
              </View>
            </Link>
            
            <Link href="/(app)/houses/add" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-1">
                  <Ionicons name="home-outline" size={24} color="#10B981" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add House
                </Text>
              </View>
            </Link>
            
            <Link href="/(app)/tenants/add" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-yellow-100 items-center justify-center mb-1">
                  <Ionicons name="person-add-outline" size={24} color="#F59E0B" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add Tenant
                </Text>
              </View>
            </Link>
            
            <Link href="/(app)/bills/add" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-1">
                  <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add Bill
                </Text>
              </View>
            </Link>
            
            <Link href="/(app)/services/add" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-1">
                  <Ionicons name="construct-outline" size={24} color="#6366F1" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add Service
                </Text>
              </View>
            </Link>
            
            <Link href="/(app)/import" asChild>
              <View className="w-[30%] items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center mb-1">
                  <Ionicons name="cloud-upload-outline" size={24} color="#EC4899" />
                </View>
                <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Import Data
                </Text>
              </View>
            </Link>
          </View>
        </Card>
      </ScrollView>
    </Container>
  );
}