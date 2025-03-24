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

export default function EditServiceScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Form state
  const [houseId, setHouseId] = useState<number | null>(null);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dropdown state
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [houses, setHouses] = useState<any[]>([]);
  
  // Errors
  const [errors, setErrors] = useState({
    houseId: '',
    serviceType: '',
    serviceDate: '',
    cost: '',
  });
  
  // Get data from global state
  const buildings = globalState.buildings.get();
  const allHouses = globalState.houses.get();
  const serviceProviders = globalState.serviceProviders.get();
  const serviceRecords = globalState.serviceRecords.get();
  
  // Load service record data
  useEffect(() => {
    const loadServiceRecord = async () => {
      try {
        setLoading(true);
        
        // Get service record from global state
        const record = serviceRecords.find(r => r.id === Number(id));
        
        if (record) {
          setHouseId(record.houseId);
          setProviderId(record.providerId || null);
          setServiceType(record.serviceType);
          setServiceDate(record.serviceDate);
          setCost(record.cost.toString());
          setNotes(record.notes || '');
          
          // Find the building for this house
          const house = allHouses.find(h => h.id === record.houseId);
          if (house) {
            setSelectedBuildingId(house.buildingId);
          }
        } else {
          // If not in global state, fetch from database
          const recordData = await databaseService.getServiceRecordById(Number(id));
          
          if (recordData) {
            setHouseId(recordData.houseId);
            setProviderId(recordData.providerId || null);
            setServiceType(recordData.serviceType);
            setServiceDate(recordData.serviceDate);
            setCost(recordData.cost.toString());
            setNotes(recordData.notes || '');
            
            // Find the building for this house
            const house = await databaseService.getHouseById(recordData.houseId);
            if (house) {
              setSelectedBuildingId(house.buildingId);
            }
          } else {
            Alert.alert('Error', 'Service record not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error loading service record:', error);
        Alert.alert('Error', 'Failed to load service record');
      } finally {
        setLoading(false);
      }
    };
    
    loadServiceRecord();
  }, [id]);
  
  // Load houses when building selection changes
  useEffect(() => {
    if (selectedBuildingId) {
      const filteredHouses = allHouses.filter(h => h.buildingId === selectedBuildingId);
      setHouses(filteredHouses);
    } else {
      setHouses([]);
    }
  }, [selectedBuildingId, allHouses]);
  
  // Validate form
  const validate = () => {
    const newErrors = {
      houseId: '',
      serviceType: '',
      serviceDate: '',
      cost: '',
    };
    
    if (!houseId) {
      newErrors.houseId = 'House is required';
    }
    
    if (!serviceType.trim()) {
      newErrors.serviceType = 'Service type is required';
    }
    
    if (!serviceDate.trim()) {
      newErrors.serviceDate = 'Service date is required';
    }
    
    if (!cost.trim()) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
      newErrors.cost = 'Cost must be a valid number';
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
      await databaseService.updateServiceRecord({
        id: Number(id),
        houseId: houseId!,
        serviceType: serviceType.trim(),
        serviceDate,
        cost: parseFloat(cost),
        providerId: providerId || undefined,
        notes: notes.trim() || undefined,
      });
      
      await dataSyncService.syncCollection('serviceRecords');
      
      Alert.alert(
        'Success',
        'Service record updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating service record:', error);
      Alert.alert('Error', 'Failed to update service record');
    } finally {
      setLoading(false);
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
  
  // Convert service providers to dropdown format
  const providerItems = serviceProviders.map(provider => ({
    label: `${provider.name} (${provider.serviceType})`,
    value: provider.id!,
  }));
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Edit Service Record
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
      
      {/* House Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        House
      </Text>
      <View className="mb-4 z-40">
        <DropDownPicker
          open={houseOpen}
          value={houseId}
          items={houseItems}
          setOpen={setHouseOpen}
          setValue={setHouseId}
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
          disabled={!selectedBuildingId}
        />
        {errors.houseId ? (
          <Text className="text-red-500 text-xs mt-1">{errors.houseId}</Text>
        ) : null}
      </View>
      
      {/* Service Provider Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Service Provider (Optional)
      </Text>
      <View className="mb-4 z-30">
        <DropDownPicker
          open={providerOpen}
          value={providerId}
          items={providerItems}
          setOpen={setProviderOpen}
          setValue={setProviderId}
          placeholder="Select a service provider"
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
      
      {/* Service Type */}
      <Input
        label="Service Type"
        value={serviceType}
        onChangeText={setServiceType}
        placeholder="e.g., Plumbing, Electrical, Cleaning"
        error={errors.serviceType}
      />
      
      {/* Service Date */}
      <Input
        label="Service Date"
        value={serviceDate}
        onChangeText={setServiceDate}
        placeholder="YYYY-MM-DD"
        error={errors.serviceDate}
      />
      
      {/* Cost */}
      <Input
        label="Cost"
        value={cost}
        onChangeText={setCost}
        placeholder="Enter cost"
        keyboardType="numeric"
        leftIcon={<Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>$</Text>}
        error={errors.cost}
      />
      
      {/* Notes */}
      <Input
        label="Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Enter any additional notes"
        multiline
        numberOfLines={3}
      />
      
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
          title="Save Changes"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
}