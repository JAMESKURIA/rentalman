import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../utils/ThemeContext';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import databaseService from '../../services/DatabaseService';

const AddBuildingScreen = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useTheme();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    address: '',
  });
  
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
    return !newErrors.name && !newErrors.address;
  };
  
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
      
      Alert.alert(
        'Success',
        'Building added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('BuildingDetail', { 
              buildingId, 
              buildingName: name.trim() 
            }) 
          }
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
    <Container>
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
      
      <View className="flex-row mt-4">
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="lg"
          className="flex-1 mr-2"
        />
        <Button
          title="Save Building"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
};

export default AddBuildingScreen;