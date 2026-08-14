import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// sharp をバンドルに取り込ませない。開発サーバではバンドルされた sharp が
	// 画像を受け取れず、OGP画像の生成だけが失敗するため。
	serverExternalPackages: ["sharp"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
		],
	},
};

export default nextConfig;
