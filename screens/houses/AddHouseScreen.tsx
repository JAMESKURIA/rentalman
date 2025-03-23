import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import databaseService, { Building } from '../../services/DatabaseService';

const houseTypes = [
  { label: 'Bedsitter', value: 'bedsitter' },
  { label: 'Single', value: 'single' },
  { label: 'One Bedroom', value: 'one-bedroom' },
  { label: 'Two Bedroom', value: 'two-bedroom' },
  { label: 'Own Compound', value: 'own-compound' },
];

const electricityMeterTypes = [
  { label: 'Shared Meter', value: 'shared' },
  { label: 'Token Meter', value: 'token' },
];

const waterMeterTypes = [
  { label: 'Individual Meter', value: 'individual' },
  { label: 'Shared Meter', value: 'shared' },
];

const AddHouseScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  // If buildingId is provided, pre-select that building
  const { buildingId } = route.params as { buildingId?: number } || {};
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(buildingId || null);
  const [houseNumber, setHouseNumber] = useState('');
  const [houseType, setHouseType] = useState<string | null>('bedsitter');
  const [rentAmount, setRentAmount] = useState('');
  const [electricityMeterType, setElectricityMeterType] = useState<string | null>('shared');
  const [waterMeterType, setWaterMeterType] = useState<string | null>('shared');
  
  // Dropdown open states
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [houseTypeOpen, setHouseTypeOpen] = useState(false);
  const [electricityMeterOpen, setElectricityMeterOpen] = useState(false);
  const [waterMeterOpen, setWaterMeterOpen] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    buildingId: '',
    houseNumber: '',
    houseType: '',
    rentAmount: '',
    electricityMeterType: '',
    waterMeterType: '',
  });
  
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        const data = await databaseService.getBuildings();
        setBuildings(data);
        
        // If no buildingId was provided and we have buildings, select the first one
        if (!buildingId && data.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(data[0].id!);
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
        Alert.alert('Error', 'Failed to load buildings');
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
  }, [buildingId]);
  
  const validate = () => {
    const newErrors = {
      buildingId: '',
      houseNumber: '',
      houseType: '',
      rentAmount: '',
      electricityMeterType: '',
      waterMeterType: '',
    };
    
    if (!selectedBuildingId) {
      newErrors.buildingId = 'Building is required';
    }
    
    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
    }
    
    if (!houseType) {
      newErrors.houseType = 'House type is required';
    }
    
    if (!rentAmount.trim()) {
      newErrors.rentAmount = 'Rent amount is required';
    } else if (isNaN(parseFloat(rentAmount)) || parseFloat(rentAmount) <= 0) {
      newErrors.rentAmount = 'Rent amount must be a positive number';
    }
    
    if (!electricityMeterType) {
      newErrors.electricityMeterType = 'Electricity meter type is required';
    }
    
    if (!waterMeterType) {
      newErrors.waterMeterType = 'Water meter type is required';
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
      const houseId = await databaseService.createHouse({
        buildingId: selectedBuildingId!,
        houseNumber: houseNumber.trim(),
        type: houseType as any,
        rentAmount: parseFloat(rentAmount),
        isOccupied: false,
        electricityMeterType: electricityMeterType as any,
        waterMeterType: waterMeterType as any,
      });
      
      Alert.alert(
        'Success',
        'House added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('HouseDetail', { 
              houseId, 
              houseNumber: houseNumber.trim(),
              buildingId: selectedBuildingId
            }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error adding house:', error);
      Alert.alert('Error', 'Failed to add house');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Convert buildings to dropdown format
  const buildingItems = buildings.map(building => ({
    label: building.name,
    value: building.id!,
  }));
  
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
          value={houseType}
          items={houseTypes}
          setOpen={setHouseTypeOpen}
          setValue={setHouseType}
          placeholder="Select house type"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.houseType ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
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
        {errors.houseType ? (
          <Text className="text-red-500 text-xs mt-1">{errors.houseType}</Text>
        ) : null}
      </View>
      
      {/* Rent Amount */}
      <Input
        label="Monthly Rent Amount"
        value={rentAmount}
        onChangeText={setRentAmount}
        placeholder="Enter amount"
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
          items={electricityMeterTypes}
          setOpen={setElectricityMeterOpen}
          setValue={setElectricityMeterType}
          placeholder="Select electricity meter type"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.electricityMeterType ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
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
        {errors.electricityMeterType ? (
          <Text className="text-red-500 text-xs mt-1">{errors.electricityMeterType}</Text>
        ) : null}
      </View>
      
      {/* Water Meter Type */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Water Meter Type
      </Text>
      <View className="mb-4 z-20">
        <DropDownPicker
          open={waterMeterOpen}
          value={waterMeterType}
          items={waterMeterTypes}
          setOpen={setWaterMeterOpen}
          setValue={setWaterMeterType}
          placeholder="Select water meter type"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.waterMeterType ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
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
        {errors.waterMeterType ? (
          <Text className="text-red-500 text-xs mt-1">{errors.waterMeterType}</Text>
        ) : null}
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
          title="Save House"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
};

export default AddHouseScreen;