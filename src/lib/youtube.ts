/** watch・youtu.be・embed・shorts のどの形のURLからでも動画IDを取り出す */
export function youtubeVideoId(url: string): string | undefined {
	const patterns = [
		/youtu\.be\/([\w-]{11})/,
		/[?&]v=([\w-]{11})/,
		/\/embed\/([\w-]{11})/,
		/\/shorts\/([\w-]{11})/,
	];
	for (const pattern of patterns) {
		const matched = url.match(pattern);
		if (matched) return matched[1];
	}
	return undefined;
}

/**
 * maxresdefault は元の動画が高解像度のときだけ存在する。
 * 出ない動画では、frontmatter の thumbnail に画像を指定する。
 */
export function youtubeThumbnail(url: string): string | undefined {
	const videoId = youtubeVideoId(url);
	return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : undefined;
}
