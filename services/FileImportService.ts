import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import databaseService, { House, Tenant } from './DatabaseService';

class FileImportService {
  // Pick an Excel file
  async pickExcelFile(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });
      
      return result;
    } catch (error) {
      console.error('Error picking file:', error);
      throw error;
    }
  }
  
  // Parse Excel file
  async parseExcelFile(uri: string): Promise<any[]> {
    try {
      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Parse the workbook
      const workbook = XLSX.read(fileContent, { type: 'base64' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return data;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw error;
    }
  }
  
  // Import houses from Excel
  async importHouses(uri: string): Promise<{ success: number; failed: number }> {
    try {
      const data = await this.parseExcelFile(uri);
      
      // Map the data to House objects
      const houses: Partial<House>[] = data.map(row => {
        return {
          buildingId: Number(row.buildingId),
          houseNumber: String(row.houseNumber),
          type: String(row.type),
          typeId: row.typeId ? Number(row.typeId) : undefined,
          rentAmount: Number(row.rentAmount),
          isOccupied: row.isOccupied === 'true' || row.isOccupied === true || row.isOccupied === 1,
          electricityMeterType: row.electricityMeterType || 'shared',
          waterMeterType: row.waterMeterType || 'shared',
        };
      });
      
      // Import the houses
      return await databaseService.bulkImportHouses(houses);
    } catch (error) {
      console.error('Error importing houses:', error);
      throw error;
    }
  }
  
  // Import tenants from Excel
  async importTenants(uri: string): Promise<{ success: number; failed: number }> {
    try {
      const data = await this.parseExcelFile(uri);
      
      // Map the data to Tenant objects
      const tenants: Partial<Tenant>[] = data.map(row => {
        return {
          houseId: Number(row.houseId),
          name: String(row.name),
          phone: String(row.phone),
          email: row.email ? String(row.email) : undefined,
          occupants: row.occupants ? Number(row.occupants) : 1,
          moveInDate: row.moveInDate ? String(row.moveInDate) : new Date().toISOString().split('T')[0],
          isActive: row.isActive === 'true' || row.isActive === true || row.isActive === 1,
          rentDueDay: row.rentDueDay ? Number(row.rentDueDay) : 1,
        };
      });
      
      // Import the tenants
      return await databaseService.bulkImportTenants(tenants);
    } catch (error) {
      console.error('Error importing tenants:', error);
      throw error;
    }
  }
}

export const fileImportService = new FileImportService();
export default fileImportService;