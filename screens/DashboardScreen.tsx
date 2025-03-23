import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import Container from '../components/Container';
import Card from '../components/Card';
import databaseService, { Building, House, Tenant } from '../services/DatabaseService';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBuildings: 0,
    totalHouses: 0,
    occupiedHouses: 0,
    vacantHouses: 0,
    totalTenants: 0,
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load buildings
        const buildingsData = await databaseService.getBuildings();
        setBuildings(buildingsData);
        
        // Load houses for all buildings
        let allHouses: House[] = [];
        for (const building of buildingsData) {
          const housesData = await databaseService.getHousesByBuildingId(building.id!);
          allHouses = [...allHouses, ...housesData];
        }
        setHouses(allHouses);
        
        // Load active tenants
        const tenantsData = await databaseService.getActiveTenants();
        setTenants(tenantsData);
        
        // Calculate stats
        setStats({
          totalBuildings: buildingsData.length,
          totalHouses: allHouses.length,
          occupiedHouses: allHouses.filter(house => house.isOccupied).length,
          vacantHouses: allHouses.filter(house => !house.isOccupied).length,
          totalTenants: tenantsData.length,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);
  
  const renderStatCard = (title: string, value: number, icon: string, color: string, onPress?: () => void) => (
    <TouchableOpacity 
      className="flex-1 min-w-[45%]" 
      onPress={onPress}
      disabled={!onPress}
    >
      <Card className="m-1">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</Text>
            <Text className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value}</Text>
          </View>
          <View className={`p-3 rounded-full bg-opacity-20 ${color}`}>
            <Ionicons name={icon as any} size={24} color={color.replace('bg-', 'text-')} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  const renderBuildingItem = ({ item }: { item: Building }) => (
    <TouchableOpacity 
      className="mb-3"
      onPress={() => navigation.navigate('Buildings', {
        screen: 'BuildingDetail',
        params: { buildingId: item.id, buildingName: item.name }
      })}
    >
      <Card>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</Text>
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.address}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  return (
    <Container>
      <Text className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Dashboard
      </Text>
      
      {/* Stats Cards */}
      <View className="flex-row flex-wrap mb-6">
        {renderStatCard('Buildings', stats.totalBuildings, 'business', 'bg-blue-500', () => 
          navigation.navigate('Buildings', { screen: 'Buildings' })
        )}
        {renderStatCard('Houses', stats.totalHouses, 'home', 'bg-green-500', () => 
          navigation.navigate('Houses', { screen: 'AllHouses' })
        )}
        {renderStatCard('Occupied', stats.occupiedHouses, 'checkmark-circle', 'bg-purple-500')}
        {renderStatCard('Vacant', stats.vacantHouses, 'alert-circle', 'bg-yellow-500')}
      </View>
      
      {/* Recent Buildings */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Recent Buildings
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Buildings', { screen: 'Buildings' })}>
            <Text className="text-primary">See All</Text>
          </TouchableOpacity>
        </View>
        
        {buildings.length > 0 ? (
          <FlatList
            data={buildings.slice(0, 3)}
            renderItem={renderBuildingItem}
            keyExtractor={item => item.id!.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Card>
            <View className="items-center py-4">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No buildings added yet
              </Text>
              <TouchableOpacity 
                className="mt-2 flex-row items-center" 
                onPress={() => navigation.navigate('Buildings', { screen: 'AddBuilding' })}
              >
                <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
                <Text className="text-primary ml-1">Add Building</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </View>
      
      {/* Quick Actions */}
      <View>
        <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Quick Actions
        </Text>
        
        <View className="flex-row flex-wrap">
          <TouchableOpacity 
            className="w-1/2 p-1"
            onPress={() => navigation.navigate('Buildings', { screen: 'AddBuilding' })}
          >
            <Card>
              <View className="items-center py-3">
                <Ionicons name="business-outline" size={24} color="#3B82F6" />
                <Text className={`mt-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Building</Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-1/2 p-1"
            onPress={() => navigation.navigate('Houses', { screen: 'AddHouse' })}
          >
            <Card>
              <View className="items-center py-3">
                <Ionicons name="home-outline" size={24} color="#10B981" />
                <Text className={`mt-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add House</Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-1/2 p-1"
            onPress={() => navigation.navigate('Tenants', { screen: 'AddTenant' })}
          >
            <Card>
              <View className="items-center py-3">
                <Ionicons name="person-add-outline" size={24} color="#8B5CF6" />
                <Text className={`mt-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Tenant</Text>
              </View>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-1/2 p-1"
            onPress={() => navigation.navigate('Bills', { screen: 'AddUtilityBill' })}
          >
            <Card>
              <View className="items-center py-3">
                <Ionicons name="cash-outline" size={24} color="#F59E0B" />
                <Text className={`mt-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Add Bill</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

export default DashboardScreen;