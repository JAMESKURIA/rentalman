import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import databaseService, { Building, House } from '../../services/DatabaseService';

const AddTenantScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  // If houseId is provided, pre-select that house
  const { houseId, buildingId } = route.params as { houseId?: number, buildingId?: number } || {};
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupants, setOccupants] = useState('1');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(buildingId || null);
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(houseId || null);
  
  // Dropdown open states
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    occupants: '',
    moveInDate: '',
    buildingId: '',
    houseId: '',
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load buildings
        const buildingsData = await databaseService.getBuildings();
        setBuildings(buildingsData);
        
        // If no buildingId was provided and we have buildings, select the first one
        if (!buildingId && buildingsData.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(buildingsData[0].id!);
        }
        
        // Load houses for selected building
        if (selectedBuildingId) {
          const housesData = await databaseService.getHousesByBuildingId(selectedBuildingId);
          // Filter out occupied houses unless the houseId is already occupied and provided
          const availableHouses = housesData.filter(house => !house.isOccupied || house.id === houseId);
          setHouses(availableHouses);
          
          // If no houseId was provided and we have houses, select the first one
          if (!houseId && availableHouses.length > 0 && !selectedHouseId) {
            setSelectedHouseId(availableHouses[0].id!);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load buildings and houses');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [buildingId, houseId, selectedBuildingId]);
  
  const validate = () => {
    const newErrors = {
      name: '',
      phone: '',
      email: '',
      occupants: '',
      moveInDate: '',
      buildingId: '',
      houseId: '',
    };
    
    if (!name.trim()) {
      newErrors.name = 'Tenant name is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (email && !email.includes('@')) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!occupants.trim() || isNaN(parseInt(occupants)) || parseInt(occupants) < 1) {
      newErrors.occupants = 'Number of occupants must be at least 1';
    }
    
    if (!moveInDate.trim()) {
      newErrors.moveInDate = 'Move-in date is required';
    }
    
    if (!selectedBuildingId) {
      newErrors.buildingId = 'Building is required';
    }
    
    if (!selectedHouseId) {
      newErrors.houseId = 'House is required';
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const tenantId = await databaseService.createTenant({
        houseId: selectedHouseId!,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        occupants: parseInt(occupants),
        moveInDate,
        isActive: true,
      });
      
      Alert.alert(
        'Success',
        'Tenant added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('TenantDetail', { 
              tenantId, 
              tenantName: name.trim(),
              houseId: selectedHouseId,
              houseNumber: houses.find(h => h.id === selectedHouseId)?.houseNumber
            }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Error', 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Convert buildings to dropdown format
  const buildingItems = buildings.map(building => ({
    label: building.name,
    value: building.id!,
  }));
  
  // Convert houses to dropdown format
  const houseItems = houses.map(house => ({
    label: `${house.houseNumber} (${house.type.replace('-', ' ')})`,
    value: house.id!,
  }));
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New Tenant
      </Text>
      
      {/* Tenant Details */}
      <Input
        label="Tenant Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter tenant name"
        error={errors.name}
      />
      
      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        error={errors.phone}
      />
      
      <Input
        label="Email (Optional)"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      
      <Input
        label="Number of Occupants"
        value={occupants}
        onChangeText={setOccupants}
        placeholder="Enter number of occupants"
        keyboardType="numeric"
        error={errors.occupants}
      />
      
      <Input
        label="Move-in Date"
        value={moveInDate}
        onChangeText={setMoveInDate}
        placeholder="YYYY-MM-DD"
        error={errors.moveInDate}
      />
      
      {/* Building Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Building
      </Text>
      <View className="mb-4 z-30">
        <DropDownPicker
          open={buildingOpen}
          value={selectedBuildingId}
          items={buildingItems}
          setOpen={setBuildingOpen}
          setValue={setSelectedBuildingId}
          placeholder="Select a building"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.buildingId ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
          }}
          textStyle={{
            color: isDarkMode ? '#FFFFFF' : '#000000',
          }}
          dropDownContainerStyle={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
          }}
          listItemLabelStyle={{
            color: isDarkMode ? '#FFFFFF' : '#000000',
          }}
          disabled={buildingId !== undefined || loading}
        />
        {errors.buildingId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.buildingId}</Text>
        ) : null}
      </View>
      
      {/* House Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        House
      </Text>
      <View className="mb-4 z-20">
        <DropDownPicker
          open={houseOpen}
          value={selectedHouseId}
          items={houseItems}
          setOpen={setHouseOpen}
          setValue={setSelectedHouseId}
          placeholder="Select a house"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.houseId ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
          }}
          textStyle={{
            color: isDarkMode ? '#FFFFFF' : '#000000',
          }}
          dropDownContainerStyle={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
          }}
          listItemLabelStyle={{
            color: isDarkMode ? '#FFFFFF' : '#000000',
          }}
          disabled={houseId !== undefined || loading || houses.length === 0}
        />
        {errors.houseId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.houseId}</Text>
        ) : null}
        
        {houses.length === 0 && selectedBuildingId && (
          <Text className="text-yellow-500 text-xs mt-1">
            No available houses in this building. All houses are occupied.
          </Text>
        )}
      </View>
      
      {/* Submit Buttons */}
      <View className="flex-row mt-4 z-10">
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="lg"
          className="flex-1 mr-2"
        />
        <Button
          title="Save Tenant"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          className="flex-1 ml-2"
          disabled={houses.length === 0}
        />
      </View>
    </Container>
  );
};

export default AddTenantScreen;