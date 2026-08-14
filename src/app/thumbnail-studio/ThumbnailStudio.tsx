"use client";

import {
	type PhotoLayout,
	type ThumbnailDesign,
	parseThumbnailDesign,
	thumbnailDesignToQuery,
} from "@/lib/thumbnailDesign";
import { useCallback, useEffect, useState } from "react";
import { type ExportState, StudioControls } from "./StudioControls";
import { ThumbnailPreview } from "./ThumbnailPreview";

export function ThumbnailStudio() {
	/*
		クエリはブラウザでしか読めないので、読み終えるまで何も描かない。
		先にサーバ側の既定値を描くと、文字が入れ替わってちらつくうえ、
		撮影の合図が入れ替わる前に出てしまう。
	*/
	const [design, setDesign] = useState<ThumbnailDesign | null>(null);
	const [slug, setSlug] = useState("");
	const [duration, setDuration] = useState(0);
	const [boneNames, setBoneNames] = useState<string[]>([]);
	const [selectedBone, setSelectedBone] = useState("");
	const [exportState, setExportState] = useState<ExportState>({ status: "idle", message: "" });

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setDesign(parseThumbnailDesign(params));
		setSlug(params.get("slug") ?? "");
	}, []);

	const handleMeasureDuration = useCallback((seconds: number) => setDuration(seconds), []);
	const handleBonesFound = useCallback((names: string[]) => setBoneNames(names), []);

	const handleBoneRotated = useCallback(
		(name: string, rotation: [number, number, number]) =>
			setDesign((current) =>
				current ? { ...current, pose: { ...current.pose, [name]: rotation } } : current,
			),
		[],
	);

	const handlePhotoMoved = useCallback(
		(photoLayout: PhotoLayout) =>
			setDesign((current) => (current ? { ...current, photoLayout } : current)),
		[],
	);

	/*
		書き出しは開発サーバに任せる。
		見えている絵をそのまま画像にするのではなく、いまの指定でこのページを
		もう一度開いて撮り直すので、プレビューと同じものができる。
	*/
	const handleExport = useCallback(async () => {
		if (!design) return;
		setExportState({ status: "running", message: "" });
		try {
			const response = await fetch("/api/thumbnail-studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug, query: thumbnailDesignToQuery(design).toString() }),
			});
			const result = await response.json();
			setExportState({
				status: response.ok ? "done" : "error",
				message: response.ok ? result.message : (result.message ?? "書き出せませんでした"),
			});
		} catch (error) {
			setExportState({ status: "error", message: `書き出せませんでした: ${error}` });
		}
	}, [design, slug]);

	if (!design) return null;

	return (
		// ページの余白や下のナビに邪魔されたくないので、画面全体に重ねて置く
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				overflow: "auto",
				backgroundColor: "#fafafa",
			}}
		>
			<ThumbnailPreview
				design={design}
				selectedBone={selectedBone}
				onMeasureDuration={handleMeasureDuration}
				onBonesFound={handleBonesFound}
				onBoneRotated={handleBoneRotated}
				onPhotoMoved={handlePhotoMoved}
			/>
			<StudioControls
				design={design}
				onChange={setDesign}
				duration={duration}
				boneNames={boneNames}
				selectedBone={selectedBone}
				onSelectBone={setSelectedBone}
				slug={slug}
				onSlugChange={setSlug}
				exportState={exportState}
				onExport={handleExport}
			/>
		</div>
	);
}
