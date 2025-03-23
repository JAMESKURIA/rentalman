import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { Tenant, House, Building, HouseBill } from '../../services/DatabaseService';

const TenantDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const { tenantId, houseId, houseNumber } = route.params as { 
    tenantId: number,
    houseId?: number,
    houseNumber?: string
  };
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [bills, setBills] = useState<(HouseBill & { billType: string, billDate: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTenantDetails = async () => {
      try {
        setLoading(true);
        
        // Load all tenants for the house to find the specific tenant
        const tenantsData = await databaseService.getTenantsByHouseId(houseId || 0);
        const tenantData = tenantsData.find(t => t.id === tenantId);
        
        if (tenantData) {
          setTenant(tenantData);
          
          // Load house details
          const houseData = await databaseService.getHouseById(tenantData.houseId);
          setHouse(houseData);
          
          if (houseData) {
            // Load building details
            const buildingData = await databaseService.getBuildingById(houseData.buildingId);
            setBuilding(buildingData);
            
            // Load bills for this house
            const billsData = await databaseService.getHouseBillsByHouseId(houseData.id!);
            setBills(billsData);
          }
        }
      } catch (error) {
        console.error('Error loading tenant details:', error);
        Alert.alert('Error', 'Failed to load tenant details');
      } finally {
        setLoading(false);
      }
    };
    
    loadTenantDetails();
  }, [tenantId, houseId]);
  
  const handleDeleteTenant = () => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete ${tenant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTenant(tenantId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting tenant:', error);
              Alert.alert('Error', 'Failed to delete tenant');
            }
          }
        },
      ]
    );
  };
  
  const handleEndTenancy = () => {
    Alert.alert(
      'End Tenancy',
      `Are you sure you want to end ${tenant?.name}'s tenancy?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Tenancy', 
          onPress: async () => {
            try {
              if (tenant) {
                const moveOutDate = new Date().toISOString().split('T')[0];
                
                await databaseService.updateTenant({
                  ...tenant,
                  moveOutDate,
                  isActive: false,
                });
                
                Alert.alert(
                  'Success',
                  'Tenancy ended successfully',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            } catch (error) {
              console.error('Error ending tenancy:', error);
              Alert.alert('Error', 'Failed to end tenancy');
            }
          }
        },
      ]
    );
  };
  
  if (!tenant) {
    return (
      <Container>
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {loading ? 'Loading...' : 'Tenant not found'}
        </Text>
      </Container>
    );
  }
  
  return (
    <Container scrollable={false}>
      <ScrollView>
        {/* Tenant Info Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <View className="flex-row items-center">
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {tenant.name}
                </Text>
                <View className={`ml-2 px-2 py-0.5 rounded-full ${tenant.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${tenant.isActive ? 'text-green-800' : 'text-gray-800'}`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {house?.houseNumber || houseNumber || 'Unknown House'}
                {building ? ` (${building.name})` : ''}
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="p-2"
                onPress={handleDeleteTenant}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {/* Tenant Details Card */}
        <Card className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Tenant Details
          </Text>
          
          <View className="mb-2">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {tenant.phone}
            </Text>
          </View>
          
          {tenant.email && (
            <View className="mb-2">
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</Text>
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {tenant.email}
              </Text>
            </View>
          )}
          
          <View className="mb-2">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Occupants</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {tenant.occupants}
            </Text>
          </View>
          
          <View className="mb-2">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Move-in Date</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {new Date(tenant.moveInDate).toLocaleDateString()}
            </Text>
          </View>
          
          {tenant.moveOutDate && (
            <View>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Move-out Date</Text>
              <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {new Date(tenant.moveOutDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>
        
        {/* House Details Card */}
        {house && (
          <Card 
            className="mb-4"
            onPress={() => navigation.navigate('HouseDetail', { 
              houseId: house.id, 
              houseNumber: house.houseNumber,
              buildingId: house.buildingId,
              buildingName: building?.name
            })}
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  House Details
                </Text>
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  House Number: {house.houseNumber}
                </Text>
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Type: {house.type.replace('-', ' ')}
                </Text>
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rent: ${house.rentAmount.toFixed(2)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
          </Card>
        )}
        
        {/* Recent Bills */}
        <View className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Recent Bills
          </Text>
          
          {bills.length > 0 ? (
            bills.slice(0, 3).map(bill => (
              <Card key={bill.id} className="mb-2">
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
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Date: {new Date(bill.billDate).toLocaleDateString()}
                    </Text>
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Amount: ${bill.amount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => {
                      // Mark bill as paid/unpaid
                      Alert.alert(
                        'Update Bill Status',
                        `Mark this bill as ${bill.isPaid ? 'unpaid' : 'paid'}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Update', 
                            onPress: async () => {
                              try {
                                await databaseService.updateHouseBill({
                                  ...bill,
                                  isPaid: !bill.isPaid
                                });
                                
                                // Update local state
                                setBills(bills.map(b => 
                                  b.id === bill.id ? { ...b, isPaid: !bill.isPaid } : b
                                ));
                              } catch (error) {
                                console.error('Error updating bill status:', error);
                                Alert.alert('Error', 'Failed to update bill status');
                              }
                            }
                          },
                        ]
                      );
                    }}
                  >
                    <Ionicons 
                      name={bill.isPaid ? 'checkmark-circle' : 'close-circle'} 
                      size={24} 
                      color={bill.isPaid ? '#10B981' : '#EF4444'} 
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View className="items-center py-4">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No bills for this tenant yet
                </Text>
              </View>
            </Card>
          )}
        </View>
        
        {/* Actions */}
        {tenant.isActive && (
          <Button
            title="End Tenancy"
            onPress={handleEndTenancy}
            variant="danger"
            size="lg"
            fullWidth
            className="mb-4"
          />
        )}
      </ScrollView>
    </Container>
  );
};

export default TenantDetailScreen;