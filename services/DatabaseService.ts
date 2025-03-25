import * as SQLite from "expo-sqlite";
import { HouseType } from "../state";

// Interfaces remain unchanged
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
	electricityMeterType: "shared" | "token" | "individual";
	waterMeterType: "individual" | "shared";
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
	billType: "electricity" | "water";
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
	private database!: SQLite.SQLiteDatabaseAsync;
	private databaseName = "RentalManager.db";

	constructor() {
		this.initDatabase();
	}

	private async initDatabase(): Promise<void> {
		try {
			this.database = await SQLite.openDatabaseAsync(this.databaseName);
			await this.createTables();
			console.log("Database initialized successfully");
		} catch (error) {
			console.error("Error initializing database:", error);
			throw error;
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
      )`,
		];

		try {
			for (const query of createTablesQueries) {
				await this.database.execAsync(query);
			}

			// Insert default house types if none exist
			const houseTypesCount =
				(
					await this.database.getFirstAsync<{ count: number }>(
						"SELECT COUNT(*) as count FROM houseTypes"
					)
				)?.count || 0;
			if (houseTypesCount === 0) {
				const defaultHouseTypes = [
					{ name: "Bedsitter", defaultRentAmount: 5000 },
					{ name: "Single Room", defaultRentAmount: 4000 },
					{ name: "One Bedroom", defaultRentAmount: 8000 },
					{ name: "Two Bedroom", defaultRentAmount: 12000 },
					{ name: "Own Compound", defaultRentAmount: 15000 },
				];
				for (const type of defaultHouseTypes) {
					await this.createHouseType(type);
				}
			}

			// Insert default reminder settings if none exist
			const reminderSettingsCount =
				(
					await this.database.getFirstAsync<{ count: number }>(
						"SELECT COUNT(*) as count FROM reminderSettings"
					)
				)?.count || 0;
			if (reminderSettingsCount === 0) {
				await this.database.runAsync(
					"INSERT INTO reminderSettings (enabled, daysBeforeDue, reminderTime) VALUES (?, ?, ?)",
					[1, 3, "09:00"]
				);
			}

			console.log("Tables created successfully");
		} catch (error) {
			console.error("Error creating tables:", error);
			throw error;
		}
	}

	// Building CRUD operations
	async createBuilding(building: Building): Promise<number> {
		try {
			const { name, address } = building;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				"INSERT INTO buildings (name, address, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
				[name, address, now, now]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating building:", error);
			throw error;
		}
	}

	async getBuildings(): Promise<Building[]> {
		try {
			return await this.database.getAllAsync<Building>(
				"SELECT * FROM buildings ORDER BY name"
			);
		} catch (error) {
			console.error("Error getting buildings:", error);
			throw error;
		}
	}

	async getBuildingById(id: number): Promise<Building | null> {
		try {
			return (
				(await this.database.getFirstAsync<Building>(
					"SELECT * FROM buildings WHERE id = ?",
					[id]
				)) || null
			);
		} catch (error) {
			console.error("Error getting building by ID:", error);
			throw error;
		}
	}

	async updateBuilding(building: Building): Promise<void> {
		try {
			const { id, name, address } = building;
			const now = new Date().toISOString();
			await this.database.runAsync(
				"UPDATE buildings SET name = ?, address = ?, updatedAt = ? WHERE id = ?",
				[name, address, now, id]
			);
		} catch (error) {
			console.error("Error updating building:", error);
			throw error;
		}
	}

	async deleteBuilding(id: number): Promise<void> {
		try {
			await this.database.runAsync("DELETE FROM buildings WHERE id = ?", [
				id,
			]);
		} catch (error) {
			console.error("Error deleting building:", error);
			throw error;
		}
	}

	// House Type CRUD operations
	async createHouseType(houseType: HouseType): Promise<number> {
		try {
			const { name, defaultRentAmount } = houseType;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				"INSERT INTO houseTypes (name, defaultRentAmount, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
				[name, defaultRentAmount, now, now]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating house type:", error);
			throw error;
		}
	}

	async getHouseTypes(): Promise<HouseType[]> {
		try {
			return await this.database.getAllAsync<HouseType>(
				"SELECT * FROM houseTypes ORDER BY name"
			);
		} catch (error) {
			console.error("Error getting house types:", error);
			throw error;
		}
	}

	async getHouseTypeById(id: number): Promise<HouseType | null> {
		try {
			return (
				(await this.database.getFirstAsync<HouseType>(
					"SELECT * FROM houseTypes WHERE id = ?",
					[id]
				)) || null
			);
		} catch (error) {
			console.error("Error getting house type by ID:", error);
			throw error;
		}
	}

	async updateHouseType(houseType: HouseType): Promise<void> {
		try {
			const { id, name, defaultRentAmount } = houseType;
			const now = new Date().toISOString();
			await this.database.runAsync(
				"UPDATE houseTypes SET name = ?, defaultRentAmount = ?, updatedAt = ? WHERE id = ?",
				[name, defaultRentAmount, now, id]
			);
		} catch (error) {
			console.error("Error updating house type:", error);
			throw error;
		}
	}

	async deleteHouseType(id: number): Promise<void> {
		try {
			await this.database.runAsync(
				"DELETE FROM houseTypes WHERE id = ?",
				[id]
			);
		} catch (error) {
			console.error("Error deleting house type:", error);
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
				waterMeterType,
			} = house;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO houses (buildingId, houseNumber, type, typeId, rentAmount, isOccupied, electricityMeterType, waterMeterType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
					now,
				]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating house:", error);
			throw error;
		}
	}

	async getHousesByBuildingId(buildingId: number): Promise<House[]> {
		try {
			const houses = await this.database.getAllAsync<House>(
				"SELECT * FROM houses WHERE buildingId = ? ORDER BY houseNumber",
				[buildingId]
			);
			return houses.map((house) => ({
				...house,
				isOccupied: !!house.isOccupied,
			}));
		} catch (error) {
			console.error("Error getting houses by building ID:", error);
			throw error;
		}
	}

	async getHouseById(id: number): Promise<House | null> {
		try {
			const house = await this.database.getFirstAsync<House>(
				"SELECT * FROM houses WHERE id = ?",
				[id]
			);
			return house ? { ...house, isOccupied: !!house.isOccupied } : null;
		} catch (error) {
			console.error("Error getting house by ID:", error);
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
				waterMeterType,
			} = house;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE houses SET buildingId = ?, houseNumber = ?, type = ?, typeId = ?, rentAmount = ?, isOccupied = ?, electricityMeterType = ?, waterMeterType = ?, updatedAt = ?
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
					id,
				]
			);
		} catch (error) {
			console.error("Error updating house:", error);
			throw error;
		}
	}

	async deleteHouse(id: number): Promise<void> {
		try {
			await this.database.runAsync("DELETE FROM houses WHERE id = ?", [
				id,
			]);
		} catch (error) {
			console.error("Error deleting house:", error);
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
				rentDueDay = 1,
			} = tenant;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO tenants (houseId, name, phone, email, occupants, moveInDate, isActive, rentDueDay, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
					now,
				]
			);
			await this.database.runAsync(
				"UPDATE houses SET isOccupied = 1, updatedAt = ? WHERE id = ?",
				[now, houseId]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating tenant:", error);
			throw error;
		}
	}

	async getTenantsByHouseId(houseId: number): Promise<Tenant[]> {
		try {
			const tenants = await this.database.getAllAsync<Tenant>(
				"SELECT * FROM tenants WHERE houseId = ? ORDER BY isActive DESC, moveInDate DESC",
				[houseId]
			);
			return tenants.map((tenant) => ({
				...tenant,
				isActive: !!tenant.isActive,
			}));
		} catch (error) {
			console.error("Error getting tenants by house ID:", error);
			throw error;
		}
	}

	async getActiveTenants(): Promise<Tenant[]> {
		try {
			const tenants = await this.database.getAllAsync<Tenant>(
				"SELECT * FROM tenants WHERE isActive = 1 ORDER BY name"
			);
			return tenants.map((tenant) => ({ ...tenant, isActive: true }));
		} catch (error) {
			console.error("Error getting active tenants:", error);
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
				rentDueDay,
			} = tenant;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE tenants SET houseId = ?, name = ?, phone = ?, email = ?, occupants = ?, moveInDate = ?, moveOutDate = ?, isActive = ?, rentDueDay = ?, updatedAt = ?
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
					id,
				]
			);

			if (!isActive) {
				const count =
					(
						await this.database.getFirstAsync<{ count: number }>(
							"SELECT COUNT(*) as count FROM tenants WHERE houseId = ? AND isActive = 1",
							[houseId]
						)
					)?.count || 0;
				if (count === 0) {
					await this.database.runAsync(
						"UPDATE houses SET isOccupied = 0, updatedAt = ? WHERE id = ?",
						[now, houseId]
					);
				}
			}
		} catch (error) {
			console.error("Error updating tenant:", error);
			throw error;
		}
	}

	async deleteTenant(id: number): Promise<void> {
		try {
			const tenant = await this.database.getFirstAsync<{
				houseId: number;
				isActive: number;
			}>("SELECT houseId, isActive FROM tenants WHERE id = ?", [id]);
			if (!tenant) throw new Error("Tenant not found");

			await this.database.runAsync("DELETE FROM tenants WHERE id = ?", [
				id,
			]);

			if (tenant.isActive) {
				const count =
					(
						await this.database.getFirstAsync<{ count: number }>(
							"SELECT COUNT(*) as count FROM tenants WHERE houseId = ? AND isActive = 1",
							[tenant.houseId]
						)
					)?.count || 0;
				if (count === 0) {
					const now = new Date().toISOString();
					await this.database.runAsync(
						"UPDATE houses SET isOccupied = 0, updatedAt = ? WHERE id = ?",
						[now, tenant.houseId]
					);
				}
			}
		} catch (error) {
			console.error("Error deleting tenant:", error);
			throw error;
		}
	}

	// Utility Bill CRUD operations
	async createUtilityBill(bill: UtilityBill): Promise<number> {
		try {
			const { buildingId, billType, billDate, totalAmount, isPaid } =
				bill;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO utilityBills (buildingId, billType, billDate, totalAmount, isPaid, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					buildingId,
					billType,
					billDate,
					totalAmount,
					isPaid ? 1 : 0,
					now,
					now,
				]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating utility bill:", error);
			throw error;
		}
	}

	async getUtilityBillsByBuildingId(
		buildingId: number
	): Promise<UtilityBill[]> {
		try {
			const bills = await this.database.getAllAsync<UtilityBill>(
				"SELECT * FROM utilityBills WHERE buildingId = ? ORDER BY billDate DESC",
				[buildingId]
			);
			return bills.map((bill) => ({ ...bill, isPaid: !!bill.isPaid }));
		} catch (error) {
			console.error("Error getting utility bills by building ID:", error);
			throw error;
		}
	}

	async updateUtilityBill(bill: UtilityBill): Promise<void> {
		try {
			const { id, buildingId, billType, billDate, totalAmount, isPaid } =
				bill;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE utilityBills SET buildingId = ?, billType = ?, billDate = ?, totalAmount = ?, isPaid = ?, updatedAt = ?
         WHERE id = ?`,
				[
					buildingId,
					billType,
					billDate,
					totalAmount,
					isPaid ? 1 : 0,
					now,
					id,
				]
			);
		} catch (error) {
			console.error("Error updating utility bill:", error);
			throw error;
		}
	}

	async createHouseBill(houseBill: HouseBill): Promise<number> {
		try {
			const { houseId, utilityBillId, amount, isPaid } = houseBill;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO houseBills (houseId, utilityBillId, amount, isPaid, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
				[houseId, utilityBillId, amount, isPaid ? 1 : 0, now, now]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating house bill:", error);
			throw error;
		}
	}

	async getHouseBillsByUtilityBillId(
		utilityBillId: number
	): Promise<HouseBill[]> {
		try {
			const bills = await this.database.getAllAsync<HouseBill>(
				"SELECT * FROM houseBills WHERE utilityBillId = ?",
				[utilityBillId]
			);
			return bills.map((bill) => ({ ...bill, isPaid: !!bill.isPaid }));
		} catch (error) {
			console.error(
				"Error getting house bills by utility bill ID:",
				error
			);
			throw error;
		}
	}

	async getHouseBillsByHouseId(
		houseId: number
	): Promise<(HouseBill & { billType: string; billDate: string })[]> {
		try {
			const bills = await this.database.getAllAsync<
				HouseBill & { billType: string; billDate: string }
			>(
				`SELECT hb.*, ub.billType, ub.billDate 
         FROM houseBills hb
         JOIN utilityBills ub ON hb.utilityBillId = ub.id
         WHERE hb.houseId = ?
         ORDER BY ub.billDate DESC`,
				[houseId]
			);
			return bills.map((bill) => ({ ...bill, isPaid: !!bill.isPaid }));
		} catch (error) {
			console.error("Error getting house bills by house ID:", error);
			throw error;
		}
	}

	async updateHouseBill(houseBill: HouseBill): Promise<void> {
		try {
			const { id, amount, isPaid } = houseBill;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE houseBills SET amount = ?, isPaid = ?, updatedAt = ? WHERE id = ?`,
				[amount, isPaid ? 1 : 0, now, id]
			);
		} catch (error) {
			console.error("Error updating house bill:", error);
			throw error;
		}
	}

	// Service Provider CRUD operations
	async createServiceProvider(provider: ServiceProvider): Promise<number> {
		try {
			const { name, phone, email, serviceType } = provider;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO serviceProviders (name, phone, email, serviceType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
				[name, phone, email || null, serviceType, now, now]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating service provider:", error);
			throw error;
		}
	}

	async getServiceProviders(): Promise<ServiceProvider[]> {
		try {
			return await this.database.getAllAsync<ServiceProvider>(
				"SELECT * FROM serviceProviders ORDER BY name"
			);
		} catch (error) {
			console.error("Error getting service providers:", error);
			throw error;
		}
	}

	async getServiceProviderById(id: number): Promise<ServiceProvider | null> {
		try {
			return (
				(await this.database.getFirstAsync<ServiceProvider>(
					"SELECT * FROM serviceProviders WHERE id = ?",
					[id]
				)) || null
			);
		} catch (error) {
			console.error("Error getting service provider by ID:", error);
			throw error;
		}
	}

	async updateServiceProvider(provider: ServiceProvider): Promise<void> {
		try {
			const { id, name, phone, email, serviceType } = provider;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE serviceProviders SET name = ?, phone = ?, email = ?, serviceType = ?, updatedAt = ?
         WHERE id = ?`,
				[name, phone, email || null, serviceType, now, id]
			);
		} catch (error) {
			console.error("Error updating service provider:", error);
			throw error;
		}
	}

	async deleteServiceProvider(id: number): Promise<void> {
		try {
			await this.database.runAsync(
				"DELETE FROM serviceProviders WHERE id = ?",
				[id]
			);
		} catch (error) {
			console.error("Error deleting service provider:", error);
			throw error;
		}
	}

	// Service Record CRUD operations
	async createServiceRecord(record: ServiceRecord): Promise<number> {
		try {
			const {
				houseId,
				serviceType,
				serviceDate,
				cost,
				providerId,
				notes,
			} = record;
			const now = new Date().toISOString();
			const result = await this.database.runAsync(
				`INSERT INTO serviceRecords (houseId, serviceType, serviceDate, cost, providerId, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					houseId,
					serviceType,
					serviceDate,
					cost,
					providerId || null,
					notes || null,
					now,
					now,
				]
			);
			return result.lastInsertRowId;
		} catch (error) {
			console.error("Error creating service record:", error);
			throw error;
		}
	}

	async getServiceRecordsByHouseId(
		houseId: number
	): Promise<ServiceRecord[]> {
		try {
			return await this.database.getAllAsync<ServiceRecord>(
				"SELECT * FROM serviceRecords WHERE houseId = ? ORDER BY serviceDate DESC",
				[houseId]
			);
		} catch (error) {
			console.error("Error getting service records by house ID:", error);
			throw error;
		}
	}

	async getServiceRecordById(id: number): Promise<ServiceRecord | null> {
		try {
			return (
				(await this.database.getFirstAsync<ServiceRecord>(
					"SELECT * FROM serviceRecords WHERE id = ?",
					[id]
				)) || null
			);
		} catch (error) {
			console.error("Error getting service record by ID:", error);
			throw error;
		}
	}

	async updateServiceRecord(record: ServiceRecord): Promise<void> {
		try {
			const {
				id,
				houseId,
				serviceType,
				serviceDate,
				cost,
				providerId,
				notes,
			} = record;
			const now = new Date().toISOString();
			await this.database.runAsync(
				`UPDATE serviceRecords SET houseId = ?, serviceType = ?, serviceDate = ?, cost = ?, providerId = ?, notes = ?, updatedAt = ?
         WHERE id = ?`,
				[
					houseId,
					serviceType,
					serviceDate,
					cost,
					providerId || null,
					notes || null,
					now,
					id,
				]
			);
		} catch (error) {
			console.error("Error updating service record:", error);
			throw error;
		}
	}

	async deleteServiceRecord(id: number): Promise<void> {
		try {
			await this.database.runAsync(
				"DELETE FROM serviceRecords WHERE id = ?",
				[id]
			);
		} catch (error) {
			console.error("Error deleting service record:", error);
			throw error;
		}
	}

	// Reminder Settings CRUD operations
	async getReminderSettings(): Promise<ReminderSettings | null> {
		try {
			const settings =
				await this.database.getFirstAsync<ReminderSettings>(
					"SELECT * FROM reminderSettings LIMIT 1"
				);
			return settings
				? { ...settings, enabled: !!settings.enabled }
				: null;
		} catch (error) {
			console.error("Error getting reminder settings:", error);
			throw error;
		}
	}

	async updateReminderSettings(settings: ReminderSettings): Promise<void> {
		try {
			const { enabled, daysBeforeDue, reminderTime } = settings;
			const now = new Date().toISOString();
			const existing = await this.database.getFirstAsync<{ id: number }>(
				"SELECT id FROM reminderSettings LIMIT 1"
			);

			if (!existing) {
				await this.database.runAsync(
					"INSERT INTO reminderSettings (enabled, daysBeforeDue, reminderTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
					[enabled ? 1 : 0, daysBeforeDue, reminderTime, now, now]
				);
			} else {
				await this.database.runAsync(
					"UPDATE reminderSettings SET enabled = ?, daysBeforeDue = ?, reminderTime = ?, updatedAt = ? WHERE id = ?",
					[
						enabled ? 1 : 0,
						daysBeforeDue,
						reminderTime,
						now,
						existing.id,
					]
				);
			}
		} catch (error) {
			console.error("Error updating reminder settings:", error);
			throw error;
		}
	}

	// Utility methods
	async getArrearsReport(): Promise<any[]> {
		try {
			const arrears = await this.database.getAllAsync<any>(
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
         ORDER BY t.name, ub.billDate`
			);
			return arrears.map((item) => ({ ...item, isPaid: !!item.isPaid }));
		} catch (error) {
			console.error("Error getting arrears report:", error);
			throw error;
		}
	}

	async calculateWaterBillShares(
		utilityBillId: number,
		totalAmount: number
	): Promise<{ houseId: number; amount: number }[]> {
		try {
			const bill = await this.database.getFirstAsync<{
				buildingId: number;
			}>("SELECT buildingId FROM utilityBills WHERE id = ?", [
				utilityBillId,
			]);
			if (!bill) throw new Error("Utility bill not found");

			const houses = await this.database.getAllAsync<{
				houseId: number;
				waterMeterType: string;
				occupants: number;
			}>(
				`SELECT 
          h.id as houseId, 
          h.waterMeterType,
          COALESCE(t.occupants, 0) as occupants
         FROM houses h
         LEFT JOIN tenants t ON h.id = t.houseId AND t.isActive = 1
         WHERE h.buildingId = ? AND h.isOccupied = 1`,
				[bill.buildingId]
			);

			const sharedHouses = houses.filter(
				(h) => h.waterMeterType === "shared"
			);
			const totalOccupants = sharedHouses.reduce(
				(sum, h) => sum + h.occupants,
				0
			);
			const shares: { houseId: number; amount: number }[] = [];

			if (totalOccupants === 0) {
				const equalShare = totalAmount / houses.length;
				houses.forEach((h) =>
					shares.push({ houseId: h.houseId, amount: equalShare })
				);
			} else {
				const perPersonAmount = totalAmount / totalOccupants;
				sharedHouses.forEach((h) =>
					shares.push({
						houseId: h.houseId,
						amount: perPersonAmount * h.occupants,
					})
				);
			}
			return shares;
		} catch (error) {
			console.error("Error calculating water bill shares:", error);
			throw error;
		}
	}

	async calculateElectricityBillShares(
		utilityBillId: number,
		totalAmount: number
	): Promise<{ houseId: number; amount: number }[]> {
		try {
			const bill = await this.database.getFirstAsync<{
				buildingId: number;
			}>("SELECT buildingId FROM utilityBills WHERE id = ?", [
				utilityBillId,
			]);
			if (!bill) throw new Error("Utility bill not found");

			const houses = await this.database.getAllAsync<{ houseId: number }>(
				`SELECT h.id as houseId 
         FROM houses h
         WHERE h.buildingId = ? AND h.isOccupied = 1 AND h.electricityMeterType = 'shared'`,
				[bill.buildingId]
			);

			const shares: { houseId: number; amount: number }[] = [];
			if (houses.length > 0) {
				const equalShare = totalAmount / houses.length;
				houses.forEach((h) =>
					shares.push({ houseId: h.houseId, amount: equalShare })
				);
			}
			return shares;
		} catch (error) {
			console.error("Error calculating electricity bill shares:", error);
			throw error;
		}
	}

	// Bulk import methods
	async bulkImportHouses(
		houses: Partial<House>[]
	): Promise<{ success: number; failed: number }> {
		let success = 0;
		let failed = 0;

		for (const house of houses) {
			try {
				if (
					!house.buildingId ||
					!house.houseNumber ||
					!house.type ||
					!house.rentAmount
				) {
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
					electricityMeterType:
						house.electricityMeterType || "shared",
					waterMeterType: house.waterMeterType || "shared",
				});
				success++;
			} catch (error) {
				console.error("Error importing house:", error);
				failed++;
			}
		}
		return { success, failed };
	}

	async bulkImportTenants(
		tenants: Partial<Tenant>[]
	): Promise<{ success: number; failed: number }> {
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
					moveInDate:
						tenant.moveInDate ||
						new Date().toISOString().split("T")[0],
					isActive:
						tenant.isActive !== undefined ? tenant.isActive : true,
					rentDueDay: tenant.rentDueDay || 1,
				});
				success++;
			} catch (error) {
				console.error("Error importing tenant:", error);
				failed++;
			}
		}
		return { success, failed };
	}
}

export const databaseService = new DatabaseService();
export default databaseService;
