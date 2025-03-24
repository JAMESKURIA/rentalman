import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';
import globalState from '../../../state';

export default function BillsScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Load bills on mount
  useEffect(() => {
    const loadBills = async () => {
      try {
        await dataSyncService.syncCollection('utilityBills');
        await dataSyncService.syncCollection('buildings');
      } catch (error) {
        console.error('Error loading bills:', error);
        Alert.alert('Error', 'Failed to load bills');
      }
    };
    
    loadBills();
  }, []);
  
  // Get bills from global state
  const utilityBills = globalState.utilityBills.get();
  const buildings = globalState.buildings.get();
  const loading = globalState.ui.loading.get();
  
  // Enrich bills with building info
  const enrichedBills = utilityBills.map(bill => {
    const building = buildings.find(b => b.id === bill.buildingId);
    
    return {
      ...bill,
      buildingName: building?.name,
    };
  });
  
  // Sort bills by date (newest first)
  const sortedBills = [...enrichedBills].sort((a, b) => 
    new Date(b.billDate).getTime() - new Date(a.billDate).getTime()
  );
  
  // Delete bill
  const handleDeleteBill = (id: number) => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This will also delete all house bills associated with this utility bill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteUtilityBill(id);
              await dataSyncService.syncCollection('utilityBills');
              await dataSyncService.syncCollection('houseBills');
              Alert.alert('Success', 'Bill deleted successfully');
            } catch (error) {
              console.error('Error deleting bill:', error);
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };
  
  // Render bill item
  const renderBillItem = ({ item }) => (
    <Card
      className="mb-3"
      onPress={() => router.push(`/bills/${item.id}`)}
    >
      <View className="flex-row justify-between">
        <View>
          <View className="flex-row items-center">
            <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {item.billType.charAt(0).toUpperCase() + item.billType.slice(1)} Bill
            </Text>
            <View className={`ml-2 px-2 py-0.5 rounded-full ${item.isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-xs ${item.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                {item.isPaid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Date: {new Date(item.billDate).toLocaleDateString()}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Amount: ${item.totalAmount.toFixed(2)}
          </Text>
          {item.buildingName && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Building: {item.buildingName}
            </Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteBill(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
  
  // Render empty list
  const renderEmptyList = () => (
    <View className="items-center justify-center py-8">
      <Ionicons
        name="cash-outline"
        size={60}
        color={isDarkMode ? '#4B5563' : '#D1D5DB'}
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No bills found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add utility bills to get started
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Utility Bills
        </Text>
        <Link href="/bills/add" asChild>
          <Button
            title="Add Bill"
            icon={<Ionicons name="add" size={18} color="white" />}
            size="sm"
          />
        </Link>
      </View>
      
      <FlatList
        data={sortedBills}
        renderItem={renderBillItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => {
          dataSyncService.syncCollection('utilityBills');
          dataSyncService.syncCollection('buildings');
        }}
      />
    </Container>
  );
}