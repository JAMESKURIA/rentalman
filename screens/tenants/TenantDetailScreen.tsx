import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import databaseService, { Tenant, House, Building } from '../../services/DatabaseService';

const TenantDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const { tenantId, houseId, houseNumber } = route.params as { 
    tenantId: number,
    houseId?: number,
    houseNumber?: string
  };
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupants, setOccupants] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  
  useEffect(() => {
    const loadTenantDetails = async () => {
      try {
        setLoading(true);
        
        // Load tenants for this house to find the specific tenant
        const tenantsData = await databaseService.getTenantsByHouseId(houseId || 0);
        const tenantData = tenantsData.find(t => t.id === tenantId);
        
        if (tenantData) {
          setTenant(tenantData);
          
          // Set form values
          setName(tenantData.name);
          setPhone(tenantData.phone);
          setEmail(tenantData.email || '');
          setOccupants(tenantData.occupants.toString());
          setMoveInDate(tenantData.moveInDate);
          setMoveOutDate(tenantData.moveOutDate || '');
          
          // Load house details
          const houseData = await databaseService.getHouseById(tenantData.houseId);
          setHouse(houseData);
          
          // Load building details
          if (houseData) {
            const buildingData = await databaseService.getBuildingById(houseData.buildingId);
            setBuilding(buildingData);
          }
        }
      } catch (error) {
        console.error('Error loading tenant details:', error);
        Alert.alert('Error', 'Failed to load tenant details');
      } finally {
        setLoading(false);
      }
    };
    
    loadTenantDetails();
  }, [tenantId, houseId]);
  
  const handleDeleteTenant = () => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete ${tenant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTenant(tenantId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting tenant:', error);
              Alert.alert('Error', 'Failed to delete tenant');
            }
          }
        },
      ]
    );
  };
  
  const handleEndTenancy = () => {
    Alert.alert(
      'End Tenancy',
      `Are you sure you want to end ${tenant?.name}'s tenancy? This will mark the house as vacant.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Tenancy', 
          onPress: async () => {
            try {
              if (tenant) {
                const today = new Date().toISOString().split('T')[0];
                
                await databaseService.updateTenant({
                  ...tenant,
                  moveOutDate: today,
                  isActive: false,
                });
                
                // Refresh tenant data
                const tenantsData = await databaseService.getTenantsByHouseId(tenant.houseId);
                const updatedTenant = tenantsData.find(t => t.id === tenantId);
                setTenant(updatedTenant || null);
                
                if (updatedTenant) {
                  setMoveOutDate(updatedTenant.moveOutDate || '');
                }
                
                Alert.alert('Success', 'Tenancy ended successfully');
              }
            } catch (error) {
              console.error('Error ending tenancy:', error);
              Alert.alert('Error', 'Failed to end tenancy');
            }
          }
        },
      ]
    );
  };
  
  const handleSaveChanges = async () => {
    try {
      if (tenant) {
        await databaseService.updateTenant({
          ...tenant,
          name,
          phone,
          email: email || undefined,
          occupants: parseInt(occupants),
          moveInDate,
          moveOutDate: moveOutDate || undefined,
        });
        
        // Refresh tenant data
        const tenantsData = await databaseService.getTenantsByHouseId(tenant.houseId);
        const updatedTenant = tenantsData.find(t => t.id === tenantId);
        setTenant(updatedTenant || null);
        
        setEditMode(false);
        Alert.alert('Success', 'Tenant information updated successfully');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      Alert.alert('Error', 'Failed to update tenant information');
    }
  };
  
  if (!tenant) {
    return (
      <Container>
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {loading ? 'Loading...' : 'Tenant not found'}
        </Text>
      </Container>
    );
  }
  
  return (
    <Container scrollable={false}>
      <ScrollView>
        {/* Tenant Info Card */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {tenant.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className={`px-2 py-0.5 rounded-full ${tenant.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${tenant.isActive ? 'text-green-800' : 'text-gray-800'}`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="p-2 mr-2"
                onPress={() => setEditMode(!editMode)}
              >
                <Ionicons name={editMode ? 'close-outline' : 'create-outline'} size={20} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="p-2"
                onPress={handleDeleteTenant}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
        
        {editMode ? (
          // Edit Form
          <Card className="mb-4" title="Edit Tenant Information">
            <Input
              label="Tenant Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter tenant name"
            />
            
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Number of Occupants"
              value={occupants}
              onChangeText={setOccupants}
              placeholder="Enter number of occupants"
              keyboardType="numeric"
            />
            
            <Input
              label="Move-in Date"
              value={moveInDate}
              onChangeText={setMoveInDate}
              placeholder="YYYY-MM-DD"
            />
            
            <Input
              label="Move-out Date (Optional)"
              value={moveOutDate}
              onChangeText={setMoveOutDate}
              placeholder="YYYY-MM-DD"
            />
            
            <Button
              title="Save Changes"
              onPress={handleSaveChanges}
              size="lg"
              fullWidth
              className="mt-4"
            />
          </Card>
        ) : (
          // Tenant Details Card
          <Card className="mb-4" title="Tenant Details">
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone:</Text>
                <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {tenant.phone}
                </Text>
              </View>
              {tenant.email && (
                <View className="flex-row justify-between">
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</Text>
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {tenant.email}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Occupants:</Text>
                <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {tenant.occupants}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Move-in Date:</Text>
                <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(tenant.moveInDate).toLocaleDateString()}
                </Text>
              </View>
              {tenant.moveOutDate && (
                <View className="flex-row justify-between">
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Move-out Date:</Text>
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {new Date(tenant.moveOutDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}
        
        {/* House Information */}
        {house && (
          <Card 
            className="mb-4" 
            title="House Information"
            onPress={() => navigation.navigate('HouseDetail', { 
              houseId: house.id, 
              houseNumber: house.houseNumber,
              buildingId: house.buildingId,
              buildingName: building?.name
            })}
          >
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>House Number:</Text>
                <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {house.houseNumber}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type:</Text>
                <Text className={`font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {house.type.replace('-', ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rent Amount:</Text>
                <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  ${house.rentAmount.toFixed(2)}
                </Text>
              </View>
              {building && (
                <View className="flex-row justify-between">
                  <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Building:</Text>
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {building.name}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}
        
        {/* Actions */}
        {tenant.isActive && (
          <Button
            title="End Tenancy"
            onPress={handleEndTenancy}
            variant="danger"
            size="lg"
            fullWidth
            className="mb-4"
          />
        )}
      </ScrollView>
    </Container>
  );
};

export default TenantDetailScreen;