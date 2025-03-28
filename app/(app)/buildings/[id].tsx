import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Container from "../../../components/Container";
import Input from "../../../components/Input";
import databaseService from "../../../services/DatabaseService";
import dataSyncService from "../../../services/DataSyncService";
import globalState from "../../../state";
import { useTheme } from "../../../utils/ThemeContext";

export default function BuildingDetailScreen() {
	const { isDarkMode } = useTheme();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();

	const [building, setBuilding] = useState<any>(null);
	const [houses, setHouses] = useState<any[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({
		name: "",
		address: "",
	});

	// Load building data
	useEffect(() => {
		const loadBuilding = async () => {
			try {
				setLoading(true);

				// Get building from global state
				const buildingData = globalState.buildings
					.get()
					.find((b) => b.id === Number(id));
				if (buildingData) {
					setBuilding(buildingData);
					setName(buildingData.name);
					setAddress(buildingData.address);
				} else {
					// If not in global state, fetch from database
					const buildingFromDb =
						await databaseService.getBuildingById(Number(id));

					if (buildingFromDb) {
						setBuilding(buildingFromDb);
						setName(buildingFromDb.name);
						setAddress(buildingFromDb.address);
					} else {
						Alert.alert("Error", "Building not found");
						router.back();
					}
				}

				// Get houses for this building
				const housesData = globalState.houses
					.get()
					.filter((h) => h.buildingId === Number(id));
				setHouses(housesData);
			} catch (error) {
				console.error("Error loading building:", error);
				Alert.alert("Error", "Failed to load building");
			} finally {
				setLoading(false);
			}
		};

		loadBuilding();
	}, [id]);

	// Validate form
	const validate = () => {
		const newErrors = {
			name: "",
			address: "",
		};

		if (!name.trim()) {
			newErrors.name = "Building name is required";
		}

		if (!address.trim()) {
			newErrors.address = "Address is required";
		}

		setErrors(newErrors);

		return !Object.values(newErrors).some((error) => error);
	};

	// Handle update building
	const handleUpdateBuilding = async () => {
		if (!validate()) {
			return;
		}

		setLoading(true);
		try {
			await databaseService.updateBuilding({
				id: Number(id),
				name: name.trim(),
				address: address.trim(),
			});

			await dataSyncService.syncCollection("buildings");

			// Update local state
			setBuilding({
				...building,
				name: name.trim(),
				address: address.trim(),
			});

			setIsEditing(false);

			Alert.alert("Success", "Building updated successfully");
		} catch (error) {
			console.error("Error updating building:", error);
			Alert.alert("Error", "Failed to update building");
		} finally {
			setLoading(false);
		}
	};

	// Render house item
	const renderHouseItem = ({ item }) => (
		<Card
			className="mb-3"
			onPress={() => router.push(`/houses/${item.id}`)}
		>
			<View className="flex-row justify-between items-center">
				<View>
					<Text
						className={`font-bold text-lg ${
							isDarkMode ? "text-white" : "text-gray-800"
						}`}
					>
						{item.houseNumber}
					</Text>
					<Text
						className={`${
							isDarkMode ? "text-gray-400" : "text-gray-600"
						}`}
					>
						{item.type.charAt(0).toUpperCase() +
							item.type.slice(1).replace("-", " ")}
					</Text>
					<Text
						className={`${
							isDarkMode ? "text-gray-400" : "text-gray-600"
						}`}
					>
						Rent: ${item.rentAmount.toFixed(2)}
					</Text>
				</View>
				<View className="flex-row items-center">
					<View
						className={`px-2 py-1 rounded-full mr-2 ${
							item.isOccupied ? "bg-green-100" : "bg-yellow-100"
						}`}
					>
						<Text
							className={`text-xs ${
								item.isOccupied
									? "text-green-800"
									: "text-yellow-800"
							}`}
						>
							{item.isOccupied ? "Occupied" : "Vacant"}
						</Text>
					</View>
					<Ionicons
						name="chevron-forward"
						size={20}
						color={isDarkMode ? "#9CA3AF" : "#6B7280"}
					/>
				</View>
			</View>
		</Card>
	);

	// Render empty houses list
	const renderEmptyHousesList = () => (
		<View className="items-center justify-center py-8">
			<Ionicons
				name="home-outline"
				size={60}
				color={isDarkMode ? "#4B5563" : "#D1D5DB"}
			/>
			<Text
				className={`text-lg font-medium mt-4 ${
					isDarkMode ? "text-gray-300" : "text-gray-600"
				}`}
			>
				No houses found
			</Text>
			<Text
				className={`text-center mt-2 ${
					isDarkMode ? "text-gray-400" : "text-gray-500"
				}`}
			>
				Add houses to this building
			</Text>
		</View>
	);

	if (!building) {
		return (
			<Container>
				<Text
					className={`text-center ${
						isDarkMode ? "text-white" : "text-gray-800"
					}`}
				>
					Loading...
				</Text>
			</Container>
		);
	}

	return (
		<Container>
			{isEditing ? (
				// Edit mode
				<View className="mb-6">
					<Text
						className={`text-2xl font-bold mb-4 ${
							isDarkMode ? "text-white" : "text-gray-800"
						}`}
					>
						Edit Building
					</Text>

					<Input
						label="Building Name"
						value={name}
						onChangeText={setName}
						placeholder="Enter building name"
						error={errors.name}
					/>

					<Input
						label="Address"
						value={address}
						onChangeText={setAddress}
						placeholder="Enter building address"
						multiline
						numberOfLines={3}
						error={errors.address}
					/>

					<View className="flex-row mt-4">
						<Button
							title="Cancel"
							onPress={() => {
								setIsEditing(false);
								setName(building.name);
								setAddress(building.address);
							}}
							variant="outline"
							size="md"
							className="flex-1 mr-2"
						/>
						<Button
							title="Save"
							onPress={handleUpdateBuilding}
							loading={loading}
							size="md"
							className="flex-1 ml-2"
						/>
					</View>
				</View>
			) : (
				// View mode
				<View className="mb-6">
					<View className="flex-row justify-between items-center mb-4">
						<Text
							className={`text-2xl font-bold ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							{building.name}
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
						<Text
							className={`font-medium mb-1 ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							Address
						</Text>
						<Text
							className={`${
								isDarkMode ? "text-gray-400" : "text-gray-600"
							}`}
						>
							{building.address}
						</Text>
					</Card>
				</View>
			)}

			<View className="flex-row justify-between items-center mb-4">
				<Text
					className={`text-lg font-bold ${
						isDarkMode ? "text-white" : "text-gray-800"
					}`}
				>
					Houses
				</Text>
				<Link
					href={{
						pathname: "/houses/add",
						params: { buildingId: id },
					}}
					asChild
				>
					<Button
						title="Add House"
						icon={<Ionicons name="add" size={18} color="white" />}
						size="sm"
						onPress={() => {}}
					/>
				</Link>
			</View>

			<FlatList
				data={houses}
				renderItem={renderHouseItem}
				keyExtractor={(item) => item.id.toString()}
				ListEmptyComponent={renderEmptyHousesList}
				contentContainerStyle={{ flexGrow: 1 }}
			/>
		</Container>
	);
}
