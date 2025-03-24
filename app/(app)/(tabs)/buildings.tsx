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

export default function BuildingsScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Load buildings on mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        await dataSyncService.syncCollection('buildings');
      } catch (error) {
        console.error('Error loading buildings:', error);
        Alert.alert('Error', 'Failed to load buildings');
      }
    };
    
    loadBuildings();
  }, []);
  
  // Get buildings from global state
  const buildings = globalState.buildings.get();
  const loading = globalState.ui.loading.get();
  
  // Delete building
  const handleDeleteBuilding = (id: number) => {
    Alert.alert(
      'Delete Building',
      'Are you sure you want to delete this building? This will also delete all houses and tenants associated with this building.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteBuilding(id);
              await dataSyncService.syncCollection('buildings');
              Alert.alert('Success', 'Building deleted successfully');
            } catch (error) {
              console.error('Error deleting building:', error);
              Alert.alert('Error', 'Failed to delete building');
            }
          },
        },
      ]
    );
  };
  
  // Render building item
  const renderBuildingItem = ({ item }) => (
    <Card
      className="mb-3"
      onPress={() => router.push(`/buildings/${item.id}`)}
    >
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.name}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.address}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteBuilding(item.id)}
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
        name="business-outline"
        size={60}
        color={isDarkMode ? '#4B5563' : '#D1D5DB'}
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No buildings found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add buildings to get started
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Buildings
        </Text>
        <Link href="/buildings/add" asChild>
          <Button
            title="Add Building"
            icon={<Ionicons name="add" size={18} color="white" />}
            size="sm"
          />
        </Link>
      </View>
      
      <FlatList
        data={buildings}
        renderItem={renderBuildingItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => dataSyncService.syncCollection('buildings')}
      />
    </Container>
  );
}