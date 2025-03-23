import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { UtilityBill, HouseBill, House, Tenant } from '../../services/DatabaseService';

const UtilityBillDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const { billId, buildingId, buildingName } = route.params as { 
    billId: number,
    buildingId?: number,
    buildingName?: string
  };
  
  const [bill, setBill] = useState<UtilityBill | null>(null);
  const [houseBills, setHouseBills] = useState<(HouseBill & { 
    houseNumber?: string, 
    tenantName?: string,
    occupants?: number
  })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadBillDetails = async () => {
      try {
        setLoading(true);
        
        // Load utility bill details
        const utilityBills = await databaseService.getUtilityBillsByBuildingId(buildingId || 0);
        const billData = utilityBills.find(b => b.id === billId);
        setBill(billData || null);
        
        if (billData) {
          // Load house bills for this utility bill
          const houseBillsData = await databaseService.getHouseBillsByUtilityBillId(billId);
          
          // Load house and tenant details for each house bill
          const houseBillsWithDetails: (HouseBill & { 
            houseNumber?: string, 
            tenantName?: string,
            occupants?: number
          })[] = [];
          
          for (const houseBill of houseBillsData) {
            const house = await databaseService.getHouseById(houseBill.houseId);
            
            if (house) {
              const tenants = await databaseService.getTenantsByHouseId(house.id!);
              const activeTenant = tenants.find(t => t.isActive);
              
              houseBillsWithDetails.push({
                ...houseBill,
                houseNumber: house.houseNumber,
                tenantName: activeTenant?.name,
                occupants: activeTenant?.occupants
              });
            } else {
              houseBillsWithDetails.push(houseBill);
            }
          }
          
          setHouseBills(houseBillsWithDetails);
        }
      } catch (error) {
        console.error('Error loading bill details:', error);
        Alert.alert('Error', 'Failed to load bill details');
      } finally {
        setLoading(false);
      }
    };
    
    loadBillDetails();
  }, [billId, buildingId]);
  
  const handleMarkAllPaid = () => {
    Alert.alert(
      'Mark All as Paid',
      'Are you sure you want to mark all house bills as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All Paid', 
          onPress: async () => {
            try {
              // Update all house bills
              for (const houseBill of houseBills) {
                await databaseService.updateHouseBill({
                  ...houseBill,
                  isPaid: true
                });
              }
              
              // Update local state
              setHouseBills(houseBills.map(bill => ({ ...bill, isPaid: true })));
              
              // Check if all house bills are paid and update the utility bill
              if (bill) {
                await databaseService.createUtilityBill({
                  ...bill,
                  isPaid: true
                });
                
                setBill({ ...bill, isPaid: true });
              }
              
              Alert.alert('Success', 'All bills marked as paid');
            } catch (error) {
              console.error('Error marking bills as paid:', error);
              Alert.alert('Error', 'Failed to mark bills as paid');
            }
          }
        },
      ]
    );
  };
  
  if (!bill) {
    return (
      <Container>
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {loading ? 'Loading...' : 'Bill not found'}
        </Text>
      </Container>
    );
  }
  
  return (
    <Container scrollable={false}>
      <ScrollView>
        {/* Bill Info Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <View className="flex-row items-center">
                <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {bill.billType.charAt(0).toUpperCase() + bill.billType.slice(1)} Bill
                </Text>
                <View className={`ml-2 px-2 py-0.5 rounded-full ${bill.isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-xs ${bill.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                    {bill.isPaid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>
              <Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {buildingName || 'Unknown Building'}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Bill Details Card */}
        <Card className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Bill Details
          </Text>
          
          <View className="mb-2">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {new Date(bill.billDate).toLocaleDateString()}
            </Text>
          </View>
          
          <View className="mb-2">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${bill.totalAmount.toFixed(2)}
            </Text>
          </View>
          
          <View>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</Text>
            <Text className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {bill.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </View>
        </Card>
        
        {/* House Bills Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              House Bills
            </Text>
            {!bill.isPaid && (
              <Button
                title="Mark All Paid"
                onPress={handleMarkAllPaid}
                size="sm"
                variant="secondary"
              />
            )}
          </View>
          
          {houseBills.length > 0 ? (
            houseBills.map(houseBill => (
              <Card key={houseBill.id} className="mb-2">
                <View className="flex-row justify-between items-center">
                  <View>
                    <View className="flex-row items-center">
                      <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        House {houseBill.houseNumber || houseBill.houseId}
                      </Text>
                      <View className={`ml-2 px-2 py-0.5 rounded-full ${houseBill.isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs ${houseBill.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                          {houseBill.isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                      </View>
                    </View>
                    {houseBill.tenantName && (
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tenant: {houseBill.tenantName}
                      </Text>
                    )}
                    {bill.billType === 'water' && houseBill.occupants && (
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Occupants: {houseBill.occupants}
                      </Text>
                    )}
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Amount: ${houseBill.amount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => {
                      // Mark bill as paid/unpaid
                      Alert.alert(
                        'Update Bill Status',
                        `Mark this bill as ${houseBill.isPaid ? 'unpaid' : 'paid'}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Update', 
                            onPress: async () => {
                              try {
                                await databaseService.updateHouseBill({
                                  ...houseBill,
                                  isPaid: !houseBill.isPaid
                                });
                                
                                // Update local state
                                setHouseBills(houseBills.map(b => 
                                  b.id === houseBill.id ? { ...b, isPaid: !houseBill.isPaid } : b
                                ));
                                
                                // Check if all house bills are paid and update the utility bill
                                const allPaid = houseBills
                                  .map(b => b.id === houseBill.id ? { ...b, isPaid: !houseBill.isPaid } : b)
                                  .every(b => b.isPaid);
                                
                                if (allPaid !== bill.isPaid) {
                                  await databaseService.createUtilityBill({
                                    ...bill,
                                    isPaid: allPaid
                                  });
                                  
                                  setBill({ ...bill, isPaid: allPaid });
                                }
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
                      name={houseBill.isPaid ? 'checkmark-circle' : 'close-circle'} 
                      size={24} 
                      color={houseBill.isPaid ? '#10B981' : '#EF4444'} 
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View className="items-center py-4">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No house bills found for this utility bill
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

export default UtilityBillDetailScreen;