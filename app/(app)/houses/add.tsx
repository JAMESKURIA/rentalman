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

export default function AddHouseScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams<{ buildingId?: string }>();
  
  // Form state
  const [buildingId, setBuildingId] = useState<number | null>(params.buildingId ? Number(params.buildingId) : null);
  const [houseNumber, setHouseNumber] = useState('');
  const [houseTypeId, setHouseTypeId] = useState<number | null>(null);
  const [rentAmount, setRentAmount] = useState('');
  const [electricityMeterType, setElectricityMeterType] = useState('shared');
  const [waterMeterType, setWaterMeterType] = useState('shared');
  const [loading, setLoading] = useState(false);
  
  // Dropdown state
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [houseTypeOpen, setHouseTypeOpen] = useState(false);
  const [electricityMeterOpen, setElectricityMeterOpen] = useState(false);
  const [waterMeterOpen, setWaterMeterOpen] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    buildingId: '',
    houseNumber: '',
    houseTypeId: '',
    rentAmount: '',
  });
  
  // Get data from global state
  const buildings = globalState.buildings.get();
  const houseTypes = globalState.houseTypes.get();
  
  // Set default rent amount when house type changes
  useEffect(() => {
    if (houseTypeId) {
      const selectedType = houseTypes.find(type => type.id === houseTypeId);
      if (selectedType) {
        setRentAmount(selectedType.defaultRentAmount.toString());
      }
    }
  }, [houseTypeId, houseTypes]);
  
  // Validate form
  const validate = () => {
    const newErrors = {
      buildingId: '',
      houseNumber: '',
      houseTypeId: '',
      rentAmount: '',
    };
    
    if (!buildingId) {
      newErrors.buildingId = 'Building is required';
    }
    
    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
    }
    
    if (!houseTypeId) {
      newErrors.houseTypeId = 'House type is required';
    }
    
    if (!rentAmount.trim()) {
      newErrors.rentAmount = 'Rent amount is required';
    } else if (isNaN(parseFloat(rentAmount)) || parseFloat(rentAmount) <= 0) {
      newErrors.rentAmount = 'Rent amount must be a positive number';
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
      const selectedType = houseTypes.find(type => type.id === houseTypeId);
      
      const houseId = await databaseService.createHouse({
        buildingId: buildingId!,
        houseNumber: houseNumber.trim(),
        type: selectedType?.name.toLowerCase().replace(' ', '-') || 'other',
        typeId: houseTypeId!,
        rentAmount: parseFloat(rentAmount),
        isOccupied: false,
        electricityMeterType: electricityMeterType as 'shared' | 'token' | 'individual',
        waterMeterType: waterMeterType as 'shared' | 'individual',
      });
      
      await dataSyncService.syncCollection('houses');
      
      Alert.alert(
        'Success',
        'House added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/houses/${houseId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding house:', error);
      Alert.alert('Error', 'Failed to add house');
    } finally {
      setLoading(false);
    }
  };
  
  // Convert buildings to dropdown format
  const buildingItems = buildings.map(building => ({
    label: building.name,
    value: building.id!,
  }));
  
  // Convert house types to dropdown format
  const houseTypeItems = houseTypes.map(type => ({
    label: type.name,
    value: type.id!,
  }));
  
  // Electricity meter types
  const electricityMeterItems = [
    { label: 'Shared Meter', value: 'shared' },
    { label: 'Token Meter', value: 'token' },
    { label: 'Individual Meter', value: 'individual' },
  ];
  
  // Water meter types
  const waterMeterItems = [
    { label: 'Shared Meter', value: 'shared' },
    { label: 'Individual Meter', value: 'individual' },
  ];
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New House
      </Text>
      
      {/* Building Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Building
      </Text>
      <View className="mb-4 z-50">
        <DropDownPicker
          open={buildingOpen}
          value={buildingId}
          items={buildingItems}
          setOpen={setBuildingOpen}
          setValue={setBuildingId}
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
          disabled={!!params.buildingId}
        />
        {errors.buildingId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.buildingId}</Text>
        ) : null}
      </View>
      
      {/* House Number */}
      <Input
        label="House Number"
        value={houseNumber}
        onChangeText={setHouseNumber}
        placeholder="e.g., A1, 101, etc."
        error={errors.houseNumber}
      />
      
      {/* House Type Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        House Type
      </Text>
      <View className="mb-4 z-40">
        <DropDownPicker
          open={houseTypeOpen}
          value={houseTypeId}
          items={houseTypeItems}
          setOpen={setHouseTypeOpen}
          setValue={setHouseTypeId}
          placeholder="Select a house type"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.houseTypeId ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
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
        />
        {errors.houseTypeId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.houseTypeId}</Text>
        ) : null}
      </View>
      
      {/* Rent Amount */}
      <Input
        label="Rent Amount"
        value={rentAmount}
        onChangeText={setRentAmount}
        placeholder="Enter rent amount"
        keyboardType="numeric"
        leftIcon={<Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>$</Text>}
        error={errors.rentAmount}
      />
      
      {/* Electricity Meter Type */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Electricity Meter Type
      </Text>
      <View className="mb-4 z-30">
        <DropDownPicker
          open={electricityMeterOpen}
          value={electricityMeterType}
          items={electricityMeterItems}
          setOpen={setElectricityMeterOpen}
          setValue={setElectricityMeterType}
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
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
        />
      </View>
      
      {/* Water Meter Type */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Water Meter Type
      </Text>
      <View className="mb-4 z-20">
        <DropDownPicker
          open={waterMeterOpen}
          value={waterMeterType}
          items={waterMeterItems}
          setOpen={setWaterMeterOpen}
          setValue={setWaterMeterType}
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
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
        />
      </View>
      
      {/* Submit Buttons */}
      <View className="flex-row mt-6 z-10">
        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="outline"
          size="lg"
          className="flex-1 mr-2"
        />
        <Button
          title="Save"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
}