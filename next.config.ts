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
			{
				// 演奏動画のサムネイル（YouTube）
				protocol: "https",
				hostname: "i.ytimg.com",
			},
		],
	},
};

export default nextConfig;
