"use client";

import { AVATAR_MOTIONS, type AvatarMotion } from "@/lib/avatarMotion";
import {
	type AvatarLayout,
	DEFAULT_AVATAR_LAYOUT,
	DEFAULT_PHOTO_LAYOUT,
	type PhotoLayout,
	type ThumbnailDesign,
	thumbnailDesignToQuery,
} from "@/lib/thumbnailDesign";
import { useRef, useState } from "react";

const PANEL_BACKGROUND = "#ffffff";
const BORDER_COLOR = "#e5e5e5";
const TEXT_COLOR = "#252528";
const SUB_TEXT_COLOR = "#757578";
const ACCENT_COLOR = "#dd5522";
const ERROR_COLOR = "#cc3333";

const inputStyle: React.CSSProperties = {
	padding: "4px 8px",
	border: `1px solid ${BORDER_COLOR}`,
	borderRadius: 6,
	fontSize: 13,
	fontFamily: "inherit",
};

/**
 * 押せないボタンの見た目。
 *
 * 素の disabled 属性だけでは、このパネルのボタンはどれも同じ枠線・文字色なので
 * 押せる状態と見分けがつかない。カーソルも指定していると disabled でも
 * pointer のまま残ることがあるため、ここで薄くしてはっきり示す。
 */
function disabledButtonStyle(disabled: boolean): React.CSSProperties {
	return {
		...inputStyle,
		cursor: disabled ? "not-allowed" : "pointer",
		opacity: disabled ? 0.4 : 1,
	};
}

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

/**
 * 写真を選ぶところ。落としても、押して選んでも入る。
 *
 * 撮影はこのページをもう一度開いて撮るので、選んだ写真は URL で読める場所に
 * 置く必要がある。記事のフォルダに移してから、そのパスを持たせる。
 */
