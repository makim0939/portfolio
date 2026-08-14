import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

/*
	検索エンジンへの案内。

	サムネイルを作る作業場と API は読み物ではないので拾わせない。
	本番では 404 になるが、拾いにこられること自体を減らしておく。
*/
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/", "/thumbnail-studio"],
		},
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}
