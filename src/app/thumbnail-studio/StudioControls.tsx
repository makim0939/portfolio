"use client";

import { AVATAR_MOTIONS, type AvatarMotion } from "@/lib/avatarMotion";
import {
	DEFAULT_PHOTO_LAYOUT,
	type PhotoLayout,
	type ThumbnailDesign,
	thumbnailDesignToQuery,
} from "@/lib/thumbnailDesign";

const PANEL_BACKGROUND = "#ffffff";
const BORDER_COLOR = "#e5e5e5";
const TEXT_COLOR = "#252528";
const SUB_TEXT_COLOR = "#757578";

const inputStyle: React.CSSProperties = {
	padding: "4px 8px",
	border: `1px solid ${BORDER_COLOR}`,
	borderRadius: 6,
	fontSize: 13,
	fontFamily: "inherit",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 30 }}>
			<span style={{ width: 76, flexShrink: 0, fontSize: 12, color: SUB_TEXT_COLOR }}>{label}</span>
			{children}
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			<h2 style={{ fontSize: 12, fontWeight: 700, color: TEXT_COLOR }}>{title}</h2>
			{children}
		</section>
	);
}

/** 位置や大きさの数値入力。まとめて横に並べる */
function NumberField({
	label,
	value,
	onChange,
}: { label: string; value: number; onChange: (value: number) => void }) {
	return (
		<label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
			<span style={{ color: SUB_TEXT_COLOR }}>{label}</span>
			<input
				type="number"
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ ...inputStyle, width: 62 }}
			/>
		</label>
	);
}

export type ExportState = { status: "idle" | "running" | "done" | "error"; message: string };

type StudioControlsProps = {
	design: ThumbnailDesign;
	onChange: (design: ThumbnailDesign) => void;
	duration: number;
	boneNames: string[];
	selectedBone: string;
	onSelectBone: (name: string) => void;
	slug: string;
	onSlugChange: (slug: string) => void;
	exportState: ExportState;
	onExport: () => void;
};

