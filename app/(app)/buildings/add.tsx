import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';

export default function AddBuildingScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    address: '',
  });
  
  // Validate form
  const validate = () => {
    const newErrors = {
      name: '',
      address: '',
    };
    
    if (!name.trim()) {
      newErrors.name = 'Building name is required';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
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
      const buildingId = await databaseService.createBuilding({
        name: name.trim(),
        address: address.trim(),
      });
      
      await dataSyncService.syncCollection('buildings');
      
      Alert.alert(
        'Success',
        'Building added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/buildings/${buildingId}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding building:', error);
      Alert.alert('Error', 'Failed to add building');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New Building
      </Text>
      
      <Input
        label="Building Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter building name"
        error={errors.name}
      />
      
      <Input
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Enter building address"
        multiline
        numberOfLines={3}
        error={errors.address}
      />
      
      <View className="flex-row mt-6">
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