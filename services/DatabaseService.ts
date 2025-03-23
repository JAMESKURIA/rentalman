import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { HouseType } from '../state';

export interface Building {
  id?: number;
  name: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface House {
  id?: number;
  buildingId: number;
  houseNumber: string;
  type: string;
  typeId?: number;
  rentAmount: number;
  isOccupied: boolean;
  electricityMeterType: 'shared' | 'token' | 'individual';
  waterMeterType: 'individual' | 'shared';
  createdAt?: string;
  updatedAt?: string;
}

export interface Tenant {
  id?: number;
  houseId: number;
  name: string;
  phone: string;
  email?: string;
  occupants: number;
  moveInDate: string;
  moveOutDate?: string;
  isActive: boolean;
  rentDueDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UtilityBill {
  id?: number;
  buildingId: number;
  billType: 'electricity' | 'water';
  billDate: string;
  totalAmount: number;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseBill {
  id?: number;
  houseId: number;
  utilityBillId: number;
  amount: number;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceProvider {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  serviceType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRecord {
  id?: number;
  houseId: number;
  serviceType: string;
  serviceDate: string;
  cost: number;
  providerId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderSettings {
  id?: number;
  enabled: boolean;
  daysBeforeDue: number;
  reminderTime: string;
  createdAt?: string;
  updatedAt?: string;
}

class DatabaseService {
  private database: SQLite.SQLiteDatabase;
  private databaseName = 'RentalManager.db';

  constructor() {
    this.database = SQLite.openDatabase(this.databaseName);
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  private async createTables(): Promise<void> {
    const createTablesQueries = [
      `CREATE TABLE IF NOT EXISTS buildings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS houseTypes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        defaultRentAmount REAL NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS houses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buildingId INTEGER NOT NULL,
        houseNumber TEXT NOT NULL,
        type TEXT NOT NULL,
        typeId INTEGER,
        rentAmount REAL NOT NULL,
        isOccupied INTEGER NOT NULL DEFAULT 0,
        electricityMeterType TEXT NOT NULL,
        waterMeterType TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buildingId) REFERENCES buildings (id) ON DELETE CASCADE,
        FOREIGN KEY (typeId) REFERENCES houseTypes (id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        houseId INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        occupants INTEGER NOT NULL DEFAULT 1,
        moveInDate TEXT NOT NULL,
        moveOutDate TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        rentDueDay INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (houseId) REFERENCES houses (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS utilityBills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buildingId INTEGER NOT NULL,
        billType TEXT NOT NULL,
        billDate TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        isPaid INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buildingId) REFERENCES buildings (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS houseBills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        houseId INTEGER NOT NULL,
        utilityBillId INTEGER NOT NULL,
        amount REAL NOT NULL,
        isPaid INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (houseId) REFERENCES houses (id) ON DELETE CASCADE,
        FOREIGN KEY (utilityBillId) REFERENCES utilityBills (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS serviceProviders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        serviceType TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS serviceRecords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        houseId INTEGER NOT NULL,
        serviceType TEXT NOT NULL,
        serviceDate TEXT NOT NULL,
        cost REAL NOT NULL,
        providerId INTEGER,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (houseId) REFERENCES houses (id) ON DELETE CASCADE,
        FOREIGN KEY (providerId) REFERENCES serviceProviders (id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS reminderSettings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER NOT NULL DEFAULT 1,
        daysBeforeDue INTEGER NOT NULL DEFAULT 3,
        reminderTime TEXT NOT NULL DEFAULT '09:00',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    try {
      for (const query of createTablesQueries) {
        await this.executeSql(query, []);
      }
      
      // Insert default house types if none exist
      const houseTypesCount = await this.executeSql('SELECT COUNT(*) as count FROM houseTypes', []);
      if (houseTypesCount.rows.item(0).count === 0) {
        const defaultHouseTypes = [
          { name: 'Bedsitter', defaultRentAmount: 5000 },
          { name: 'Single Room', defaultRentAmount: 4000 },
          { name: 'One Bedroom', defaultRentAmount: 8000 },
          { name: 'Two Bedroom', defaultRentAmount: 12000 },
          { name: 'Own Compound', defaultRentAmount: 15000 },
        ];
        
        for (const type of defaultHouseTypes) {
          await this.createHouseType(type);
        }
      }
      
      // Insert default reminder settings if none exist
      const reminderSettingsCount = await this.executeSql('SELECT COUNT(*) as count FROM reminderSettings', []);
      if (reminderSettingsCount.rows.item(0).count === 0) {
        await this.executeSql(
          'INSERT INTO reminderSettings (enabled, daysBeforeDue, reminderTime) VALUES (?, ?, ?)',
          [1, 3, '09:00']
        );
      }
      
      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Helper method to execute SQL queries
  private executeSql(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.database.transaction(tx => {
        tx.executeSql(
          sql, 
          params,
          (_, result) => resolve(result),
          (_, error) => {
            console.error('SQL Error:', sql, error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Building CRUD operations
  async createBuilding(building: Building): Promise<number> {
    try {
      const { name, address } = building;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        'INSERT INTO buildings (name, address, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [name, address, now, now]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating building:', error);
      throw error;
    }
  }

  async getBuildings(): Promise<Building[]> {
    try {
      const result = await this.executeSql('SELECT * FROM buildings ORDER BY name');
      
      const buildings: Building[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        buildings.push(result.rows.item(i));
      }
      
      return buildings;
    } catch (error) {
      console.error('Error getting buildings:', error);
      throw error;
    }
  }

  async getBuildingById(id: number): Promise<Building | null> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM buildings WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting building by ID:', error);
      throw error;
    }
  }

  async updateBuilding(building: Building): Promise<void> {
    try {
      const { id, name, address } = building;
      const now = new Date().toISOString();
      
      await this.executeSql(
        'UPDATE buildings SET name = ?, address = ?, updatedAt = ? WHERE id = ?',
        [name, address, now, id]
      );
    } catch (error) {
      console.error('Error updating building:', error);
      throw error;
    }
  }

  async deleteBuilding(id: number): Promise<void> {
    try {
      await this.executeSql(
        'DELETE FROM buildings WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting building:', error);
      throw error;
    }
  }

  // House Type CRUD operations
  async createHouseType(houseType: HouseType): Promise<number> {
    try {
      const { name, defaultRentAmount } = houseType;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        'INSERT INTO houseTypes (name, defaultRentAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [name, defaultRentAmount, now, now]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating house type:', error);
      throw error;
    }
  }

  async getHouseTypes(): Promise<HouseType[]> {
    try {
      const result = await this.executeSql('SELECT * FROM houseTypes ORDER BY name');
      
      const houseTypes: HouseType[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        houseTypes.push(result.rows.item(i));
      }
      
      return houseTypes;
    } catch (error) {
      console.error('Error getting house types:', error);
      throw error;
    }
  }

  async getHouseTypeById(id: number): Promise<HouseType | null> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM houseTypes WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting house type by ID:', error);
      throw error;
    }
  }

  async updateHouseType(houseType: HouseType): Promise<void> {
    try {
      const { id, name, defaultRentAmount } = houseType;
      const now = new Date().toISOString();
      
      await this.executeSql(
        'UPDATE houseTypes SET name = ?, defaultRentAmount = ?, updatedAt = ? WHERE id = ?',
        [name, defaultRentAmount, now, id]
      );
    } catch (error) {
      console.error('Error updating house type:', error);
      throw error;
    }
  }

  async deleteHouseType(id: number): Promise<void> {
    try {
      await this.executeSql(
        'DELETE FROM houseTypes WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting house type:', error);
      throw error;
    }
  }

  // House CRUD operations
  async createHouse(house: House): Promise<number> {
    try {
      const { 
        buildingId, 
        houseNumber, 
        type, 
        typeId,
        rentAmount, 
        isOccupied, 
        electricityMeterType, 
        waterMeterType 
      } = house;
      
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO houses (
          buildingId, 
          houseNumber, 
          type, 
          typeId,
          rentAmount, 
          isOccupied, 
          electricityMeterType, 
          waterMeterType, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          buildingId, 
          houseNumber, 
          type, 
          typeId || null,
          rentAmount, 
          isOccupied ? 1 : 0, 
          electricityMeterType, 
          waterMeterType, 
          now, 
          now
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating house:', error);
      throw error;
    }
  }

  async getHousesByBuildingId(buildingId: number): Promise<House[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM houses WHERE buildingId = ? ORDER BY houseNumber',
        [buildingId]
      );
      
      const houses: House[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const house = result.rows.item(i);
        houses.push({
          ...house,
          isOccupied: !!house.isOccupied // Convert to boolean
        });
      }
      
      return houses;
    } catch (error) {
      console.error('Error getting houses by building ID:', error);
      throw error;
    }
  }

  async getHouseById(id: number): Promise<House | null> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM houses WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const house = result.rows.item(0);
      return {
        ...house,
        isOccupied: !!house.isOccupied // Convert to boolean
      };
    } catch (error) {
      console.error('Error getting house by ID:', error);
      throw error;
    }
  }

  async updateHouse(house: House): Promise<void> {
    try {
      const { 
        id, 
        buildingId, 
        houseNumber, 
        type, 
        typeId,
        rentAmount, 
        isOccupied, 
        electricityMeterType, 
        waterMeterType 
      } = house;
      
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE houses SET 
          buildingId = ?, 
          houseNumber = ?, 
          type = ?, 
          typeId = ?,
          rentAmount = ?, 
          isOccupied = ?, 
          electricityMeterType = ?, 
          waterMeterType = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          buildingId, 
          houseNumber, 
          type, 
          typeId || null,
          rentAmount, 
          isOccupied ? 1 : 0, 
          electricityMeterType, 
          waterMeterType, 
          now, 
          id
        ]
      );
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  }

  async deleteHouse(id: number): Promise<void> {
    try {
      await this.executeSql(
        'DELETE FROM houses WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  }

  // Tenant CRUD operations
  async createTenant(tenant: Tenant): Promise<number> {
    try {
      const { 
        houseId, 
        name, 
        phone, 
        email, 
        occupants, 
        moveInDate, 
        isActive,
        rentDueDay = 1
      } = tenant;
      
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO tenants (
          houseId, 
          name, 
          phone, 
          email, 
          occupants, 
          moveInDate, 
          isActive,
          rentDueDay,
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          houseId, 
          name, 
          phone, 
          email || null, 
          occupants, 
          moveInDate, 
          isActive ? 1 : 0,
          rentDueDay,
          now, 
          now
        ]
      );
      
      // Update house occupancy status
      await this.executeSql(
        'UPDATE houses SET isOccupied = 1, updatedAt = ? WHERE id = ?',
        [now, houseId]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  async getTenantsByHouseId(houseId: number): Promise<Tenant[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM tenants WHERE houseId = ? ORDER BY isActive DESC, moveInDate DESC',
        [houseId]
      );
      
      const tenants: Tenant[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const tenant = result.rows.item(i);
        tenants.push({
          ...tenant,
          isActive: !!tenant.isActive // Convert to boolean
        });
      }
      
      return tenants;
    } catch (error) {
      console.error('Error getting tenants by house ID:', error);
      throw error;
    }
  }

  async getActiveTenants(): Promise<Tenant[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM tenants WHERE isActive = 1 ORDER BY name',
        []
      );
      
      const tenants: Tenant[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const tenant = result.rows.item(i);
        tenants.push({
          ...tenant,
          isActive: true
        });
      }
      
      return tenants;
    } catch (error) {
      console.error('Error getting active tenants:', error);
      throw error;
    }
  }

  async updateTenant(tenant: Tenant): Promise<void> {
    try {
      const { 
        id, 
        houseId, 
        name, 
        phone, 
        email, 
        occupants, 
        moveInDate, 
        moveOutDate, 
        isActive,
        rentDueDay
      } = tenant;
      
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE tenants SET 
          houseId = ?, 
          name = ?, 
          phone = ?, 
          email = ?, 
          occupants = ?, 
          moveInDate = ?, 
          moveOutDate = ?, 
          isActive = ?,
          rentDueDay = ?,
          updatedAt = ? 
        WHERE id = ?`,
        [
          houseId, 
          name, 
          phone, 
          email || null, 
          occupants, 
          moveInDate, 
          moveOutDate || null, 
          isActive ? 1 : 0,
          rentDueDay || 1,
          now, 
          id
        ]
      );
      
      // If tenant is no longer active, check if there are any other active tenants for this house
      if (!isActive) {
        const result = await this.executeSql(
          'SELECT COUNT(*) as count FROM tenants WHERE houseId = ? AND isActive = 1',
          [houseId]
        );
        
        const count = result.rows.item(0).count;
        
        // If no active tenants, update house occupancy status
        if (count === 0) {
          await this.executeSql(
            'UPDATE houses SET isOccupied = 0, updatedAt = ? WHERE id = ?',
            [now, houseId]
          );
        }
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      throw error;
    }
  }

  async deleteTenant(id: number): Promise<void> {
    try {
      // Get tenant details first to update house occupancy if needed
      const tenantResult = await this.executeSql(
        'SELECT houseId, isActive FROM tenants WHERE id = ?',
        [id]
      );
      
      if (tenantResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }
      
      const tenant = tenantResult.rows.item(0);
      const houseId = tenant.houseId;
      const isActive = !!tenant.isActive;
      
      // Delete the tenant
      await this.executeSql(
        'DELETE FROM tenants WHERE id = ?',
        [id]
      );
      
      // If tenant was active, check if there are any other active tenants for this house
      if (isActive) {
        const result = await this.executeSql(
          'SELECT COUNT(*) as count FROM tenants WHERE houseId = ? AND isActive = 1',
          [houseId]
        );
        
        const count = result.rows.item(0).count;
        
        // If no active tenants, update house occupancy status
        if (count === 0) {
          const now = new Date().toISOString();
          await this.executeSql(
            'UPDATE houses SET isOccupied = 0, updatedAt = ? WHERE id = ?',
            [now, houseId]
          );
        }
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      throw error;
    }
  }

  // Utility Bill CRUD operations
  async createUtilityBill(bill: UtilityBill): Promise<number> {
    try {
      const { buildingId, billType, billDate, totalAmount, isPaid } = bill;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO utilityBills (
          buildingId, 
          billType, 
          billDate, 
          totalAmount, 
          isPaid, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          buildingId, 
          billType, 
          billDate, 
          totalAmount, 
          isPaid ? 1 : 0, 
          now, 
          now
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating utility bill:', error);
      throw error;
    }
  }

  async getUtilityBillsByBuildingId(buildingId: number): Promise<UtilityBill[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM utilityBills WHERE buildingId = ? ORDER BY billDate DESC',
        [buildingId]
      );
      
      const bills: UtilityBill[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const bill = result.rows.item(i);
        bills.push({
          ...bill,
          isPaid: !!bill.isPaid // Convert to boolean
        });
      }
      
      return bills;
    } catch (error) {
      console.error('Error getting utility bills by building ID:', error);
      throw error;
    }
  }

  async updateUtilityBill(bill: UtilityBill): Promise<void> {
    try {
      const { id, buildingId, billType, billDate, totalAmount, isPaid } = bill;
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE utilityBills SET 
          buildingId = ?, 
          billType = ?, 
          billDate = ?, 
          totalAmount = ?, 
          isPaid = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          buildingId, 
          billType, 
          billDate, 
          totalAmount, 
          isPaid ? 1 : 0, 
          now, 
          id
        ]
      );
    } catch (error) {
      console.error('Error updating utility bill:', error);
      throw error;
    }
  }

  async createHouseBill(houseBill: HouseBill): Promise<number> {
    try {
      const { houseId, utilityBillId, amount, isPaid } = houseBill;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO houseBills (
          houseId, 
          utilityBillId, 
          amount, 
          isPaid, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          houseId, 
          utilityBillId, 
          amount, 
          isPaid ? 1 : 0, 
          now, 
          now
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating house bill:', error);
      throw error;
    }
  }

  async getHouseBillsByUtilityBillId(utilityBillId: number): Promise<HouseBill[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM houseBills WHERE utilityBillId = ?',
        [utilityBillId]
      );
      
      const bills: HouseBill[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const bill = result.rows.item(i);
        bills.push({
          ...bill,
          isPaid: !!bill.isPaid // Convert to boolean
        });
      }
      
      return bills;
    } catch (error) {
      console.error('Error getting house bills by utility bill ID:', error);
      throw error;
    }
  }

  async getHouseBillsByHouseId(houseId: number): Promise<(HouseBill & { billType: string, billDate: string })[]> {
    try {
      const result = await this.executeSql(
        `SELECT hb.*, ub.billType, ub.billDate 
         FROM houseBills hb
         JOIN utilityBills ub ON hb.utilityBillId = ub.id
         WHERE hb.houseId = ?
         ORDER BY ub.billDate DESC`,
        [houseId]
      );
      
      const bills: (HouseBill & { billType: string, billDate: string })[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const bill = result.rows.item(i);
        bills.push({
          ...bill,
          isPaid: !!bill.isPaid // Convert to boolean
        });
      }
      
      return bills;
    } catch (error) {
      console.error('Error getting house bills by house ID:', error);
      throw error;
    }
  }

  async updateHouseBill(houseBill: HouseBill): Promise<void> {
    try {
      const { id, amount, isPaid } = houseBill;
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE houseBills SET 
          amount = ?, 
          isPaid = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          amount, 
          isPaid ? 1 : 0, 
          now, 
          id
        ]
      );
    } catch (error) {
      console.error('Error updating house bill:', error);
      throw error;
    }
  }

  // Service Provider CRUD operations
  async createServiceProvider(provider: ServiceProvider): Promise<number> {
    try {
      const { name, phone, email, serviceType } = provider;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO serviceProviders (
          name, 
          phone, 
          email, 
          serviceType, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name, 
          phone, 
          email || null, 
          serviceType, 
          now, 
          now
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating service provider:', error);
      throw error;
    }
  }

  async getServiceProviders(): Promise<ServiceProvider[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM serviceProviders ORDER BY name',
        []
      );
      
      const providers: ServiceProvider[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        providers.push(result.rows.item(i));
      }
      
      return providers;
    } catch (error) {
      console.error('Error getting service providers:', error);
      throw error;
    }
  }

