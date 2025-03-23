import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import databaseService, { Tenant, House, Building } from '../../services/DatabaseService';

const TenantsScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const [tenants, setTenants] = useState<(Tenant & { houseNumber?: string, buildingName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true);
        
        // Load active tenants
        const tenantsData = await databaseService.getActiveTenants();
        
        // Load house and building details for each tenant
        const tenantsWithDetails: (Tenant & { houseNumber?: string, buildingName?: string })[] = [];
        
        for (const tenant of tenantsData) {
          const house = await databaseService.getHouseById(tenant.houseId);
          
          if (house) {
            const building = await databaseService.getBuildingById(house.buildingId);
            
            tenantsWithDetails.push({
              ...tenant,
              houseNumber: house.houseNumber,
              buildingName: building?.name,
            });
          } else {
            tenantsWithDetails.push(tenant);
          }
        }
        
        setTenants(tenantsWithDetails);
      } catch (error) {
        console.error('Error loading tenants:', error);
        Alert.alert('Error', 'Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };
    
    loadTenants();
    
    // Refresh data when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadTenants);
    return unsubscribe;
  }, [navigation]);
  
  const handleDeleteTenant = (tenant: Tenant) => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete ${tenant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTenant(tenant.id!);
              setTenants(tenants.filter(t => t.id !== tenant.id));
            } catch (error) {
              console.error('Error deleting tenant:', error);
              Alert.alert('Error', 'Failed to delete tenant');
            }
          }
        },
      ]
    );
  };
  
  const renderTenantItem = ({ item }: { item: Tenant & { houseNumber?: string, buildingName?: string } }) => (
    <Card
      className="mb-3"
      onPress={() => navigation.navigate('TenantDetail', { 
        tenantId: item.id, 
        tenantName: item.name,
        houseId: item.houseId,
        houseNumber: item.houseNumber
      })}
    >
      <View className="flex-row justify-between">
        <View>
          <Text className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {item.name}
          </Text>
          <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.phone}
          </Text>
          {item.houseNumber && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              House: {item.houseNumber}
            </Text>
          )}
          {item.buildingName && (
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Building: {item.buildingName}
            </Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity 
            className="p-2"
            onPress={() => handleDeleteTenant(item)}
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
        name="people-outline" 
        size={60} 
        color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
      />
      <Text className={`text-lg font-medium mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        No tenants found
      </Text>
      <Text className={`text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Add tenants to your houses to get started
      </Text>
    </View>
  );
  
  return (
    <Container>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Tenants
        </Text>
        <Button
          title="Add Tenant"
          onPress={() => navigation.navigate('AddTenant')}
          icon={<Ionicons name="add" size={18} color="white" />}
          size="sm"
        />
      </View>
      
      <FlatList
        data={tenants}
        renderItem={renderTenantItem}
        keyExtractor={item => item.id!.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </Container>
  );
};

export default TenantsScreen;