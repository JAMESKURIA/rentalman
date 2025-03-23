import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { UtilityBill, HouseBill, House } from '../../services/DatabaseService';

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
  const [houseBills, setHouseBills] = useState<(HouseBill & { houseNumber?: string, tenantName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadBillDetails = async () => {
      try {
        setLoading(true);
        
        // Load bills for this building to find the specific bill
        const billsData = await databaseService.getUtilityBillsByBuildingId(buildingId || 0);
        const billData = billsData.find(b => b.id === billId);
        
        if (billData) {
          setBill(billData);
          
          // Load house bills for this utility bill
          const houseBillsData = await databaseService.getHouseBillsByUtilityBillId(billId);
          
          // Load house details for each house bill
          const houseBillsWithDetails: (HouseBill & { houseNumber?: string, tenantName?: string })[] = [];
          
          for (const houseBill of houseBillsData) {
            const house = await databaseService.getHouseById(houseBill.houseId);
            
            // Get active tenant for this house
            const tenants = await databaseService.getTenantsByHouseId(houseBill.houseId);
            const activeTenant = tenants.find(t => t.isActive);
            
            houseBillsWithDetails.push({
              ...houseBill,
              houseNumber: house?.houseNumber,
              tenantName: activeTenant?.name,
            });
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
  
  const handleMarkAsPaid = async () => {
    try {
      if (bill) {
        // Mark the utility bill as paid
        await databaseService.updateUtilityBill({
          ...bill,
          isPaid: true,
        });
        
        // Refresh bill data
        const billsData = await databaseService.getUtilityBillsByBuildingId(bill.buildingId);
        const updatedBill = billsData.find(b => b.id === billId);
        setBill(updatedBill || null);
        
        Alert.alert('Success', 'Bill marked as paid successfully');
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      Alert.alert('Error', 'Failed to mark bill as paid');
    }
  };
  
  const handleMarkHouseBillAsPaid = async (houseBill: HouseBill) => {
    try {
      // Mark the house bill as paid
      await databaseService.updateHouseBill({
        ...houseBill,
        isPaid: true,
      });
      
      // Refresh house bills data
      const houseBillsData = await databaseService.getHouseBillsByUtilityBillId(billId);
      
      // Load house details for each house bill
      const houseBillsWithDetails: (HouseBill & { houseNumber?: string, tenantName?: string })[] = [];
      
      for (const hb of houseBillsData) {
        const house = await databaseService.getHouseById(hb.houseId);
        
        // Get active tenant for this house
        const tenants = await databaseService.getTenantsByHouseId(hb.houseId);
        const activeTenant = tenants.find(t => t.isActive);
        
        houseBillsWithDetails.push({
          ...hb,
          houseNumber: house?.houseNumber,
          tenantName: activeTenant?.name,
        });
      }
      
      setHouseBills(houseBillsWithDetails);
      
      // Check if all house bills are paid
      const allPaid = houseBillsWithDetails.every(hb => hb.isPaid);
      
      if (allPaid && bill && !bill.isPaid) {
        // If all house bills are paid, mark the utility bill as paid
        await databaseService.updateUtilityBill({
          ...bill,
          isPaid: true,
        });
        
        // Refresh bill data
        const billsData = await databaseService.getUtilityBillsByBuildingId(bill.buildingId);
        const updatedBill = billsData.find(b => b.id === billId);
        setBill(updatedBill || null);
      }
      
      Alert.alert('Success', 'House bill marked as paid successfully');
    } catch (error) {
      console.error('Error marking house bill as paid:', error);
      Alert.alert('Error', 'Failed to mark house bill as paid');
    }
  };
  
  const renderHouseBillItem = ({ item }: { item: HouseBill & { houseNumber?: string, tenantName?: string } }) => (
    <Card className="mb-3">
      <View className="flex-row justify-between items-center">
        <View>
          <View className="flex-row items-center">
            <Text className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              House {item.houseNumber}
            </Text>
            <View className={`ml-2 px-2 py-0.5 rounded-full ${item.isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-xs ${item.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                {item.isPaid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
          {item.tenantName && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Tenant: {item.tenantName}
            </Text>
          )}
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Amount: ${item.amount.toFixed(2)}
          </Text>
        </View>
        {!item.isPaid && (
          <Button
            title="Mark Paid"
            onPress={() => handleMarkHouseBillAsPaid(item)}
            size="sm"
            variant="outline"
          />
        )}
      </View>
    </Card>
  );
  
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
              {buildingName && (
                <Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Building: {buildingName}
                </Text>
              )}
            </View>
          </View>
        </Card>
        
        {/* Bill Details Card */}
        <Card className="mb-4" title="Bill Details">
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bill Date:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {new Date(bill.billDate).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ${bill.totalAmount.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {bill.isPaid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Houses Billed:</Text>
              <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {houseBills.length}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* House Bills Section */}
        <View className="mb-4">
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            House Bills
          </Text>
          
          {houseBills.length > 0 ? (
            <FlatList
              data={houseBills}
              renderItem={renderHouseBillItem}
              keyExtractor={item => item.id!.toString()}
              scrollEnabled={false}
            />
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
        
        {/* Actions */}
        {!bill.isPaid && (
          <Button
            title="Mark All as Paid"
            onPress={handleMarkAsPaid}
            size="lg"
            fullWidth
            className="mb-4"
          />
        )}
      </ScrollView>
    </Container>
  );
};

export default UtilityBillDetailScreen;