  async getServiceProviderById(id: number): Promise<ServiceProvider | null> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM serviceProviders WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting service provider by ID:', error);
      throw error;
    }
  }

  async updateServiceProvider(provider: ServiceProvider): Promise<void> {
    try {
      const { id, name, phone, email, serviceType } = provider;
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE serviceProviders SET 
          name = ?, 
          phone = ?, 
          email = ?, 
          serviceType = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          name, 
          phone, 
          email || null, 
          serviceType, 
          now, 
          id
        ]
      );
    } catch (error) {
      console.error('Error updating service provider:', error);
      throw error;
    }
  }

  async deleteServiceProvider(id: number): Promise<void> {
    try {
      await this.executeSql(
        'DELETE FROM serviceProviders WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting service provider:', error);
      throw error;
    }
  }

  // Service Record CRUD operations
  async createServiceRecord(record: ServiceRecord): Promise<number> {
    try {
      const { houseId, serviceType, serviceDate, cost, providerId, notes } = record;
      const now = new Date().toISOString();
      
      const result = await this.executeSql(
        `INSERT INTO serviceRecords (
          houseId, 
          serviceType, 
          serviceDate, 
          cost, 
          providerId, 
          notes, 
          createdAt, 
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          houseId, 
          serviceType, 
          serviceDate, 
          cost, 
          providerId || null, 
          notes || null, 
          now, 
          now
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating service record:', error);
      throw error;
    }
  }

  async getServiceRecordsByHouseId(houseId: number): Promise<ServiceRecord[]> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM serviceRecords WHERE houseId = ? ORDER BY serviceDate DESC',
        [houseId]
      );
      
      const records: ServiceRecord[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        records.push(result.rows.item(i));
      }
      
      return records;
    } catch (error) {
      console.error('Error getting service records by house ID:', error);
      throw error;
    }
  }

  async getServiceRecordById(id: number): Promise<ServiceRecord | null> {
    try {
      const result = await this.executeSql(
        'SELECT * FROM serviceRecords WHERE id = ?',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting service record by ID:', error);
      throw error;
    }
  }

  async updateServiceRecord(record: ServiceRecord): Promise<void> {
    try {
      const { id, houseId, serviceType, serviceDate, cost, providerId, notes } = record;
      const now = new Date().toISOString();
      
      await this.executeSql(
        `UPDATE serviceRecords SET 
          houseId = ?, 
          serviceType = ?, 
          serviceDate = ?, 
          cost = ?, 
          providerId = ?, 
          notes = ?, 
          updatedAt = ? 
        WHERE id = ?`,
        [
          houseId, 
          serviceType, 
          serviceDate, 
          cost, 
          providerId || null, 
          notes || null, 
          now, 
          id
        ]
      );
    } catch (error) {
      console.error('Error updating service record:', error);
      throw error;
    }
  }

  async deleteServiceRecord(id: number): Promise<void> {
    try {
      await this.executeSql(
        'DELETE FROM serviceRecords WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting service record:', error);
      throw error;
    }
  }

  // Reminder Settings CRUD operations
  async getReminderSettings(): Promise<ReminderSettings | null> {
    try {
      const result = await this.executeSql('SELECT * FROM reminderSettings LIMIT 1', []);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const settings = result.rows.item(0);
      return {
        ...settings,
        enabled: !!settings.enabled // Convert to boolean
      };
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      throw error;
    }
  }

  async updateReminderSettings(settings: ReminderSettings): Promise<void> {
    try {
      const { enabled, daysBeforeDue, reminderTime } = settings;
      const now = new Date().toISOString();
      
      // Get the ID of the first record
      const result = await this.executeSql('SELECT id FROM reminderSettings LIMIT 1', []);
      
      if (result.rows.length === 0) {
        // Insert if no record exists
        await this.executeSql(
          'INSERT INTO reminderSettings (enabled, daysBeforeDue, reminderTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [enabled ? 1 : 0, daysBeforeDue, reminderTime, now, now]
        );
      } else {
        // Update existing record
        const id = result.rows.item(0).id;
        await this.executeSql(
          'UPDATE reminderSettings SET enabled = ?, daysBeforeDue = ?, reminderTime = ?, updatedAt = ? WHERE id = ?',
          [enabled ? 1 : 0, daysBeforeDue, reminderTime, now, id]
        );
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }

  // Utility methods
  async getArrearsReport(): Promise<any[]> {
    try {
      const result = await this.executeSql(
        `SELECT 
          t.id as tenantId,
          t.name as tenantName,
          h.id as houseId,
          h.houseNumber,
          b.name as buildingName,
          hb.id as billId,
          ub.billType,
          ub.billDate,
          hb.amount,
          hb.isPaid
         FROM tenants t
         JOIN houses h ON t.houseId = h.id
         JOIN buildings b ON h.buildingId = b.id
         JOIN houseBills hb ON h.id = hb.houseId
         JOIN utilityBills ub ON hb.utilityBillId = ub.id
         WHERE t.isActive = 1 AND hb.isPaid = 0
         ORDER BY t.name, ub.billDate`,
        []
      );
      
      const arrears: any[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);
        arrears.push({
          ...item,
          isPaid: !!item.isPaid // Convert to boolean
        });
      }
      
      return arrears;
    } catch (error) {
      console.error('Error getting arrears report:', error);
      throw error;
    }
  }

  async calculateWaterBillShares(utilityBillId: number, totalAmount: number): Promise<{ houseId: number, amount: number }[]> {
    try {
      // Get the building ID for this utility bill
      const billResult = await this.executeSql(
        'SELECT buildingId FROM utilityBills WHERE id = ?',
        [utilityBillId]
      );
      
      if (billResult.rows.length === 0) {
        throw new Error('Utility bill not found');
      }
      
      const buildingId = billResult.rows.item(0).buildingId;
      
      // Get all houses in this building with active tenants and their occupant counts
      const housesResult = await this.executeSql(
        `SELECT 
          h.id as houseId, 
          h.waterMeterType,
          COALESCE(t.occupants, 0) as occupants
         FROM houses h
         LEFT JOIN tenants t ON h.id = t.houseId AND t.isActive = 1
         WHERE h.buildingId = ? AND h.isOccupied = 1`,
        [buildingId]
      );
      
      const houses: { houseId: number, waterMeterType: string, occupants: number }[] = [];
      let totalOccupants = 0;
      
      for (let i = 0; i < housesResult.rows.length; i++) {
        const house = housesResult.rows.item(i);
        houses.push(house);
        
        if (house.waterMeterType === 'shared') {
          totalOccupants += house.occupants;
        }
      }
      
      // Calculate bill shares based on occupants
      const shares: { houseId: number, amount: number }[] = [];
      
      if (totalOccupants === 0) {
        // If no occupants (shouldn't happen), divide equally
        const equalShare = totalAmount / houses.length;
        houses.forEach(house => {
          shares.push({
            houseId: house.houseId,
            amount: equalShare
          });
        });
      } else {
        // Divide based on occupants for shared water meters
        const perPersonAmount = totalAmount / totalOccupants;
        
        houses.forEach(house => {
          if (house.waterMeterType === 'shared') {
            shares.push({
              houseId: house.houseId,
              amount: perPersonAmount * house.occupants
            });
          }
        });
      }
      
      return shares;
    } catch (error) {
      console.error('Error calculating water bill shares:', error);
      throw error;
    }
  }

  async calculateElectricityBillShares(utilityBillId: number, totalAmount: number): Promise<{ houseId: number, amount: number }[]> {
    try {
      // Get the building ID for this utility bill
      const billResult = await this.executeSql(
        'SELECT buildingId FROM utilityBills WHERE id = ?',
        [utilityBillId]
      );
      
      if (billResult.rows.length === 0) {
        throw new Error('Utility bill not found');
      }
      
      const buildingId = billResult.rows.item(0).buildingId;
      
      // Get all houses in this building with shared electricity meters
      const housesResult = await this.executeSql(
        `SELECT 
          h.id as houseId, 
          h.electricityMeterType
         FROM houses h
         WHERE h.buildingId = ? AND h.isOccupied = 1 AND h.electricityMeterType = 'shared'`,
        [buildingId]
      );
      
      const houses: { houseId: number }[] = [];
      
      for (let i = 0; i < housesResult.rows.length; i++) {
        houses.push({
          houseId: housesResult.rows.item(i).houseId
        });
      }
      
      // Calculate bill shares (equal division for electricity)
      const shares: { houseId: number, amount: number }[] = [];
      
      if (houses.length === 0) {
        return shares;
      }
      
      const equalShare = totalAmount / houses.length;
      
      houses.forEach(house => {
        shares.push({
          houseId: house.houseId,
          amount: equalShare
        });
      });
      
      return shares;
    } catch (error) {
      console.error('Error calculating electricity bill shares:', error);
      throw error;
    }
  }

  // Bulk import methods
  async bulkImportHouses(houses: Partial<House>[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const house of houses) {
      try {
        if (!house.buildingId || !house.houseNumber || !house.type || !house.rentAmount) {
          failed++;
          continue;
        }
        
        await this.createHouse({
          buildingId: house.buildingId,
          houseNumber: house.houseNumber,
          type: house.type,
          typeId: house.typeId,
          rentAmount: house.rentAmount,
          isOccupied: house.isOccupied || false,
          electricityMeterType: house.electricityMeterType || 'shared',
          waterMeterType: house.waterMeterType || 'shared',
        });
        
        success++;
      } catch (error) {
        console.error('Error importing house:', error);
        failed++;
      }
    }
    
    return { success, failed };
  }

  async bulkImportTenants(tenants: Partial<Tenant>[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const tenant of tenants) {
      try {
        if (!tenant.houseId || !tenant.name || !tenant.phone) {
          failed++;
          continue;
        }
        
        await this.createTenant({
          houseId: tenant.houseId,
          name: tenant.name,
          phone: tenant.phone,
          email: tenant.email,
          occupants: tenant.occupants || 1,
          moveInDate: tenant.moveInDate || new Date().toISOString().split('T')[0],
          isActive: tenant.isActive !== undefined ? tenant.isActive : true,
          rentDueDay: tenant.rentDueDay || 1,
        });
        
        success++;
      } catch (error) {
        console.error('Error importing tenant:', error);
        failed++;
      }
    }
    
    return { success, failed };
  }
}

export const databaseService = new DatabaseService();
export default databaseService;