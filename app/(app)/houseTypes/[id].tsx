import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';
import globalState from '../../../state';

export default function EditHouseTypeScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [name, setName] = useState('');
  const [defaultRentAmount, setDefaultRentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    defaultRentAmount: '',
  });
  
  // Load house type data
  useEffect(() => {
    const loadHouseType = async () => {
      try {
        setLoading(true);
        
        // Get house type from global state
        const houseType = globalState.houseTypes.find(t => t.id === Number(id)).get();
        
        if (houseType) {
          setName(houseType.name);
          setDefaultRentAmount(houseType.defaultRentAmount.toString());
        } else {
          // If not in global state, fetch from database
          const houseTypeData = await databaseService.getHouseTypeById(Number(id));
          
          if (houseTypeData) {
            setName(houseTypeData.name);
            setDefaultRentAmount(houseTypeData.defaultRentAmount.toString());
          } else {
            Alert.alert('Error', 'House type not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error loading house type:', error);
        Alert.alert('Error', 'Failed to load house type');
      } finally {
        setLoading(false);
      }
    };
    
    loadHouseType();
  }, [id]);
  
  // Validate form
  const validate = () => {
    const newErrors = {
      name: '',
      defaultRentAmount: '',
    };
    
    if (!name.trim()) {
      newErrors.name = 'House type name is required';
    }
    
    if (!defaultRentAmount.trim()) {
      newErrors.defaultRentAmount = 'Default rent amount is required';
    } else if (isNaN(parseFloat(defaultRentAmount)) || parseFloat(defaultRentAmount) <= 0) {
      newErrors.defaultRentAmount = 'Default rent amount must be a positive number';
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
      await databaseService.updateHouseType({
        id: Number(id),
        name: name.trim(),
        defaultRentAmount: parseFloat(defaultRentAmount),
      });
      
      await dataSyncService.syncCollection('houseTypes');
      
      Alert.alert(
        'Success',
        'House type updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating house type:', error);
      Alert.alert('Error', 'Failed to update house type');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Edit House Type
      </Text>
      
      <Input
        label="House Type Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Bedsitter, One Bedroom"
        error={errors.name}
      />
      
      <Input
        label="Default Rent Amount"
        value={defaultRentAmount}
        onChangeText={setDefaultRentAmount}
        placeholder="Enter default rent amount"
        keyboardType="numeric"
        leftIcon={<Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>$</Text>}
        error={errors.defaultRentAmount}
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