export function StudioControls({
	design,
	onChange,
	duration,
	boneNames,
	selectedBone,
	onSelectBone,
	slug,
	onSlugChange,
	exportState,
	onExport,
}: StudioControlsProps) {
	const updateLayout = (patch: Partial<PhotoLayout>) =>
		onChange({ ...design, photoLayout: { ...design.photoLayout, ...patch } });

	const editedBones = Object.keys(design.pose);
	const command = `pnpm thumbnail --slug ${slug || "<記事の名前>"} --query ${JSON.stringify(thumbnailDesignToQuery(design).toString())}`;

	return (
		<div
			style={{
				display: "flex",
				gap: 32,
				padding: 20,
				backgroundColor: PANEL_BACKGROUND,
				borderTop: `1px solid ${BORDER_COLOR}`,
				color: TEXT_COLOR,
				flexWrap: "wrap",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 14, width: 380 }}>
				<Section title="文字">
					<Row label="ラベル">
						<input
							value={design.label}
							onChange={(e) => onChange({ ...design, label: e.target.value })}
							style={{ ...inputStyle, flex: 1 }}
						/>
					</Row>
					<Row label="題名">
						<textarea
							value={design.titleLines.join("\n")}
							onChange={(e) => onChange({ ...design, titleLines: e.target.value.split("\n") })}
							rows={2}
							style={{ ...inputStyle, flex: 1, resize: "vertical" }}
						/>
					</Row>
					<Row label="説明">
						<input
							value={design.subtitle}
							onChange={(e) => onChange({ ...design, subtitle: e.target.value })}
							style={{ ...inputStyle, flex: 1 }}
						/>
					</Row>
				</Section>

				<Section title="写真">
					<Row label="パス">
						<input
							value={design.photo}
							placeholder="/blog/記事の名前/写真.webp"
							onChange={(e) => onChange({ ...design, photo: e.target.value })}
							style={{ ...inputStyle, flex: 1 }}
						/>
					</Row>
					<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
						<NumberField
							label="x"
							value={design.photoLayout.x}
							onChange={(x) => updateLayout({ x })}
						/>
						<NumberField
							label="y"
							value={design.photoLayout.y}
							onChange={(y) => updateLayout({ y })}
						/>
						<NumberField
							label="幅"
							value={design.photoLayout.width}
							onChange={(width) => updateLayout({ width })}
						/>
						<NumberField
							label="高さ"
							value={design.photoLayout.height}
							onChange={(height) => updateLayout({ height })}
						/>
						<NumberField
							label="傾き"
							value={design.photoLayout.rotation}
							onChange={(rotation) => updateLayout({ rotation })}
						/>
					</div>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
							<input
								type="checkbox"
								checked={design.photoLayout.inFront}
								onChange={(e) => updateLayout({ inFront: e.target.checked })}
							/>
							アバターより手前に出す
						</label>
						<button
							type="button"
							onClick={() => updateLayout(DEFAULT_PHOTO_LAYOUT)}
							style={{ ...inputStyle, cursor: "pointer" }}
						>
							位置を戻す
						</button>
					</div>
					<p style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
						写真は上のプレビューでつまんで動かせます。
					</p>
				</Section>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 14, width: 420 }}>
				<Section title="アバター">
					<Row label="モーション">
						<select
							value={design.motion}
							onChange={(e) => onChange({ ...design, motion: e.target.value as AvatarMotion })}
							style={inputStyle}
						>
							{AVATAR_MOTIONS.map((name) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
					</Row>
					<Row label="ポーズ">
						<input
							type="range"
							min={0}
							max={duration || 6}
							step={0.01}
							value={design.time}
							onChange={(e) => onChange({ ...design, time: Number(e.target.value) })}
							style={{ flex: 1 }}
						/>
						<span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
							{design.time.toFixed(2)} / {(duration || 6).toFixed(2)}秒
						</span>
					</Row>
				</Section>

				<Section title="骨を直す">
					<Row label="選ぶ">
						<select
							value={selectedBone}
							onChange={(e) => onSelectBone(e.target.value)}
							style={{ ...inputStyle, flex: 1 }}
						>
							<option value="">（選ばない）</option>
							{boneNames.map((name) => (
								<option key={name} value={name}>
									{design.pose[name] ? `${name} ✓` : name}
								</option>
							))}
						</select>
					</Row>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						<button
							type="button"
							disabled={!selectedBone || !design.pose[selectedBone]}
							onClick={() => {
								const { [selectedBone]: _removed, ...rest } = design.pose;
								onChange({ ...design, pose: rest });
							}}
							style={{ ...inputStyle, cursor: "pointer" }}
						>
							この骨を戻す
						</button>
						<button
							type="button"
							disabled={editedBones.length === 0}
							onClick={() => onChange({ ...design, pose: {} })}
							style={{ ...inputStyle, cursor: "pointer" }}
						>
							全部戻す
						</button>
						<span style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
							{editedBones.length > 0
								? `${editedBones.length}本を直しました`
								: "まだ直していません"}
						</span>
					</div>
					<p style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
						選ぶと輪が出ます。輪をドラッグすると、その骨だけ回せます。
					</p>
				</Section>

				<Section title="書き出す">
					<Row label="記事の名前">
						<input
							value={slug}
							placeholder="kanyou-shokubutsu"
							onChange={(e) => onSlugChange(e.target.value)}
							style={{ ...inputStyle, flex: 1 }}
						/>
						<button
							type="button"
							disabled={!slug || exportState.status === "running"}
							onClick={onExport}
							style={{
								...inputStyle,
								cursor: slug ? "pointer" : "not-allowed",
								backgroundColor: slug ? "#dd5522" : "#f0f0f0",
								color: slug ? "#fffdf8" : SUB_TEXT_COLOR,
								border: "none",
								padding: "6px 16px",
							}}
						>
							{exportState.status === "running" ? "書き出し中…" : "書き出す"}
						</button>
					</Row>
					{exportState.message && (
						<p
							style={{
								fontSize: 12,
								color: exportState.status === "error" ? "#cc3333" : SUB_TEXT_COLOR,
							}}
						>
							{exportState.message}
						</p>
					)}
					<details>
						<summary style={{ fontSize: 11, color: SUB_TEXT_COLOR, cursor: "pointer" }}>
							ターミナルから書き出すときのコマンド
						</summary>
						<code
							style={{
								display: "block",
								marginTop: 6,
								padding: 10,
								borderRadius: 6,
								backgroundColor: "#f5f5f5",
								fontSize: 11,
								lineHeight: 1.6,
								wordBreak: "break-all",
							}}
						>
							{command}
						</code>
					</details>
				</Section>
			</div>
		</div>
	);
}
