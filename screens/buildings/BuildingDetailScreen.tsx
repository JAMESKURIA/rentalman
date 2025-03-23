import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { Building, House } from '../../services/DatabaseService';

const BuildingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const { buildingId } = route.params as { buildingId: number };
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHouses: 0,
    occupiedHouses: 0,
    vacantHouses: 0,
  });
  
  useEffect(() => {
    const loadBuildingDetails = async () => {
      try {
        setLoading(true);
        
        // Load building details
        const buildingData = await databaseService.getBuildingById(buildingId);
        setBuilding(buildingData);
        
        // Load houses for this building
        const housesData = await databaseService.getHousesByBuildingId(buildingId);
        setHouses(housesData);
        
        // Calculate stats
        setStats({
          totalHouses: housesData.length,
          occupiedHouses: housesData.filter(house => house.isOccupied).length,
          vacantHouses: housesData.filter(house => !house.isOccupied).length,
        });
      } catch (error) {
        console.error('Error loading building details:', error);
        Alert.alert('Error', 'Failed to load building details');
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildingDetails();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadBuildingDetails);
    return unsubscribe;
  }, [buildingId, navigation]);
  
  const handleEditBuilding = () => {
    // Navigate to edit building screen (to be implemented)
    Alert.alert('Edit Building', 'Edit building functionality to be implemented');
  };
  
  const handleDeleteBuilding = () => {
    Alert.alert(
      'Delete Building',
      `Are you sure you want to delete ${building?.name}? This will also delete all houses and tenant records associated with this building.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteBuilding(buildingId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting building:', error);
              Alert.alert('Error', 'Failed to delete building');
            }
          }
        },
      ]
    );
  };
  
  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View className="flex-1 min-w-[30%]">
      <Card className="m-1">
        <View className="items-center">
          <View className={`p-2 rounded-full mb-2 ${color}`}>
            <Ionicons name={icon as any} size={20} color="white" />
          </View>
          <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value}</Text>
          <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</Text>
        </View>
      </Card>
    </View>
  );
  
  if (!building) {
    return (
      <Container>
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {loading ? 'Loading...' : 'Building not found'}
        </Text>
      </Container>
    );
  }
  
  return (
    <Container scrollable={false}>
      <ScrollView>
        {/* Building Info Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {building.name}
              </Text>
              <Text className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {building.address}
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="p-2 mr-2"
                onPress={handleEditBuilding}
              >
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="p-2"
                onPress={handleDeleteBuilding}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {/* Stats Cards */}
        <View className="flex-row flex-wrap mb-4">
          {renderStatCard('Total Houses', stats.totalHouses, 'home', 'bg-blue-500')}
          {renderStatCard('Occupied', stats.occupiedHouses, 'checkmark-circle', 'bg-green-500')}
          {renderStatCard('Vacant', stats.vacantHouses, 'alert-circle', 'bg-yellow-500')}
        </View>
        
        {/* Houses Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Houses
            </Text>
            <Button
              title="Add House"
              onPress={() => navigation.navigate('AddHouse', { buildingId, buildingName: building.name })}
              icon={<Ionicons name="add" size={16} color="white" />}
              size="sm"
            />
          </View>
          
          {houses.length > 0 ? (
            houses.map(house => (
              <Card
                key={house.id}
                className="mb-3"
                onPress={() => navigation.navigate('HouseDetail', { 
                  houseId: house.id, 
                  houseNumber: house.houseNumber,
                  buildingId,
                  buildingName: building.name
                })}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <View className="flex-row items-center">
                      <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {house.houseNumber}
                      </Text>
                      <View className={`ml-2 px-2 py-0.5 rounded-full ${house.isOccupied ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        <Text className={`text-xs ${house.isOccupied ? 'text-green-800' : 'text-yellow-800'}`}>
                          {house.isOccupied ? 'Occupied' : 'Vacant'}
                        </Text>
                      </View>
                    </View>
                    <Text className={`capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {house.type.replace('-', ' ')}
                    </Text>
                    <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Rent: ${house.rentAmount.toFixed(2)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <View className="items-center py-4">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No houses added to this building yet
                </Text>
                <TouchableOpacity 
                  className="mt-2 flex-row items-center" 
                  onPress={() => navigation.navigate('AddHouse', { buildingId, buildingName: building.name })}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
                  <Text className="text-primary ml-1">Add House</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>
        
        {/* Utility Bills Section */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Utility Bills
            </Text>
            <Button
              title="View Bills"
              onPress={() => navigation.navigate('UtilityBills', { buildingId, buildingName: building.name })}
              size="sm"
              variant="outline"
            />
          </View>
          
          <Card
            onPress={() => navigation.navigate('UtilityBills', { buildingId, buildingName: building.name })}
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Manage electricity and water bills
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Container>
  );
};

export default BuildingDetailScreen;