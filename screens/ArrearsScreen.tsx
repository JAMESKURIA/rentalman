import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import Card from "../components/Card";
import Container from "../components/Container";
import databaseService from "../services/DatabaseService";
import { useTheme } from "../utils/ThemeContext";

const ArrearsScreen = () => {
	const navigation = useNavigation<any>();
	const { isDarkMode } = useTheme();

	const [arrears, setArrears] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadArrears = async () => {
			try {
				setLoading(true);
				const data = await databaseService.getArrearsReport();
				setArrears(data);
			} catch (error) {
				console.error("Error loading arrears:", error);
				Alert.alert("Error", "Failed to load arrears data");
			} finally {
				setLoading(false);
			}
		};

		loadArrears();

		// Refresh data when the screen is focused
		const unsubscribe = navigation.addListener("focus", loadArrears);
		return unsubscribe;
	}, [navigation]);

	const renderArrearItem = ({ item }: { item: any }) => (
		<Card className="mb-3">
			<View>
				<View className="flex-row justify-between items-center">
					<Text
						className={`font-bold text-lg ${
							isDarkMode ? "text-white" : "text-gray-800"
						}`}
					>
						{item.tenantName}
					</Text>
					<View className="px-2 py-0.5 rounded-full bg-red-100">
						<Text className="text-xs text-red-800">Unpaid</Text>
					</View>
				</View>
				<Text
					className={`${
						isDarkMode ? "text-gray-400" : "text-gray-600"
					}`}
				>
					Building: {item.buildingName}
				</Text>
				<Text
					className={`${
						isDarkMode ? "text-gray-400" : "text-gray-600"
					}`}
				>
					House: {item.houseNumber}
				</Text>
				<View className="mt-2 p-2 bg-opacity-10 bg-red-500 rounded">
					<View className="flex-row justify-between">
						<Text
							className={`${
								isDarkMode ? "text-gray-300" : "text-gray-700"
							}`}
						>
							{item.billType.charAt(0).toUpperCase() +
								item.billType.slice(1)}{" "}
							Bill ({new Date(item.billDate).toLocaleDateString()}
							)
						</Text>
						<Text
							className={`font-medium ${
								isDarkMode ? "text-white" : "text-gray-800"
							}`}
						>
							${item.amount.toFixed(2)}
						</Text>
					</View>
				</View>
			</View>
		</Card>
	);

	const renderEmptyList = () => (
		<View className="items-center justify-center py-8">
			<Ionicons
				name="checkmark-circle-outline"
				size={60}
				color={isDarkMode ? "#4B5563" : "#D1D5DB"}
			/>
			<Text
				className={`text-lg font-medium mt-4 ${
					isDarkMode ? "text-gray-300" : "text-gray-600"
				}`}
			>
				No arrears found
			</Text>
			<Text
				className={`text-center mt-2 ${
					isDarkMode ? "text-gray-400" : "text-gray-500"
				}`}
			>
				All bills have been paid
			</Text>
		</View>
	);

	return (
		<Container>
			<Text
				className={`text-2xl font-bold mb-4 ${
					isDarkMode ? "text-white" : "text-gray-800"
				}`}
			>
				Arrears
			</Text>

			<FlatList
				data={arrears}
				renderItem={renderArrearItem}
				keyExtractor={(item, index) =>
					`${item.tenantId}-${item.billId}-${index}`
				}
				ListEmptyComponent={renderEmptyList}
				contentContainerStyle={{ flexGrow: 1 }}
			/>
		</Container>
	);
};

export default ArrearsScreen;
