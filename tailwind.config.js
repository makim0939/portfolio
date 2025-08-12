const { extend } = require("@react-three/fiber");

module.exports = {
	content: ["./src/**/*.{ts,tsx}", "./content/**/*.{md,mdx}"],
	theme: {
		extend: {
			colors: {
				maki: {
					black: "#252528",
					gray: "#757578",
				},
			},
		},
	},
	plugins: [require("@tailwindcss/typography")],
};
