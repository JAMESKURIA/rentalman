/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./App.{js,jsx,ts,tsx}",
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
		"./screens/**/*.{js,jsx,ts,tsx}",
		"./navigation/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: "#3B82F6",
					dark: "#1D4ED8",
				},
				secondary: {
					DEFAULT: "#10B981",
					dark: "#059669",
				},
				background: {
					light: "#F9FAFB",
					dark: "#1F2937",
				},
				text: {
					light: "#1F2937",
					dark: "#F9FAFB",
				},
				card: {
					light: "#FFFFFF",
					dark: "#374151",
				},
				border: {
					light: "#E5E7EB",
					dark: "#4B5563",
				},
			},
		},
	},
	plugins: [],
	presets: [require("nativewind/preset")],
};