function PhotoPicker({
	photo,
	slug,
	onPick,
}: { photo: string; slug: string; onPick: (path: string) => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [hovering, setHovering] = useState(false);
	const [message, setMessage] = useState("");
	const [failed, setFailed] = useState(false);

	/*
		写真は記事のフォルダに置くので、記事の名前が決まるまでは受け取れない。
		押せない見た目にして、理由をその場に出しておく。
		黙って何も起きないと、写真が入らない理由が分からないため。
	*/
	const ready = Boolean(slug);

	const upload = async (file: File | undefined) => {
		if (!file || !ready) return;

		setFailed(false);
		setMessage("取り込み中…");
		const body = new FormData();
		body.append("slug", slug);
		body.append("file", file);

		try {
			const response = await fetch("/api/thumbnail-studio/photo", { method: "POST", body });
			const result = await response.json();
			if (!response.ok) {
				setFailed(true);
				setMessage(result.message ?? "取り込めませんでした。");
				return;
			}
			onPick(result.path);
			setMessage(`${result.path} に置きました。`);
		} catch (error) {
			setFailed(true);
			setMessage(`取り込めませんでした: ${error}`);
		}
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<button
				type="button"
				disabled={!ready}
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					if (!ready) return;
					e.preventDefault();
					setHovering(true);
				}}
				onDragLeave={() => setHovering(false)}
				onDrop={(e) => {
					e.preventDefault();
					setHovering(false);
					upload(e.dataTransfer.files[0]);
				}}
				style={{
					padding: "14px 12px",
					borderRadius: 8,
					border: `2px dashed ${hovering ? ACCENT_COLOR : BORDER_COLOR}`,
					backgroundColor: hovering ? "#fff6f1" : "#fafafa",
					color: SUB_TEXT_COLOR,
					fontSize: 12,
					fontFamily: "inherit",
					cursor: ready ? "pointer" : "not-allowed",
					textAlign: "center",
					opacity: ready ? 1 : 0.6,
				}}
			>
				{!ready
					? "上の「記事の名前」を入れると写真を追加できます"
					: photo
						? "写真を差し替える"
						: "ここに写真を落とすか、押して選ぶ"}
			</button>
			<input
				ref={inputRef}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				onChange={(e) => upload(e.target.files?.[0])}
				style={{ display: "none" }}
			/>
			{message && (
				<p style={{ fontSize: 11, color: failed ? ERROR_COLOR : SUB_TEXT_COLOR }}>{message}</p>
			)}
		</div>
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

	const updateAvatar = (patch: Partial<AvatarLayout>) =>
		onChange({ ...design, avatarLayout: { ...design.avatarLayout, ...patch } });

	const editedBones = Object.keys(design.pose);
	const command = `pnpm thumbnail --slug ${slug || "<記事の名前>"} --query ${JSON.stringify(thumbnailDesignToQuery(design).toString())}`;

	return (
		<div
			style={{
				padding: 20,
				backgroundColor: PANEL_BACKGROUND,
				borderTop: `1px solid ${BORDER_COLOR}`,
				color: TEXT_COLOR,
			}}
		>
			{/* 写真の置き場所も書き出し先もこの名前で決まるので、いちばん上に置く */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					marginBottom: 18,
					paddingBottom: 16,
					borderBottom: `1px solid ${BORDER_COLOR}`,
				}}
			>
				<span style={{ fontSize: 12, fontWeight: 700 }}>記事の名前</span>
				<input
					value={slug}
					placeholder="kanyou-shokubutsu"
					onChange={(e) => onSlugChange(e.target.value)}
					style={{ ...inputStyle, width: 240 }}
				/>
				<span style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
					写真の置き場所と書き出し先になります（public/blog/この名前/）
				</span>
			</div>

			<div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
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
						<PhotoPicker
							photo={design.photo}
							slug={slug}
							onPick={(photo) => onChange({ ...design, photo })}
						/>
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
						{/* 枠から溢れた分は切り落とされるので、見せたいところに寄せる */}
						<Row label="トリム 横">
							<input
								type="range"
								min={0}
								max={100}
								value={design.photoLayout.trimX}
								onChange={(e) => updateLayout({ trimX: Number(e.target.value) })}
								style={{ flex: 1 }}
							/>
							<span style={{ fontSize: 12, width: 38, textAlign: "right" }}>
								{design.photoLayout.trimX}%
							</span>
						</Row>
						<Row label="トリム 縦">
							<input
								type="range"
								min={0}
								max={100}
								value={design.photoLayout.trimY}
								onChange={(e) => updateLayout({ trimY: Number(e.target.value) })}
								style={{ flex: 1 }}
							/>
							<span style={{ fontSize: 12, width: 38, textAlign: "right" }}>
								{design.photoLayout.trimY}%
							</span>
						</Row>
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
							写真はプレビューでつまんで動かせます。右下の角で大きさを変えられます。
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
						{/* 大きくすると、はみ出した下半身はサムネイルの外に切れる */}
						<Row label="大きさ">
							<input
								type="range"
								min={0.3}
								max={3}
								step={0.01}
								value={design.avatarLayout.scale}
								onChange={(e) => updateAvatar({ scale: Number(e.target.value) })}
								style={{ flex: 1 }}
							/>
							<span style={{ fontSize: 12, width: 42, textAlign: "right" }}>
								{design.avatarLayout.scale.toFixed(2)}倍
							</span>
						</Row>
						<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
							<NumberField
								label="x"
								value={design.avatarLayout.x}
								onChange={(x) => updateAvatar({ x })}
							/>
							<NumberField
								label="y"
								value={design.avatarLayout.y}
								onChange={(y) => updateAvatar({ y })}
							/>
							<button
								type="button"
								onClick={() => onChange({ ...design, avatarLayout: DEFAULT_AVATAR_LAYOUT })}
								style={{ ...inputStyle, cursor: "pointer" }}
							>
								位置を戻す
							</button>
						</div>
						<p style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
							プレビューの「アバター」の札をつまむと動かせます。右下の角で大きさを変えられます。
						</p>
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
								style={disabledButtonStyle(!selectedBone || !design.pose[selectedBone])}
							>
								この骨を戻す
							</button>
							<button
								type="button"
								disabled={editedBones.length === 0}
								onClick={() => onChange({ ...design, pose: {} })}
								style={disabledButtonStyle(editedBones.length === 0)}
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
							骨を選んでプレビューの輪をドラッグすると回せます。ここの2つは、選んだ骨・
							全部の骨を回す前に戻すボタンです（まだ回していなければ押せません）。
						</p>
					</Section>

					<Section title="書き出す">
						<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
							<span style={{ fontSize: 11, color: SUB_TEXT_COLOR }}>
								{slug
									? `public/blog/${slug}/thumbnail.webp ができます`
									: "上の「記事の名前」を入れると書き出せます"}
							</span>
						</div>
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
		</div>
	);
}
