import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Container from "../../../components/Container";
import databaseService from "../../../services/DatabaseService";
import dataSyncService from "../../../services/DataSyncService";
import globalState from "../../../state";
import { useTheme } from "../../../utils/ThemeContext";

export default function TenantsScreen() {
	const { isDarkMode } = useTheme();
	const router = useRouter();

	// Load tenants on mount
	useEffect(() => {
		const loadTenants = async () => {
			try {
				await dataSyncService.syncCollection("tenants");
				await dataSyncService.syncCollection("houses");
				await dataSyncService.syncCollection("buildings");
			} catch (error) {
				console.error("Error loading tenants:", error);
				Alert.alert("Error", "Failed to load tenants");
			}
		};

		loadTenants();
	}, []);

	// Get tenants from global state
	const tenants = globalState.tenants.get().filter((t) => t.isActive);
	const houses = globalState.houses.get();
	const buildings = globalState.buildings.get();
	const loading = globalState.ui.loading.get();

	// Enrich tenants with house and building info
	const enrichedTenants = tenants.map((tenant) => {
		const house = houses.find((h) => h.id === tenant.houseId);
		const building = house
			? buildings.find((b) => b.id === house.buildingId)
			: null;

		return {
			...tenant,
			houseNumber: house?.houseNumber,
			buildingName: building?.name,
		};
	});

	// Delete tenant
	const handleDeleteTenant = (tenant) => {
		Alert.alert(
			"Delete Tenant",
			`Are you sure you want to delete ${tenant.name}?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							await databaseService.deleteTenant(tenant.id);
							await dataSyncService.syncCollection("tenants");
							await dataSyncService.syncCollection("houses");
						} catch (error) {
							console.error("Error deleting tenant:", error);
							Alert.alert("Error", "Failed to delete tenant");
						}
					},
				},
			]
		);
	};

	// Render tenant item
	const renderTenantItem = ({ item }) => (
		<Card
			className="mb-3"
			onPress={() => router.push(`/tenants/${item.id}`)}
		>
			<View className="flex-row justify-between">
				<View>
					<Text
						className={`font-bold text-lg ${
							isDarkMode ? "text-white" : "text-gray-800"
						}`}
					>
						{item.name}
					</Text>
					<Text
						className={`${
							isDarkMode ? "text-gray-400" : "text-gray-600"
						}`}
					>
						{item.phone}
					</Text>
					{item.houseNumber && (
						<Text
							className={`${
								isDarkMode ? "text-gray-400" : "text-gray-600"
							}`}
						>
							House: {item.houseNumber}
						</Text>
					)}
					{item.buildingName && (
						<Text
							className={`${
								isDarkMode ? "text-gray-400" : "text-gray-600"
							}`}
						>
							Building: {item.buildingName}
						</Text>
					)}
				</View>
				<View className="flex-row">
					<TouchableOpacity
						className="p-2"
						onPress={() => handleDeleteTenant(item)}
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
	);

	// Render empty list
	const renderEmptyList = () => (
		<View className="items-center justify-center py-8">
			<Ionicons
				name="people-outline"
				size={60}
				color={isDarkMode ? "#4B5563" : "#D1D5DB"}
			/>
			<Text
				className={`text-lg font-medium mt-4 ${
					isDarkMode ? "text-gray-300" : "text-gray-600"
				}`}
			>
				No tenants found
			</Text>
			<Text
				className={`text-center mt-2 ${
					isDarkMode ? "text-gray-400" : "text-gray-500"
				}`}
			>
				Add tenants to your houses to get started
			</Text>
		</View>
	);

	return (
		<Container>
			<View className="flex-row justify-between items-center mb-4">
				<Text
					className={`text-2xl font-bold ${
						isDarkMode ? "text-white" : "text-gray-800"
					}`}
				>
					Tenants
				</Text>
				<Link href="/tenants/add" asChild>
					<Button
						title="Add Tenant"
						icon={<Ionicons name="add" size={18} color="white" />}
						size="sm"
					/>
				</Link>
			</View>

			<FlatList
				data={enrichedTenants}
				renderItem={renderTenantItem}
				keyExtractor={(item) => (item.id ?? "").toString()}
				ListEmptyComponent={renderEmptyList}
				contentContainerStyle={{ flexGrow: 1 }}
				refreshing={loading}
				onRefresh={() => {
					dataSyncService.syncCollection("tenants");
					dataSyncService.syncCollection("houses");
					dataSyncService.syncCollection("buildings");
				}}
			/>
		</Container>
	);
}
