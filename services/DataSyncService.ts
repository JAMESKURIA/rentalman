import databaseService from './DatabaseService';
import globalState from '../state';

class DataSyncService {
  // Load all data from SQLite into LegendState
  async loadAllData(): Promise<void> {
    try {
      globalState.ui.loading.set(true);
      
      // Load buildings
      const buildings = await databaseService.getBuildings();
      globalState.buildings.set(buildings);
      
      // Load house types
      const houseTypes = await databaseService.getHouseTypes();
      globalState.houseTypes.set(houseTypes);
      
      // Load houses
      let allHouses = [];
      for (const building of buildings) {
        const houses = await databaseService.getHousesByBuildingId(building.id!);
        allHouses = [...allHouses, ...houses];
      }
      globalState.houses.set(allHouses);
      
      // Load tenants
      let allTenants = [];
      for (const house of allHouses) {
        const tenants = await databaseService.getTenantsByHouseId(house.id!);
        allTenants = [...allTenants, ...tenants];
      }
      globalState.tenants.set(allTenants);
      
      // Load utility bills
      let allUtilityBills = [];
      for (const building of buildings) {
        const bills = await databaseService.getUtilityBillsByBuildingId(building.id!);
        allUtilityBills = [...allUtilityBills, ...bills];
      }
      globalState.utilityBills.set(allUtilityBills);
      
      // Load house bills
      let allHouseBills = [];
      for (const house of allHouses) {
        const bills = await databaseService.getHouseBillsByHouseId(house.id!);
        allHouseBills = [...allHouseBills, ...bills];
      }
      globalState.houseBills.set(allHouseBills);
      
      // Load service providers
      const serviceProviders = await databaseService.getServiceProviders();
      globalState.serviceProviders.set(serviceProviders);
      
      // Load service records
      let allServiceRecords = [];
      for (const house of allHouses) {
        const records = await databaseService.getServiceRecordsByHouseId(house.id!);
        allServiceRecords = [...allServiceRecords, ...records];
      }
      globalState.serviceRecords.set(allServiceRecords);
      
      // Load reminder settings
      const reminderSettings = await databaseService.getReminderSettings();
      if (reminderSettings) {
        globalState.settings.rentReminders.set({
          enabled: reminderSettings.enabled,
          daysBeforeDue: reminderSettings.daysBeforeDue,
          reminderTime: reminderSettings.reminderTime,
        });
      }
      
      globalState.ui.loading.set(false);
    } catch (error) {
      console.error('Error loading data:', error);
      globalState.ui.error.set('Failed to load data');
      globalState.ui.loading.set(false);
    }
  }
  
  // Sync a specific collection
  async syncCollection(collection: string): Promise<void> {
    try {
      switch (collection) {
        case 'buildings':
          const buildings = await databaseService.getBuildings();
          globalState.buildings.set(buildings);
          break;
          
        case 'houseTypes':
          const houseTypes = await databaseService.getHouseTypes();
          globalState.houseTypes.set(houseTypes);
          break;
          
        case 'houses':
          let allHouses = [];
          const buildings2 = globalState.buildings.get();
          for (const building of buildings2) {
            const houses = await databaseService.getHousesByBuildingId(building.id!);
            allHouses = [...allHouses, ...houses];
          }
          globalState.houses.set(allHouses);
          break;
          
        case 'tenants':
          let allTenants = [];
          const houses = globalState.houses.get();
          for (const house of houses) {
            const tenants = await databaseService.getTenantsByHouseId(house.id!);
            allTenants = [...allTenants, ...tenants];
          }
          globalState.tenants.set(allTenants);
          break;
          
        case 'utilityBills':
          let allUtilityBills = [];
          const buildings3 = globalState.buildings.get();
          for (const building of buildings3) {
            const bills = await databaseService.getUtilityBillsByBuildingId(building.id!);
            allUtilityBills = [...allUtilityBills, ...bills];
          }
          globalState.utilityBills.set(allUtilityBills);
          break;
          
        case 'houseBills':
          let allHouseBills = [];
          const houses2 = globalState.houses.get();
          for (const house of houses2) {
            const bills = await databaseService.getHouseBillsByHouseId(house.id!);
            allHouseBills = [...allHouseBills, ...bills];
          }
          globalState.houseBills.set(allHouseBills);
          break;
          
        case 'serviceProviders':
          const serviceProviders = await databaseService.getServiceProviders();
          globalState.serviceProviders.set(serviceProviders);
          break;
          
        case 'serviceRecords':
          let allServiceRecords = [];
          const houses3 = globalState.houses.get();
          for (const house of houses3) {
            const records = await databaseService.getServiceRecordsByHouseId(house.id!);
            allServiceRecords = [...allServiceRecords, ...records];
          }
          globalState.serviceRecords.set(allServiceRecords);
          break;
          
        case 'reminderSettings':
          const reminderSettings = await databaseService.getReminderSettings();
          if (reminderSettings) {
            globalState.settings.rentReminders.set({
              enabled: reminderSettings.enabled,
              daysBeforeDue: reminderSettings.daysBeforeDue,
              reminderTime: reminderSettings.reminderTime,
            });
          }
          break;
          
        default:
          console.warn(`Unknown collection: ${collection}`);
      }
    } catch (error) {
      console.error(`Error syncing ${collection}:`, error);
      globalState.ui.error.set(`Failed to sync ${collection}`);
    }
  }
}

export const dataSyncService = new DataSyncService();
export default dataSyncService;