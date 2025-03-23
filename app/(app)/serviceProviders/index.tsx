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

export default function ServiceProvidersScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  // Load service providers on mount
  useEffect(() => {
    const loadServiceProviders = async () => {
      try {
        await dataSyncService.syncCollection('serviceProviders');
      } catch (error) {
        console.error('Error loading service providers:', error);
        Alert.alert('Error', 'Failed to load service providers');
      }
    };
    
    loadServiceProviders();
  }, []);
  
  // Get service providers from global state
  const serviceProviders = globalState.serviceProviders.get();
  const loading = globalState.ui.loading.get();
  
  // Delete service provider
  const handleDeleteServiceProvider = (id: number) => {
    Alert.alert(
      'Delete Service Provider',
      'Are you sure you want to delete this service provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteServiceProvider(id);
              await dataSyncService.syncCollection('serviceProviders');
              Alert.alert('Success', 'Service provider deleted successfully');
            } catch (error) {
              console.error('Error deleting service provider:', error);
              Alert.alert('Error', 'Failed to delete service provider');
            }
          },
        },
      ]
    );
  };
  
  // Render service provider item
  const renderServiceProviderItem = ({ item }) => (
    <Card
      className="mb-3"
      onPress={() => router.push(`/serviceProviders/${item.id}`)}
    >
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.name}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.serviceType}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.phone}
          </Text>
          {item.email && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.email}
            </Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteServiceProvider(item.id)}
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
        name="construct-outline"
        size={60}
        color={isDarkMode ? '#4B5563' : '#D1D5DB'}
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No service providers found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add service providers to track maintenance services
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Service Providers
        </Text>
        <Link href="/serviceProviders/add" asChild>
          <Button
            title="Add Provider"
            icon={<Ionicons name="add" size={18} color="white" />}
            size="sm"
          />
        </Link>
      </View>
      
      <FlatList
        data={serviceProviders}
        renderItem={renderServiceProviderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshing={loading}
        onRefresh={() => dataSyncService.syncCollection('serviceProviders')}
      />
    </Container>
  );
}