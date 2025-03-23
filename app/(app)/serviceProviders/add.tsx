import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import databaseService from '../../../services/DatabaseService';
import dataSyncService from '../../../services/DataSyncService';

export default function AddServiceProviderScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: '',
  });
  
  // Validate form
  const validate = () => {
    const newErrors = {
      name: '',
      phone: '',
      email: '',
      serviceType: '',
    };
    
    if (!name.trim()) {
      newErrors.name = 'Provider name is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!serviceType.trim()) {
      newErrors.serviceType = 'Service type is required';
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
      await databaseService.createServiceProvider({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        serviceType: serviceType.trim(),
      });
      
      await dataSyncService.syncCollection('serviceProviders');
      
      Alert.alert(
        'Success',
        'Service provider added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding service provider:', error);
      Alert.alert('Error', 'Failed to add service provider');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Add New Service Provider
      </Text>
      
      <Input
        label="Provider Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter provider name"
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
        label="Service Type"
        value={serviceType}
        onChangeText={setServiceType}
        placeholder="e.g., Plumbing, Electrical, Cleaning"
        error={errors.serviceType}
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