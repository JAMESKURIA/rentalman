import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { House, Building } from '../../services/DatabaseService';

const HousesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  // If buildingId is provided, show houses for that building only
  const { buildingId, buildingName } = route.params as { buildingId?: number, buildingName?: string } || {};
  
  const [houses, setHouses] = useState<(House & { buildingName?: string })[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadHouses = async () => {
      try {
        setLoading(true);
        
        // Load buildings first
        const buildingsData = await databaseService.getBuildings();
        setBuildings(buildingsData);
        
        let housesData: (House & { buildingName?: string })[] = [];
        
        if (buildingId) {
          // Load houses for specific building
          const data = await databaseService.getHousesByBuildingId(buildingId);
          housesData = data.map(house => ({
            ...house,
            buildingName: buildingName || buildingsData.find(b => b.id === buildingId)?.name
          }));
        } else {
          // Load all houses from all buildings
          for (const building of buildingsData) {
            const data = await databaseService.getHousesByBuildingId(building.id!);
            housesData = [
              ...housesData,
              ...data.map(house => ({
                ...house,
                buildingName: building.name
              }))
            ];
          }
        }
        
        setHouses(housesData);
      } catch (error) {
        console.error('Error loading houses:', error);
        Alert.alert('Error', 'Failed to load houses');
      } finally {
        setLoading(false);
      }
    };
    
    loadHouses();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadHouses);
    return unsubscribe;
  }, [buildingId, buildingName, navigation]);
  
  const handleDeleteHouse = (house: House) => {
    Alert.alert(
      'Delete House',
      `Are you sure you want to delete house ${house.houseNumber}? This will also delete all tenant records associated with this house.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteHouse(house.id!);
              setHouses(houses.filter(h => h.id !== house.id));
            } catch (error) {
              console.error('Error deleting house:', error);
              Alert.alert('Error', 'Failed to delete house');
            }
          }
        },
      ]
    );
  };
  
  const renderHouseItem = ({ item }: { item: House & { buildingName?: string } }) => (
    <Card
      className="mb-3"
      onPress={() => navigation.navigate('HouseDetail', { 
        houseId: item.id, 
        houseNumber: item.houseNumber,
        buildingId: item.buildingId,
        buildingName: item.buildingName
      })}
    >
      <View className="flex-row justify-between">
        <View>
          <View className="flex-row items-center">
            <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {item.houseNumber}
            </Text>
            <View className={`ml-2 px-2 py-0.5 rounded-full ${item.isOccupied ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-xs ${item.isOccupied ? 'text-green-800' : 'text-yellow-800'}`}>
                {item.isOccupied ? 'Occupied' : 'Vacant'}
              </Text>
            </View>
          </View>
          <Text className={`capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.type.replace('-', ' ')}
          </Text>
          {!buildingId && item.buildingName && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.buildingName}
            </Text>
          )}
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Rent: ${item.rentAmount.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            className="p-2"
            onPress={() => handleDeleteHouse(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
  
  const renderEmptyList = () => (
    <View className="items-center justify-center py-8">
      <Ionicons 
        name="home-outline" 
        size={60} 
        color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No houses found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {buildingId 
          ? 'Add your first house to this building' 
          : 'Add buildings and houses to get started'}
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {buildingId ? `${buildingName} Houses` : 'All Houses'}
        </Text>
        <Button
          title="Add House"
          onPress={() => navigation.navigate('AddHouse', buildingId ? { buildingId, buildingName } : {})}
          icon={<Ionicons name="add" size={18} color="white" />}
          size="sm"
        />
      </View>
      
      <FlatList
        data={houses}
        renderItem={renderHouseItem}
        keyExtractor={item => item.id!.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </Container>
  );
};

export default HousesScreen;