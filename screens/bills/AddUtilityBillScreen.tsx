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

const billTypes = [
  { label: 'Electricity', value: 'electricity' },
  { label: 'Water', value: 'water' },
];

const AddUtilityBillScreen = () => {
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
  const [billType, setBillType] = useState<string | null>('electricity');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState('');
  
  // Dropdown open states
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [billTypeOpen, setBillTypeOpen] = useState(false);
  
  // Errors
  const [errors, setErrors] = useState({
    buildingId: '',
    billType: '',
    billDate: '',
    totalAmount: '',
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
      billType: '',
      billDate: '',
      totalAmount: '',
    };
    
    if (!selectedBuildingId) {
      newErrors.buildingId = 'Building is required';
    }
    
    if (!billType) {
      newErrors.billType = 'Bill type is required';
    }
    
    if (!billDate.trim()) {
      newErrors.billDate = 'Bill date is required';
    }
    
    if (!totalAmount.trim()) {
      newErrors.totalAmount = 'Total amount is required';
    } else if (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Total amount must be a positive number';
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
      // Create the utility bill
      const billId = await databaseService.createUtilityBill({
        buildingId: selectedBuildingId!,
        billType: billType as any,
        billDate,
        totalAmount: parseFloat(totalAmount),
        isPaid: false,
      });
      
      // Calculate bill shares for each house
      let shares: { houseId: number, amount: number }[] = [];
      
      if (billType === 'electricity') {
        shares = await databaseService.calculateElectricityBillShares(
          billId,
          parseFloat(totalAmount)
        );
      } else if (billType === 'water') {
        shares = await databaseService.calculateWaterBillShares(
          billId,
          parseFloat(totalAmount)
        );
      }
      
      // Create house bills
      for (const share of shares) {
        await databaseService.createHouseBill({
          houseId: share.houseId,
          utilityBillId: billId,
          amount: share.amount,
          isPaid: false,
        });
      }
      
      Alert.alert(
        'Success',
        'Utility bill added successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('UtilityBillDetail', { 
              billId, 
              billType: `${billType!.charAt(0).toUpperCase() + billType!.slice(1)} Bill`,
              buildingId: selectedBuildingId
            }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error adding utility bill:', error);
      Alert.alert('Error', 'Failed to add utility bill');
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
        Add New Utility Bill
      </Text>
      
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
      
      {/* Bill Type Dropdown */}
      <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Bill Type
      </Text>
      <View className="mb-4 z-20">
        <DropDownPicker
          open={billTypeOpen}
          value={billType}
          items={billTypes}
          setOpen={setBillTypeOpen}
          setValue={setBillType}
          placeholder="Select bill type"
          style={{
            backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
            borderColor: errors.billType ? '#EF4444' : (isDarkMode ? '#4B5563' : '#E5E7EB'),
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
        {errors.billType ? (
          <Text className="text-red-500 text-xs mt-1">{errors.billType}</Text>
        ) : null}
      </View>
      
      {/* Bill Date */}
      <Input
        label="Bill Date"
        value={billDate}
        onChangeText={setBillDate}
        placeholder="YYYY-MM-DD"
        error={errors.billDate}
      />
      
      {/* Total Amount */}
      <Input
        label="Total Amount"
        value={totalAmount}
        onChangeText={setTotalAmount}
        placeholder="Enter total amount"
        keyboardType="numeric"
        leftIcon={<Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>$</Text>}
        error={errors.totalAmount}
      />
      
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
          title="Save Bill"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          className="flex-1 ml-2"
        />
      </View>
    </Container>
  );
};

export default AddUtilityBillScreen;