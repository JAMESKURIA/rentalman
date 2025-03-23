import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { UtilityBill, Building } from '../../services/DatabaseService';

const UtilityBillsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  // If buildingId is provided, show bills for that building only
  const { buildingId, buildingName } = route.params as { buildingId?: number, buildingName?: string } || {};
  
  const [bills, setUtilityBills] = useState<UtilityBill[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadBills = async () => {
      try {
        setLoading(true);
        
        // Load buildings first
        const buildingsData = await databaseService.getBuildings();
        setBuildings(buildingsData);
        
        let billsData: UtilityBill[] = [];
        
        if (buildingId) {
          // Load bills for specific building
          billsData = await databaseService.getUtilityBillsByBuildingId(buildingId);
        } else {
          // Load all bills from all buildings
          for (const building of buildingsData) {
            const data = await databaseService.getUtilityBillsByBuildingId(building.id!);
            billsData = [...billsData, ...data];
          }
        }
        
        setUtilityBills(billsData);
      } catch (error) {
        console.error('Error loading utility bills:', error);
        Alert.alert('Error', 'Failed to load utility bills');
      } finally {
        setLoading(false);
      }
    };
    
    loadBills();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadBills);
    return unsubscribe;
  }, [buildingId, navigation]);
  
  const getBuildingName = (buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    return building ? building.name : 'Unknown Building';
  };
  
  const renderBillItem = ({ item }: { item: UtilityBill }) => (
    <Card
      className="mb-3"
      onPress={() => navigation.navigate('UtilityBillDetail', { 
        billId: item.id, 
        billType: `${item.billType.charAt(0).toUpperCase() + item.billType.slice(1)} Bill`,
        buildingId: item.buildingId,
        buildingName: getBuildingName(item.buildingId)
      })}
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
          {!buildingId && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Building: {getBuildingName(item.buildingId)}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
      </View>
    </Card>
  );
  
  const renderEmptyList = () => (
    <View className="items-center justify-center py-8">
      <Ionicons 
        name="cash-outline" 
        size={60} 
        color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No utility bills found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {buildingId 
          ? 'Add your first utility bill to this building' 
          : 'Add utility bills to get started'}
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {buildingId ? `${buildingName} Bills` : 'All Utility Bills'}
        </Text>
        <Button
          title="Add Bill"
          onPress={() => navigation.navigate('AddUtilityBill', buildingId ? { buildingId, buildingName } : {})}
          icon={<Ionicons name="add" size={18} color="white" />}
          size="sm"
        />
      </View>
      
      <FlatList
        data={bills}
        renderItem={renderBillItem}
        keyExtractor={item => item.id!.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </Container>
  );
};

export default UtilityBillsScreen;