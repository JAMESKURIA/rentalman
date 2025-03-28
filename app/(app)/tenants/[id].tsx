import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Container from "../../../components/Container";
import Input from "../../../components/Input";
import databaseService from "../../../services/DatabaseService";
import dataSyncService from "../../../services/DataSyncService";
import globalState from "../../../state";
import { useTheme } from "../../../utils/ThemeContext";

export default function TenantDetailScreen() {
	const { isDarkMode } = useTheme();
	const router = useRouter();
	const { id, houseId, houseNumber } = useLocalSearchParams<{
		id: string;
		houseId?: string;
		houseNumber?: string;
	}>();

	const [tenant, setTenant] = useState<any>(null);
	const [house, setHouse] = useState<any>(null);
	const [building, setBuilding] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);

	// Form state
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [occupants, setOccupants] = useState("");
	const [moveInDate, setMoveInDate] = useState("");
	const [moveOutDate, setMoveOutDate] = useState("");
	const [rentDueDay, setRentDueDay] = useState("");
	const [isActive, setIsActive] = useState(true);

	// Errors
	const [errors, setErrors] = useState({
		name: "",
		phone: "",
		email: "",
		occupants: "",
		moveInDate: "",
		rentDueDay: "",
	});

	// Load tenant data
	useEffect(() => {
		const loadTenant = async () => {
			try {
				setLoading(true);

				// Get tenant from global state
				const tenants = globalState.tenants.get(); // Get the entire tenants array
				const tenantData = tenants.find((t) => t.id === Number(id));

				if (tenantData) {
					setTenant(tenantData);
					setName(tenantData.name);
					setPhone(tenantData.phone);
					setEmail(tenantData.email || "");
					setOccupants(tenantData.occupants.toString());
					setMoveInDate(tenantData.moveInDate);
					setMoveOutDate(tenantData.moveOutDate || "");
					setRentDueDay(tenantData.rentDueDay.toString());
					setIsActive(tenantData.isActive);

					// Get house
					const houses = globalState.houses.get();
					const houseData = houses.find(
						(h) => h.id === tenantData.houseId
					);
					if (houseData) {
						setHouse(houseData);

						// Get building
						const buildings = globalState.buildings.get();
						const buildingData = buildings.find(
							(b) => b.id === houseData.buildingId
						);
						setBuilding(buildingData);
					}
				} else {
					// If not in global state, fetch from database
					const tenantFromDb = await databaseService.getTenantById(
						Number(id)
					);

					if (tenantFromDb) {
						setTenant(tenantFromDb);
						setName(tenantFromDb.name);
						setPhone(tenantFromDb.phone);
						setEmail(tenantFromDb.email || "");
						setOccupants(tenantFromDb.occupants.toString());
						setMoveInDate(tenantFromDb.moveInDate);
						setMoveOutDate(tenantFromDb.moveOutDate || "");
						setRentDueDay(tenantFromDb.rentDueDay.toString());
						setIsActive(tenantFromDb.isActive);

						// Get house
						const houseFromDb = await databaseService.getHouseById(
							tenantFromDb.houseId
						);
						if (houseFromDb) {
							setHouse(houseFromDb);

							// Get building
							const buildingFromDb =
								await databaseService.getBuildingById(
									houseFromDb.buildingId
								);
							setBuilding(buildingFromDb);
						}
					} else {
						Alert.alert("Error", "Tenant not found");
						router.back();
					}
				}
			} catch (error) {
				console.error("Error loading tenant:", error);
				Alert.alert("Error", "Failed to load tenant");
			} finally {
				setLoading(false);
			}
		};

		loadTenant();
	}, [id]);

	// Validate form
	const validate = () => {
		const newErrors = {
			name: "",
			phone: "",
			email: "",
			occupants: "",
			moveInDate: "",
			rentDueDay: "",
		};

		if (!name.trim()) {
			newErrors.name = "Tenant name is required";
		}

		if (!phone.trim()) {
			newErrors.phone = "Phone number is required";
		}

		if (email && !/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = "Email is invalid";
		}

		if (!occupants.trim()) {
			newErrors.occupants = "Number of occupants is required";
		} else if (isNaN(parseInt(occupants)) || parseInt(occupants) <= 0) {
			newErrors.occupants = "Occupants must be a positive number";
		}

		if (!moveInDate.trim()) {
			newErrors.moveInDate = "Move-in date is required";
		}

		if (!rentDueDay.trim()) {
			newErrors.rentDueDay = "Rent due day is required";
		} else if (
			isNaN(parseInt(rentDueDay)) ||
			parseInt(rentDueDay) < 1 ||
			parseInt(rentDueDay) > 31
		) {
			newErrors.rentDueDay = "Rent due day must be between 1 and 31";
		}

		setErrors(newErrors);

		return !Object.values(newErrors).some((error) => error);
	};

	// Handle update tenant
	const handleUpdateTenant = async () => {
		if (!validate()) {
			return;
		}

		setLoading(true);
		try {
			await databaseService.updateTenant({
				id: Number(id),
				houseId: tenant.houseId,
				name: name.trim(),
				phone: phone.trim(),
				email: email.trim() || undefined,
				occupants: parseInt(occupants),
				moveInDate,
				moveOutDate: moveOutDate || undefined,
				isActive,
				rentDueDay: parseInt(rentDueDay),
			});

			await dataSyncService.syncCollection("tenants");
			await dataSyncService.syncCollection("houses");

			// Update local state
			setTenant({
				...tenant,
				name: name.trim(),
				phone: phone.trim(),
				email: email.trim() || undefined,
				occupants: parseInt(occupants),
				moveInDate,
				moveOutDate: moveOutDate || undefined,
				isActive,
				rentDueDay: parseInt(rentDueDay),
			});

			setIsEditing(false);

			Alert.alert("Success", "Tenant updated successfully");
		} catch (error) {
			console.error("Error updating tenant:", error);
			Alert.alert("Error", "Failed to update tenant");
		} finally {
			setLoading(false);
		}
	};

	// Handle tenant checkout
	const handleCheckout = () => {
		Alert.alert(
			"Checkout Tenant",
			`Are you sure you want to check out ${tenant.name}? This will mark the tenant as inactive and the house as vacant.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Checkout",
					style: "destructive",
					onPress: async () => {
						try {
							setLoading(true);

							const today = new Date()
								.toISOString()
								.split("T")[0];

							await databaseService.updateTenant({
								...tenant,
								moveOutDate: today,
								isActive: false,
							});

							await dataSyncService.syncCollection("tenants");
							await dataSyncService.syncCollection("houses");

							Alert.alert(
								"Success",
								"Tenant checked out successfully",
								[{ text: "OK", onPress: () => router.back() }]
							);
						} catch (error) {
							console.error("Error checking out tenant:", error);
							Alert.alert("Error", "Failed to check out tenant");
							setLoading(false);
						}
					},
				},
			]
		);
	};

	if (!tenant) {
		return (
			<Container>
				<Text
					className={`text-center ${
						isDarkMode ? "text-white" : "text-gray-800"
					}`}
				>
					{loading ? "Loading..." : "Tenant not found"}
				</Text>
			</Container>
		);
	}

	return (
		<Container scrollable>
			{isEditing ? (
				// Edit mode
				<View className="mb-6">
					<Text
						className={`text-2xl font-bold mb-4 ${
							isDarkMode ? "text-white" : "text-gray-800"
						}`}
					>
						Edit Tenant
					</Text>

					<Input
						label="Tenant Name"
						value={name}
						onChangeText={setName}
						placeholder="Enter tenant name"
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
						label="Number of Occupants"
						value={occupants}
						onChangeText={setOccupants}
						placeholder="Enter number of occupants"
						keyboardType="numeric"
						error={errors.occupants}
					/>

					<Input
						label="Move-in Date"
						value={moveInDate}
						onChangeText={setMoveInDate}
						placeholder="YYYY-MM-DD"
						error={errors.moveInDate}
					/>

					<Input
						label="Move-out Date (Optional)"
						value={moveOutDate}
						onChangeText={setMoveOutDate}
						placeholder="YYYY-MM-DD"
					/>

					<Input
						label="Rent Due Day (1-31)"
						value={rentDueDay}
						onChangeText={setRentDueDay}
						placeholder="Enter day of month when rent is due"
						keyboardType="numeric"
						error={errors.rentDueDay}
					/>

					<View className="flex-row mt-4">
						<Button
							title="Cancel"
							onPress={() => {
								setIsEditing(false);
								setName(tenant.name);
								setPhone(tenant.phone);
								setEmail(tenant.email || "");
								setOccupants(tenant.occupants.toString());
								setMoveInDate(tenant.moveInDate);
								setMoveOutDate(tenant.moveOutDate || "");
								setRentDueDay(tenant.rentDueDay.toString());
								setIsActive(tenant.isActive);
							}}
							variant="outline"
							size="md"
							className="flex-1 mr-2"
						/>
						<Button
							title="Save"
							onPress={handleUpdateTenant}
							loading={loading}
							size="md"
							className="flex-1 ml-2"
						/>
					</View>
				</View>
			) : (
				// View mode
				<>
					<View className="mb-6">
						<View className="flex-row justify-between items-center mb-4">
							<Text
								className={`text-2xl font-bold ${
									isDarkMode ? "text-white" : "text-gray-800"
								}`}
							>
								{tenant.name}
							</Text>
							<TouchableOpacity
								className="p-2"
								onPress={() => setIsEditing(true)}
							>
								<Ionicons
									name="pencil-outline"
									size={20}
									color={isDarkMode ? "#9CA3AF" : "#6B7280"}
								/>
							</TouchableOpacity>
						</View>

						<Card className="mb-4">
							<View className="space-y-2">
								<View className="flex-row justify-between">
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Status:
									</Text>
									<View
										className={`px-2 py-0.5 rounded-full ${
											tenant.isActive
												? "bg-green-100"
												: "bg-red-100"
										}`}
									>
										<Text
											className={`text-xs ${
												tenant.isActive
													? "text-green-800"
													: "text-red-800"
											}`}
										>
											{tenant.isActive
												? "Active"
												: "Inactive"}
										</Text>
									</View>
								</View>
								<View className="flex-row justify-between">
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Phone:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{tenant.phone}
									</Text>
								</View>
								{tenant.email && (
									<View className="flex-row justify-between">
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Email:
										</Text>
										<Text
											className={`font-medium ${
												isDarkMode
													? "text-white"
													: "text-gray-800"
											}`}
										>
											{tenant.email}
										</Text>
									</View>
								)}
								<View className="flex-row justify-between">
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Occupants:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{tenant.occupants}
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
										Move-in Date:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{new Date(
											tenant.moveInDate
										).toLocaleDateString()}
									</Text>
								</View>
								{tenant.moveOutDate && (
									<View className="flex-row justify-between">
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Move-out Date:
										</Text>
										<Text
											className={`font-medium ${
												isDarkMode
													? "text-white"
													: "text-gray-800"
											}`}
										>
											{new Date(
												tenant.moveOutDate
											).toLocaleDateString()}
										</Text>
									</View>
								)}
								<View className="flex-row justify-between">
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										Rent Due Day:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{tenant.rentDueDay}
									</Text>
								</View>
							</View>
						</Card>
					</View>

					<Card className="mb-4">
						<Text
							className={`text-lg font-bold mb-2 ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							House Details
						</Text>

						{house ? (
							<View className="space-y-2">
								<View className="flex-row justify-between">
									<Text
										className={`${
											isDarkMode
												? "text-gray-400"
												: "text-gray-600"
										}`}
									>
										House Number:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{house.houseNumber}
									</Text>
								</View>
								{building && (
									<View className="flex-row justify-between">
										<Text
											className={`${
												isDarkMode
													? "text-gray-400"
													: "text-gray-600"
											}`}
										>
											Building:
										</Text>
										<Text
											className={`font-medium ${
												isDarkMode
													? "text-white"
													: "text-gray-800"
											}`}
										>
											{building.name}
										</Text>
									</View>
								)}
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
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										{house.type.charAt(0).toUpperCase() +
											house.type
												.slice(1)
												.replace("-", " ")}
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
										Rent Amount:
									</Text>
									<Text
										className={`font-medium ${
											isDarkMode
												? "text-white"
												: "text-gray-800"
										}`}
									>
										${house.rentAmount.toFixed(2)}
									</Text>
								</View>
							</View>
						) : (
							<Text
								className={`${
									isDarkMode
										? "text-gray-400"
										: "text-gray-600"
								}`}
							>
								House details not available
							</Text>
						)}
					</Card>

					{tenant.isActive && (
						<Button
							title="Checkout Tenant"
							onPress={handleCheckout}
							variant="danger"
							size="md"
							fullWidth
							icon={
								<Ionicons
									name="log-out-outline"
									size={18}
									color="white"
								/>
							}
						/>
					)}
				</>
			)}
		</Container>
	);
}
