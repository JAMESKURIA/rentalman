import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import Container from '../components/Container';
import Card from '../components/Card';
import databaseService from '../services/DatabaseService';

const ArrearsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const [arrears, setArrears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalArrears, setTotalArrears] = useState(0);
  
  useEffect(() => {
    const loadArrears = async () => {
      try {
        setLoading(true);
        
        // Load arrears report
        const arrearsData = await databaseService.getArrearsReport();
        setArrears(arrearsData);
        
        // Calculate total arrears
        const total = arrearsData.reduce((sum, item) => sum + item.amount, 0);
        setTotalArrears(total);
      } catch (error) {
        console.error('Error loading arrears:', error);
        Alert.alert('Error', 'Failed to load arrears');
      } finally {
        setLoading(false);
      }
    };
    
    loadArrears();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadArrears);
    return unsubscribe;
  }, [navigation]);
  
  const handleMarkAsPaid = async (billId: number) => {
    try {
      // Get the bill
      const bill = arrears.find(a => a.billId === billId);
      
      if (bill) {
        // Update the bill
        await databaseService.updateHouseBill({
          id: billId,
          houseId: bill.houseId,
          utilityBillId: bill.utilityBillId,
          amount: bill.amount,
          isPaid: true
        });
        
        // Update local state
        const updatedArrears = arrears.filter(a => a.billId !== billId);
        setArrears(updatedArrears);
        
        // Update total
        const total = updatedArrears.reduce((sum, item) => sum + item.amount, 0);
        setTotalArrears(total);
        
        Alert.alert('Success', 'Bill marked as paid');
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      Alert.alert('Error', 'Failed to mark bill as paid');
    }
  };
  
  const renderArrearItem = ({ item }: { item: any }) => (
    <Card className="mb-3">
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.tenantName}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            House: {item.houseNumber} ({item.buildingName})
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.billType.charAt(0).toUpperCase() + item.billType.slice(1)} Bill ({new Date(item.billDate).toLocaleDateString()})
          </Text>
          <Text className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Amount: ${item.amount.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity 
          className="p-2"
          onPress={() => handleMarkAsPaid(item.billId)}
        >
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>
    </Card>
  );
  
  const renderEmptyList = () => (
    <View className="items-center justify-center py-8">
      <Ionicons 
        name="checkmark-circle" 
        size={60} 
        color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No arrears found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        All bills are paid
      </Text>
    </View>
  );
  
  return (
    <Container>
      <Text className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Arrears
      </Text>
      
      <Card className="mb-4">
        <View className="items-center">
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Unpaid Bills
          </Text>
          <Text className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            ${totalArrears.toFixed(2)}
          </Text>
        </View>
      </Card>
      
      <FlatList
        data={arrears}
        renderItem={renderArrearItem}
        keyExtractor={(item, index) => `${item.billId}-${index}`}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </Container>
  );
};

export default ArrearsScreen;