import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../utils/ThemeContext';
import Container from '../../../components/Container';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import fileImportService from '../../../services/FileImportService';
import dataSyncService from '../../../services/DataSyncService';

export default function ImportDataScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<'houses' | 'tenants' | null>(null);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  
  // Handle file selection and import
  const handleImport = async (type: 'houses' | 'tenants') => {
    try {
      setLoading(true);
      setImportType(type);
      setResult(null);
      
      // Pick Excel file
      const fileResult = await fileImportService.pickExcelFile();
      
      if (fileResult.canceled || !fileResult.assets || fileResult.assets.length === 0) {
        setLoading(false);
        return;
      }
      
      const uri = fileResult.assets[0].uri;
      
      // Import data based on type
      let importResult;
      if (type === 'houses') {
        importResult = await fileImportService.importHouses(uri);
      } else {
        importResult = await fileImportService.importTenants(uri);
      }
      
      setResult(importResult);
      
      // Sync data with global state
      if (type === 'houses') {
        await dataSyncService.syncCollection('houses');
      } else {
        await dataSyncService.syncCollection('tenants');
      }
      
      Alert.alert(
        'Import Complete',
        `Successfully imported ${importResult.success} ${type}. Failed: ${importResult.failed}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error(`Error importing ${type}:`, error);
      Alert.alert('Error', `Failed to import ${type}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container scrollable>
      <Text className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Import Data
      </Text>
      
      <Card className="mb-6">
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Import Houses
        </Text>
        
        <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Import houses from an Excel file (.xlsx) or CSV file. The file should have the following columns:
        </Text>
        
        <View className="bg-gray-100 p-3 rounded-md mb-4">
          <Text className="text-gray-800 font-mono text-xs">
            buildingId, houseNumber, type, typeId (optional), rentAmount, isOccupied (optional), electricityMeterType (optional), waterMeterType (optional)
          </Text>
        </View>
        
        <Button
          title="Import Houses"
          onPress={() => handleImport('houses')}
          loading={loading && importType === 'houses'}
          icon={<Ionicons name="cloud-upload-outline" size={18} color="white" />}
          size="md"
          fullWidth
        />
      </Card>
      
      <Card className="mb-6">
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Import Tenants
        </Text>
        
        <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Import tenants from an Excel file (.xlsx) or CSV file. The file should have the following columns:
        </Text>
        
        <View className="bg-gray-100 p-3 rounded-md mb-4">
          <Text className="text-gray-800 font-mono text-xs">
            houseId, name, phone, email (optional), occupants (optional), moveInDate (optional), isActive (optional), rentDueDay (optional)
          </Text>
        </View>
        
        <Button
          title="Import Tenants"
          onPress={() => handleImport('tenants')}
          loading={loading && importType === 'tenants'}
          icon={<Ionicons name="cloud-upload-outline" size={18} color="white" />}
          size="md"
          fullWidth
        />
      </Card>
      
      {result && (
        <Card className="mb-6">
          <Text className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Import Results
          </Text>
          
          <View className="flex-row justify-between mb-1">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Successfully imported:
            </Text>
            <Text className="text-green-600 font-bold">
              {result.success}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Failed to import:
            </Text>
            <Text className="text-red-600 font-bold">
              {result.failed}
            </Text>
          </View>
        </Card>
      )}
      
      <Card className="mb-6">
        <Text className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Sample Files
        </Text>
        
        <Text className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          You can download sample Excel files to see the required format:
        </Text>
        
        <View className="flex-row justify-between mb-2">
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="document-outline" size={20} color="#3B82F6" />
            <Text className="text-primary ml-2">Sample Houses.xlsx</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="document-outline" size={20} color="#3B82F6" />
            <Text className="text-primary ml-2">Sample Tenants.xlsx</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Container>
  );
}