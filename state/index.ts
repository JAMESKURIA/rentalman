import { observable } from "@legendapp/state";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";

import {
	Building,
	House,
	HouseBill,
	ServiceProvider,
	ServiceRecord,
	Tenant,
	UtilityBill,
} from "../services/DatabaseService";

// // Enable React tracking for automatic re-renders
enableReactTracking({
	auto: true,
});

// Define custom types
export interface HouseType {
	id?: number;
	name: string;
	defaultRentAmount: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface ReminderSettings {
	enabled: boolean;
	daysBeforeDue: number;
	reminderTime: string; // HH:MM format
}

// Create the global state
export const globalState = observable({
	// User and authentication
	auth: {
		isAuthenticated: false,
		user: {
			id: null as number | null,
			name: "",
			email: "",
		},
		loading: false,
		error: null as string | null,
	},

	// App settings
	settings: {
		theme: "light" as "light" | "dark",
		rentReminders: {
			enabled: true,
			daysBeforeDue: 3,
			reminderTime: "09:00",
		} as ReminderSettings,
	},

	// Data collections
	buildings: [] as Building[],
	houses: [] as House[],
	tenants: [] as Tenant[],
	utilityBills: [] as UtilityBill[],
	houseBills: [] as HouseBill[],
	houseTypes: [] as HouseType[],
	serviceProviders: [] as ServiceProvider[],
	serviceRecords: [] as ServiceRecord[],

	// UI state
	ui: {
		loading: false,
		error: null as string | null,
		success: null as string | null,
	},
});

// Create selectors for common data operations
export const selectors = {
	// Buildings
	getBuildingById: (id: number) =>
		globalState.buildings.find((b) => b.id.get() === id),

	// Houses
	getHousesByBuildingId: (buildingId: number) =>
		globalState.houses.filter((h) => h.buildingId.get() === buildingId),
	getHouseById: (id: number) =>
		globalState.houses.find((h) => h.id.get() === id),

	// Tenants
	getTenantsByHouseId: (houseId: number) =>
		globalState.tenants.filter((t) => t.houseId.get() === houseId),
	getActiveTenants: () => globalState.tenants.filter((t) => t.isActive),
	getTenantById: (id: number) =>
		globalState.tenants.find((t) => t.id.get() === id),

	// Utility Bills
	getUtilityBillsByBuildingId: (buildingId: number) =>
		globalState.utilityBills.filter(
			(b) => b.buildingId.get() === buildingId
		),
	getUtilityBillById: (id: number) =>
		globalState.utilityBills.find((b) => b.id.get() === id),

	// House Bills
	getHouseBillsByUtilityBillId: (utilityBillId: number) =>
		globalState.houseBills.filter(
			(b) => b.utilityBillId.get() === utilityBillId
		),
	getHouseBillsByHouseId: (houseId: number) =>
		globalState.houseBills.filter((b) => b.houseId.get() === houseId),

	// House Types
	getHouseTypeById: (id: number) =>
		globalState.houseTypes.find((t) => t.id.get() === id),

	// Service Providers
	getServiceProviderById: (id: number) =>
		globalState.serviceProviders.find((p) => p.id.get() === id),

	// Service Records
	getServiceRecordsByHouseId: (houseId: number) =>
		globalState.serviceRecords.filter((r) => r.houseId.get() === houseId),

	// Arrears
	getArrears: () => {
		const unpaidBills = globalState.houseBills
			.get()
			.filter((b) => !b.isPaid);
		const result = [];

		for (const bill of unpaidBills) {
			const house = globalState.houses
				.find((h) => h.id.get() === bill.houseId)
				?.get();
			if (!house) continue;

			const tenant = globalState.tenants
				.find((t) => t.houseId.get() === house.id && t.isActive)
				?.get();
			if (!tenant) continue;

			const building = globalState.buildings
				.find((b) => b.id.get() === house.buildingId)
				?.get();
			if (!building) continue;

			const utilityBill = globalState.utilityBills
				.get()
				.find((b) => b?.id === bill.utilityBillId);
			if (!utilityBill) continue;

			result.push({
				tenantId: tenant.id,
				tenantName: tenant.name,
				houseId: house.id,
				houseNumber: house.houseNumber,
				buildingId: building.id,
				buildingName: building.name,
				billId: bill.id,
				billType: utilityBill.billType,
				billDate: utilityBill.billDate,
				amount: bill.amount,
				isPaid: bill.isPaid,
			});
		}

		return result;
	},
};

export default globalState;
