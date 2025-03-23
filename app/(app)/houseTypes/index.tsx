import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import globalState from '../../../state';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';

export default function HouseTypesScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Load house types on mount
  useEffect(() => {
    const loadHouseTypes = async () => {
      try {
        await dataSyncService.syncCollection('houseTypes');
      } catch (error) {
        console.error('Error loading house types:', error);
        Alert.alert('Error', 'Failed to load house types');
      }
    };
    
    loadHouseTypes();
  }, []);
  
  // Get house types from global state
  const houseTypes = globalState.houseTypes.get();
  const loading = globalState.ui.loading.get();
  
  // Delete house type
  const handleDeleteHouseType = (id: number) => {
    Alert.alert(
      'Delete House Type',
      'Are you sure you want to delete this house type? This may affect existing houses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteHouseType(id);
              await dataSyncService.syncCollection('houseTypes');
              Alert.alert('Success', 'House type deleted successfully');
            } catch (error) {
              console.error('Error deleting house type:', error);
              Alert.alert('Error', 'Failed to delete house type');
            }
          },
        },
      ]
    );
  };
  
  // Render house type item
  const renderHouseTypeItem = ({ item }) => (
    <Card
      className="mb-3"
      onPress={() => router.push(`/houseTypes/${item.id}`)}
    >
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.name}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Default Rent: ${item.defaultRentAmount.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteHouseType(item.id)}
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
        name="home-outline"
        size={60}
        color={isDarkMode ? '#4B5563' : '#D1D5DB'}
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No house types found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add house types to categorize your rental properties
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          House Types
        </Text>
        <Link href="/houseTypes/add" asChild>
          <Button
            title="Add Type"
            icon={<Ionicons name="add" size={18} color="white" />}
            size="sm"
          />
        </Link>
      </View>
      
      <FlatList
        data={houseTypes}
        renderItem={renderHouseTypeItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => dataSyncService.syncCollection('houseTypes')}
      />
    </Container>
  );
}