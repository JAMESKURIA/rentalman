import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { House, Tenant, HouseBill } from '../../services/DatabaseService';

const HouseDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const { houseId, buildingId, buildingName } = route.params as { 
    houseId: number,
    buildingId?: number,
    buildingName?: string
  };
  
  const [house, setHouse] = useState<House | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bills, setBills] = useState<(HouseBill & { billType: string, billDate: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadHouseDetails = async () => {
      try {
        setLoading(true);
        
        // Load house details
        const houseData = await databaseService.getHouseById(houseId);
        setHouse(houseData);
        
        // Load tenants for this house
        const tenantsData = await databaseService.getTenantsByHouseId(houseId);
        setTenants(tenantsData);
        
        // Load bills for this house
        const billsData = await databaseService.getHouseBillsByHouseId(houseId);
        setBills(billsData);
      } catch (error) {
        console.error('Error loading house details:', error);
        Alert.alert('Error', 'Failed to load house details');
      } finally {
        setLoading(false);
      }
    };
    
    loadHouseDetails();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadHouseDetails);
    return unsubscribe;
  }, [houseId, navigation]);
  
  const handleDeleteHouse = () => {
    Alert.alert(
      'Delete House',
      `Are you sure you want to delete house ${house?.houseNumber}? This will also delete all tenant records associated with this house.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteHouse(houseId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting house:', error);
              Alert.alert('Error', 'Failed to delete house');
            }
          }
        },
      ]
    );
  };
  
  const getHouseTypeLabel = (type: string) => {
    switch (type) {
      case 'bedsitter': return 'Bedsitter';
      case 'single': return 'Single';
      case 'one-bedroom': return 'One Bedroom';
      case 'two-bedroom': return 'Two Bedroom';
      case 'own-compound': return 'Own Compound';
      default: return type;
    }
  };
  
  const getMeterTypeLabel = (type: string) => {
    switch (type) {
      case 'shared': return 'Shared Meter';
      case 'token': return 'Token Meter';
      case 'individual': return 'Individual Meter';
      default: return type;
    }
  };
  
  if (!house) {
    return (
      <Container>
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {loading ? 'Loading...' : 'House not found'}
        </Text>
      </Container>
    );
  }
  
  const activeTenant = tenants.find(tenant => tenant.isActive);
  
  return (
    <Container scrollable={false}>
      <ScrollView>
        {/* House Info Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <View className="flex-row items-center">
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {house.houseNumber}
                </Text>
                <View className={`ml-2 px-2 py-0.5 rounded-full ${house.isOccupied ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Text className={`text-xs ${house.isOccupied ? 'text-green-800' : 'text-yellow-800'}`}>
                    {house.isOccupied ? 'Occupied' : 'Vacant'}
                  </Text>
                </View>
              </View>
              {buildingName && (
                <Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Building: {buildingName}
                </Text>
              )}
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="p-2"
                onPress={handleDeleteHouse}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {/* House Details Card */}
        <Card className="mb-4" title="House Details">
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {getHouseTypeLabel(house.type)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Rent:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ${house.rentAmount.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Electricity Meter:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {getMeterTypeLabel(house.electricityMeterType)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Water Meter:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {getMeterTypeLabel(house.waterMeterType)}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Current Tenant Card */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Current Tenant
            </Text>
            <Button
              title="Add Tenant"
              onPress={() => navigation.navigate('AddTenant', { houseId, houseNumber: house.houseNumber })}
              icon={<Ionicons name="person-add" size={16} color="white" />}
              size="sm"
              disabled={!!activeTenant}
            />
          </View>
          
          {activeTenant ? (
            <Card
              onPress={() => navigation.navigate('TenantDetail', { 
                tenantId: activeTenant.id, 
                tenantName: activeTenant.name,
                houseId,
                houseNumber: house.houseNumber
              })}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {activeTenant.name}
                  </Text>
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activeTenant.phone}
                  </Text>
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Occupants: {activeTenant.occupants}
                  </Text>
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Move In: {new Date(activeTenant.moveInDate).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
            </Card>
          ) : (
            <Card>
              <View className="items-center py-4">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No active tenant
                </Text>
                <TouchableOpacity 
                  className="mt-2 flex-row items-center" 
                  onPress={() => navigation.navigate('AddTenant', { houseId, houseNumber: house.houseNumber })}
                >
                  <Ionicons name="person-add-outline" size={18} color="#3B82F6" />
                  <Text className="text-primary ml-1">Add Tenant</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
        
        {/* Tenant History */}
        {tenants.length > 1 && (
          <View className="mb-4">
            <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Tenant History
            </Text>
            
            {tenants
              .filter(tenant => !tenant.isActive)
              .map(tenant => (
                <Card
                  key={tenant.id}
                  className="mb-3"
                  onPress={() => navigation.navigate('TenantDetail', { 
                    tenantId: tenant.id, 
                    tenantName: tenant.name,
                    houseId,
                    houseNumber: house.houseNumber
                  })}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {tenant.name}
                      </Text>
                      <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(tenant.moveInDate).toLocaleDateString()} - {tenant.moveOutDate ? new Date(tenant.moveOutDate).toLocaleDateString() : 'Present'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  </View>
                </Card>
              ))}
          </View>
        )}
        
        {/* Recent Bills */}
        <View className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Recent Bills
          </Text>
          
          {bills.length > 0 ? (
            bills.slice(0, 3).map(bill => (
              <Card key={bill.id} className="mb-3">
                <View className="flex-row justify-between items-center">
                  <View>
                    <View className="flex-row items-center">
                      <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {bill.billType.charAt(0).toUpperCase() + bill.billType.slice(1)} Bill
                      </Text>
                      <View className={`ml-2 px-2 py-0.5 rounded-full ${bill.isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs ${bill.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                          {bill.isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                      </View>
                    </View>
                    <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date: {new Date(bill.billDate).toLocaleDateString()}
                    </Text>
                    <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Amount: ${bill.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View className="items-center py-4">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No bills found for this house
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

export default HouseDetailScreen;