import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';
import globalState from '../../../state';

export default function AddTenantScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ houseId?: string, houseNumber?: string }>();
  
  // If houseId is provided, pre-select that house
  const preSelectedHouseId = params.houseId ? Number(params.houseId) : null;
  
  const [buildings, setBuildings] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(preSelectedHouseId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occupants, setOccupants] = useState('1');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentDueDay, setRentDueDay] = useState('1');
  
  // Dropdown open states
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    buildingId: '',
    houseId: '',
    name: '',
    phone: '',
    email: '',
    occupants: '',
    moveInDate: '',
    rentDueDay: '',
  });
  
  // Load buildings and houses
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get buildings from global state
        const buildingsData = globalState.buildings.get();
        setBuildings(buildingsData);
        
        // If houseId is provided, find its building
        if (preSelectedHouseId) {
          const house = globalState.houses.find(h => h.id === preSelectedHouseId).get();
          if (house) {
            setSelectedBuildingId(house.buildingId);
            
            // Load houses for this building
            const housesData = globalState.houses.filter(h => h.buildingId === house.buildingId && (!h.isOccupied || h.id === preSelectedHouseId)).get();
            setHouses(housesData);
          }
        } else if (buildingsData.length > 0) {
          // If no houseId was provided and we have buildings, select the first one
          setSelectedBuildingId(buildingsData[0].id);
          
          // Load houses for this building
          const housesData = globalState.houses.filter(h => h.buildingId === buildingsData[0].id && !h.isOccupied).get();
          setHouses(housesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [preSelectedHouseId]);
  
  // When building selection changes, update houses
  useEffect(() => {
    if (selectedBuildingId) {
      const filteredHouses = globalState.houses.filter(h => 
        h.buildingId === selectedBuildingId && (!h.isOccupied || h.id === preSelectedHouseId)
      ).get();
      
      setHouses(filteredHouses);
      
      // If the previously selected house is not in this building, clear it
      if (selectedHouseId && !filteredHouses.some(h => h.id === selectedHouseId)) {
        setSelectedHouseId(null);
      }
    } else {
      setHouses([]);
      setSelectedHouseId(null);
    }
  }, [selectedBuildingId, preSelectedHouseId]);
  
  // Validate form
  const validate = () => {
    const newErrors = {
      buildingId: '',
      houseId: '',
      name: '',
      phone: '',
      email: '',
      occupants: '',
      moveInDate: '',
      rentDueDay: '',
    };
    
    if (!selectedBuildingId) {
      newErrors.buildingId = 'Building is required';
    }
    
    if (!selectedHouseId) {
      newErrors.houseId = 'House is required';
    }
    
    if (!name.trim()) {
      newErrors.name = 'Tenant name is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!occupants.trim()) {
      newErrors.occupants = 'Number of occupants is required';
    } else if (isNaN(parseInt(occupants)) || parseInt(occupants) <= 0) {
      newErrors.occupants = 'Occupants must be a positive number';
    }
    
    if (!moveInDate.trim()) {
      newErrors.moveInDate = 'Move-in date is required';
    }
    
    if (!rentDueDay.trim()) {
      newErrors.rentDueDay = 'Rent due day is required';
    } else if (isNaN(parseInt(rentDueDay)) || parseInt(rentDueDay) < 1 || parseInt(rentDueDay) > 31) {
      newErrors.rentDueDay = 'Rent due day must be between 1 and 31';
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    try {
      const tenantId = await databaseService.createTenant({
        houseId: selectedHouseId!,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        occupants: parseInt(occupants),
        moveInDate,
        rentDueDay: parseInt(rentDueDay),
        isActive: true,
      });
      
      await dataSyncService.syncCollection('tenants');
      await dataSyncService.syncCollection('houses');
      
      Alert.alert(
        'Success',
        'Tenant added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.push({
              pathname: `/tenants/${tenantId}`,
              params: { 
                houseId: selectedHouseId,
                houseNumber: houses.find(h => h.id === selectedHouseId)?.houseNumber
              }
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Error', 'Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };
  
  // Convert buildings to dropdown format
  const buildingItems = buildings.map(building => ({
    label: building.name,
    value: building.id,
  }));
  
  // Convert houses to dropdown format
  const houseItems = houses.map(house => ({
    label: `${house.houseNumber} (${house.type.replace('-', ' ')})`,
    value: house.id,
  }));
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New Tenant
      </Text>
      
      {/* Building Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Building
      </Text>
      <View className="mb-4 z-50">
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
          disabled={!!preSelectedHouseId || loading}
        />
        {errors.buildingId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.buildingId}</Text>
        ) : null}
      </View>
      
      {/* House Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        House
      </Text>
      <View className="mb-4 z-40">
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
          disabled={!!preSelectedHouseId || loading || !selectedBuildingId}
        />
        {errors.houseId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.houseId}</Text>
        ) : null}
        {houses.length === 0 && selectedBuildingId && !loading && (
          <Text className="text-yellow-500 text-xs mt-1">
            No vacant houses available in this building
          </Text>
        )}
      </View>
      
      {/* Tenant Name */}
      <Input
        label="Tenant Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter tenant name"
        error={errors.name}
      />
      
      {/* Phone */}
      <Input
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        error={errors.phone}
      />
      
      {/* Email (Optional) */}
      <Input
        label="Email (Optional)"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      
      {/* Number of Occupants */}
      <Input
        label="Number of Occupants"
        value={occupants}
        onChangeText={setOccupants}
        placeholder="Enter number of occupants"
        keyboardType="numeric"
        error={errors.occupants}
      />
      
      {/* Move-in Date */}
      <Input
        label="Move-in Date"
        value={moveInDate}
        onChangeText={setMoveInDate}
        placeholder="YYYY-MM-DD"
        error={errors.moveInDate}
      />
      
      {/* Rent Due Day */}
      <Input
        label="Rent Due Day (1-31)"
        value={rentDueDay}
        onChangeText={setRentDueDay}
        placeholder="Enter day of month when rent is due"
        keyboardType="numeric"
        error={errors.rentDueDay}
      />
      
      {/* Submit Buttons */}
      <View className="flex-row mt-4 z-10">
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          size="lg"
          className="flex-1 mr-2"
        />
        <Button
          title="Save Tenant"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
}