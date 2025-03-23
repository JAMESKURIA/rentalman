import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { Building } from '../../services/DatabaseService';

const BuildingsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        const data = await databaseService.getBuildings();
        setBuildings(data);
      } catch (error) {
        console.error('Error loading buildings:', error);
        Alert.alert('Error', 'Failed to load buildings');
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadBuildings);
    return unsubscribe;
  }, [navigation]);
  
  const handleDeleteBuilding = (building: Building) => {
    Alert.alert(
      'Delete Building',
      `Are you sure you want to delete ${building.name}? This will also delete all houses and tenant records associated with this building.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteBuilding(building.id!);
              setBuildings(buildings.filter(b => b.id !== building.id));
            } catch (error) {
              console.error('Error deleting building:', error);
              Alert.alert('Error', 'Failed to delete building');
            }
          }
        },
      ]
    );
  };
  
  const renderBuildingItem = ({ item }: { item: Building }) => (
    <Card
      className="mb-3"
      onPress={() => navigation.navigate('BuildingDetail', { buildingId: item.id, buildingName: item.name })}
    >
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.address}</Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            className="p-2 mr-2"
            onPress={() => navigation.navigate('Houses', { buildingId: item.id, buildingName: item.name })}
          >
            <Ionicons name="home-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-2"
            onPress={() => handleDeleteBuilding(item)}
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
        name="business-outline" 
        size={60} 
        color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No buildings added yet
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add your first building to get started
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Buildings
        </Text>
        <Button
          title="Add Building"
          onPress={() => navigation.navigate('AddBuilding')}
          icon={<Ionicons name="add" size={18} color="white" />}
          size="sm"
        />
      </View>
      
      <FlatList
        data={buildings}
        renderItem={renderBuildingItem}
        keyExtractor={item => item.id!.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </Container>
  );
};

export default BuildingsScreen;