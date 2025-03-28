import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Container from "../../../components/Container";
import databaseService, {
	House,
	HouseBill,
	ServiceRecord,
	Tenant,
} from "../../../services/DatabaseService";
import dataSyncService from "../../../services/DataSyncService";
import globalState from "../../../state";
import { useTheme } from "../../../utils/ThemeContext";

export default function HouseDetailScreen() {
	const { isDarkMode } = useTheme();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();

	const [house, setHouse] = useState<House | null>(null);
	const [building, setBuilding] = useState<any | null>(null);
	const [houseType, setHouseType] = useState<any | null>(null);
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [bills, setBills] = useState<
		(HouseBill & { billType: string; billDate: string })[]
	>([]);
	const [services, setServices] = useState<ServiceRecord[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadHouseDetails = async () => {
			try {
				setLoading(true);

				// Load house details from global state
				const houses = globalState.houses.get(); // Get the entire houses array
				const houseData = houses.find((h) => h.id === Number(id));

				if (houseData) {
					setHouse(houseData);

					// Load building
					const buildings = globalState.buildings.get();
					const buildingData = buildings.find(
						(b) => b.id === houseData.buildingId
					);
					setBuilding(buildingData);

					// Load house type
					if (houseData.typeId) {
						const houseTypes = globalState.houseTypes.get();
						const houseTypeData = houseTypes.find(
							(t) => t.id === houseData.typeId
						);
						setHouseType(houseTypeData);
					}

					// Load tenants
					const tenantsData = globalState.tenants.get();
					const houseTenants = tenantsData.filter(
						(t) => t.houseId === Number(id)
					);
					setTenants(houseTenants);

					// Load bills
					const billsData = globalState.houseBills.get();
					const houseBills = billsData.filter(
						(b) => b.houseId === Number(id)
					);

					// Enrich bills with utility bill data
					const utilityBills = globalState.utilityBills.get();
					const enrichedBills = houseBills.map((bill) => {
						const utilityBill = utilityBills.find(
							(ub) => ub.id === bill.utilityBillId
						);
						return utilityBill
							? {
									...bill,
									billType: utilityBill.billType,
									billDate: utilityBill.billDate,
							  }
							: bill;
					});

					setBills(enrichedBills);

					// Load services
					const servicesData = globalState.serviceRecords.get();
					const houseServices = servicesData.filter(
						(s) => s.houseId === Number(id)
					);
					setServices(houseServices);
				} else {
					// If not in global state, fetch from database
					const houseFromDb = await databaseService.getHouseById(
						Number(id)
					);

					if (houseFromDb) {
						setHouse(houseFromDb);

						// Load building
						const buildingFromDb =
							await databaseService.getBuildingById(
								houseFromDb.buildingId
							);
						setBuilding(buildingFromDb);

						// Load house type
						if (houseFromDb.typeId) {
							const houseTypeFromDb =
								await databaseService.getHouseTypeById(
									houseFromDb.typeId
								);
							setHouseType(houseTypeFromDb);
						}

						// Load tenants
						const tenantsFromDb =
							await databaseService.getTenantsByHouseId(
								Number(id)
							);
						setTenants(tenantsFromDb);

						// Load bills
						const billsFromDb =
							await databaseService.getHouseBillsByHouseId(
								Number(id)
							);
						setBills(billsFromDb);

						// Load services
						const servicesFromDb =
							await databaseService.getServiceRecordsByHouseId(
								Number(id)
							);
						setServices(servicesFromDb);
					} else {
						Alert.alert("Error", "House not found");
						router.back();
					}
				}
			} catch (error) {
				console.error("Error loading house details:", error);
				Alert.alert("Error", "Failed to load house details");
			} finally {
				setLoading(false);
			}
		};

		loadHouseDetails();
	}, [id]);

	// Rest of the code remains the same...

	const handleDeleteHouse = () => {
		Alert.alert(
			"Delete House",
			`Are you sure you want to delete house ${house?.houseNumber}? This will also delete all tenant records associated with this house.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await databaseService.deleteHouse(Number(id));
							await dataSyncService.syncCollection("houses");
							router.back();
						} catch (error) {
							console.error("Error deleting house:", error);
							Alert.alert("Error", "Failed to delete house");
						}
					},
				},
			]
		);
	};

	const getHouseTypeLabel = (type: string) => {
		if (houseType) {
			return houseType.name;
		}

		switch (type) {
			case "bedsitter":
				return "Bedsitter";
			case "single":
				return "Single";
			case "one-bedroom":
				return "One Bedroom";
			case "two-bedroom":
				return "Two Bedroom";
			case "own-compound":
				return "Own Compound";
			default:
				return type.replace("-", " ");
		}
	};

	const getMeterTypeLabel = (type: string) => {
		switch (type) {
			case "shared":
				return "Shared Meter";
			case "token":
				return "Token Meter";
			case "individual":
				return "Individual Meter";
			default:
				return type;
		}
	};

	if (!house) {
		return (
			<Container>
				<Text
					className={`text-center ${
						isDarkMode ? "text-white" : "text-gray-800"
					}`}
				>
					{loading ? "Loading..." : "House not found"}
				</Text>
			</Container>
		);
	}

	const activeTenant = tenants.find((tenant) => tenant.isActive);

	return (
		<Container scrollable={false}>
			<ScrollView>
				{/* House Info Card */}
				<Card className="mb-4">
					<View className="flex-row justify-between items-start">
						<View>
							<View className="flex-row items-center">
								<Text
									className={`text-2xl font-bold ${
										isDarkMode
											? "text-white"
											: "text-gray-800"
									}`}
								>
									{house.houseNumber}
								</Text>
								<View
									className={`ml-2 px-2 py-0.5 rounded-full ${
										house.isOccupied
											? "bg-green-100"
											: "bg-yellow-100"
									}`}
								>
									<Text
										className={`text-xs ${
											house.isOccupied
												? "text-green-800"
												: "text-yellow-800"
										}`}
									>
										{house.isOccupied
											? "Occupied"
											: "Vacant"}
									</Text>
								</View>
							</View>
							{building && (
								<Text
									className={`mt-1 ${
										isDarkMode
											? "text-gray-400"
											: "text-gray-600"
									}`}
								>
									Building: {building.name}
								</Text>
							)}
						</View>
						<View className="flex-row">
							<TouchableOpacity
								className="p-2"
								onPress={handleDeleteHouse}
							>
								<Ionicons
									name="trash-outline"
									size={20}
									color="#EF4444"
								/>
							</TouchableOpacity>
						</View>
					</View>
				</Card>

				{/* House Details Card */}
				<Card className="mb-4" title="House Details">
					<View className="space-y-2">
						<View className="flex-row justify-between">
							<Text
								className={`${
									isDarkMode
										? "text-gray-400"
										: "text-gray-600"
								}`}
							>
								Type:
							</Text>
							<Text
								className={`font-medium ${
									isDarkMode ? "text-white" : "text-gray-800"
								}`}
							>
								{getHouseTypeLabel(house.type)}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text
								className={`${
									isDarkMode
										? "text-gray-400"
										: "text-gray-600"
								}`}
							>
								Monthly Rent:
							</Text>
							<Text
								className={`font-medium ${
									isDarkMode ? "text-white" : "text-gray-800"
								}`}
							>
								${house.rentAmount.toFixed(2)}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text
								className={`${
									isDarkMode
										? "text-gray-400"
										: "text-gray-600"
								}`}
							>
								Electricity Meter:
							</Text>
							<Text
								className={`font-medium ${
									isDarkMode ? "text-white" : "text-gray-800"
								}`}
							>
								{getMeterTypeLabel(house.electricityMeterType)}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text
								className={`${
									isDarkMode
										? "text-gray-400"
										: "text-gray-600"
								}`}
							>
								Water Meter:
							</Text>
							<Text
								className={`font-medium ${
									isDarkMode ? "text-white" : "text-gray-800"
								}`}
							>
								{getMeterTypeLabel(house.waterMeterType)}
							</Text>
						</View>
					</View>
				</Card>

				{/* Current Tenant Card */}
				<View className="mb-4">
					<View className="flex-row justify-between items-center mb-3">
						<Text
							className={`text-lg font-semibold ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							Current Tenant
						</Text>
						<Link
							href={{
								pathname: "/tenants/add",
								params: {
									houseId: id,
									houseNumber: house.houseNumber,
								},
							}}
							asChild
						>
							<Button
								title="Add Tenant"
								icon={
									<Ionicons
										name="person-add"
										size={16}
										color="white"
									/>
								}
								size="sm"
								disabled={!!activeTenant}
							/>
						</Link>
					</View>

					{activeTenant ? (
						<Card
							onPress={() =>
								router.push({
									pathname: `/tenants/${activeTenant.id}`,
									params: {
										houseId: id,
										houseNumber: house.houseNumber,
									},
								})
							}
						>
							<View className="flex-row justify-between items-center">
								<View>
									<Text
										className={`font-bold text-lg ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{activeTenant.name}
									</Text>
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										{activeTenant.phone}
									</Text>
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Occupants: {activeTenant.occupants}
									</Text>
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Move In:{" "}
										{new Date(
											activeTenant.moveInDate
										).toLocaleDateString()}
									</Text>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={isDarkMode ? "#9CA3AF" : "#6B7280"}
								/>
							</View>
						</Card>
					) : (
						<Card>
							<View className="items-center py-4">
								<Text
									className={`${
										isDarkMode
											? "text-gray-400"
											: "text-gray-600"
									}`}
								>
									No active tenant
								</Text>
								<Link
									href={{
										pathname: "/tenants/add",
										params: {
											houseId: id,
											houseNumber: house.houseNumber,
										},
									}}
									asChild
								>
									<TouchableOpacity className="mt-2 flex-row items-center">
										<Ionicons
											name="person-add-outline"
											size={18}
											color="#3B82F6"
										/>
										<Text className="text-primary ml-1">
											Add Tenant
										</Text>
									</TouchableOpacity>
								</Link>
							</View>
						</Card>
					)}
				</View>

				{/* Tenant History */}
				{tenants.length > 1 && (
					<View className="mb-4">
						<Text
							className={`text-lg font-semibold mb-3 ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							Tenant History
						</Text>

						{tenants
							.filter((tenant) => !tenant.isActive)
							.map((tenant) => (
								<Card
									key={tenant.id}
									className="mb-3"
									onPress={() =>
										router.push({
											pathname: `/tenants/${tenant.id}`,
											params: {
												houseId: id,
												houseNumber: house.houseNumber,
											},
										})
									}
								>
									<View className="flex-row justify-between items-center">
										<View>
											<Text
												className={`font-bold ${
													isDarkMode
														? "text-white"
														: "text-gray-800"
												}`}
											>
												{tenant.name}
											</Text>
											<Text
												className={`${
													isDarkMode
														? "text-gray-400"
														: "text-gray-600"
												}`}
											>
												{new Date(
													tenant.moveInDate
												).toLocaleDateString()}{" "}
												-{" "}
												{tenant.moveOutDate
													? new Date(
															tenant.moveOutDate
													  ).toLocaleDateString()
													: "Present"}
											</Text>
										</View>
										<Ionicons
											name="chevron-forward"
											size={20}
											color={
												isDarkMode
													? "#9CA3AF"
													: "#6B7280"
											}
										/>
									</View>
								</Card>
							))}
					</View>
				)}

				{/* Recent Bills */}
				<View className="mb-4">
					<View className="flex-row justify-between items-center mb-3">
						<Text
							className={`text-lg font-semibold ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							Recent Bills
						</Text>
						<Link
							href={{
								pathname: "/bills/add",
								params: { houseId: id },
							}}
							asChild
						>
							<Button
								title="Add Bill"
								icon={
									<Ionicons
										name="add"
										size={16}
										color="white"
									/>
								}
								size="sm"
							/>
						</Link>
					</View>

					{bills.length > 0 ? (
						bills.slice(0, 3).map((bill) => (
							<Card key={bill.id} className="mb-3">
								<View className="flex-row justify-between items-center">
									<View>
										<View className="flex-row items-center">
											<Text
												className={`font-bold ${
													isDarkMode
														? "text-white"
														: "text-gray-800"
												}`}
											>
												{bill.billType
													.charAt(0)
													.toUpperCase() +
													bill.billType.slice(1)}{" "}
												Bill
											</Text>
											<View
												className={`ml-2 px-2 py-0.5 rounded-full ${
													bill.isPaid
														? "bg-green-100"
														: "bg-red-100"
												}`}
											>
												<Text
													className={`text-xs ${
														bill.isPaid
															? "text-green-800"
															: "text-red-800"
													}`}
												>
													{bill.isPaid
														? "Paid"
														: "Unpaid"}
												</Text>
											</View>
										</View>
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Date:{" "}
											{new Date(
												bill.billDate
											).toLocaleDateString()}
										</Text>
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Amount: ${bill.amount.toFixed(2)}
										</Text>
									</View>
								</View>
							</Card>
						))
					) : (
						<Card>
							<View className="items-center py-4">
								<Text
									className={`${
										isDarkMode
											? "text-gray-400"
											: "text-gray-600"
									}`}
								>
									No bills found for this house
								</Text>
							</View>
						</Card>
					)}
				</View>

				{/* Services */}
				<View className="mb-4">
					<View className="flex-row justify-between items-center mb-3">
						<Text
							className={`text-lg font-semibold ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							Recent Services
						</Text>
						<Link
							href={{
								pathname: "/services/add",
								params: { houseId: id },
							}}
							asChild
						>
							<Button
								title="Add Service"
								icon={
									<Ionicons
										name="add"
										size={16}
										color="white"
									/>
								}
								size="sm"
							/>
						</Link>
					</View>

					{services.length > 0 ? (
						services.slice(0, 3).map((service) => (
							<Card
								key={service.id}
								className="mb-3"
								onPress={() =>
									router.push(`/services/${service.id}`)
								}
							>
								<View className="flex-row justify-between items-center">
									<View>
										<Text
											className={`font-bold ${
												isDarkMode
													? "text-white"
													: "text-gray-800"
											}`}
										>
											{service.serviceType}
										</Text>
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Date:{" "}
											{new Date(
												service.serviceDate
											).toLocaleDateString()}
										</Text>
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Cost: ${service.cost.toFixed(2)}
										</Text>
									</View>
									<Ionicons
										name="chevron-forward"
										size={20}
										color={
											isDarkMode ? "#9CA3AF" : "#6B7280"
										}
									/>
								</View>
							</Card>
						))
					) : (
						<Card>
							<View className="items-center py-4">
								<Text
									className={`${
										isDarkMode
											? "text-gray-400"
											: "text-gray-600"
									}`}
								>
									No services found for this house
								</Text>
							</View>
						</Card>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}
