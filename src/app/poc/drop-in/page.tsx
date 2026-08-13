"use client";
/*
issue #41「3DCGの部屋の出現アニメーション」のイメージ合わせ用ページ。

トップページと同じ部屋・同じ照明のまま、落下の高さ・速さ・跳ね方・順番だけを
その場で変えられる。数値が決まったら src/lib/dropIn.ts の
DEFAULT_DROP_IN_PARAMS / DEFAULT_DROP_IN_ORDER に書き写して、
トップページの Canvas にも DropInProvider を挿す、という流れを想定している。

見た目を詰めるための場なので、このページ自体はリンクを張らず URL 直打ちで開く。
*/

import { DropInProvider } from "@/components/3d/DropIn";
import { MyCamera } from "@/components/3d/MyCamera";
import { RoomScene } from "@/components/3d/Scene";
import { Text } from "@/components/ui/Text";
import {
	AVATAR_APPEARANCES,
	AVATAR_APPEARANCE_LABELS,
	type AvatarAppearance,
	DEFAULT_AVATAR_APPEARANCE,
	DEFAULT_DROP_IN_ORDER,
	DEFAULT_DROP_IN_PARAMS,
	DROP_IN_OBJECT_LABELS,
	DROP_IN_ORDERS,
	DROP_IN_ORDER_LABELS,
	type DropInOrder,
	type DropInParams,
	dropInSequence,
	dropInTotalDuration,
} from "@/lib/dropIn";
import { SCENE_LIGHTING, TIMES_OF_DAY, type TimeOfDay } from "@/lib/timeOfDay";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";

const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
	morning: "朝",
	day: "昼",
	evening: "夕",
	night: "夜",
};

type SliderProps = {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	unit: string;
	hint: string;
	onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, unit, hint, onChange }: SliderProps) {
	return (
		<label className=" block ">
			<span className=" flex items-baseline justify-between text-sm ">
				<span>{label}</span>
				<span className=" tabular-nums text-maki-gray ">
					{value.toFixed(2)}
					{unit}
				</span>
			</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className=" w-full "
			/>
			<span className=" block text-xs text-maki-gray ">{hint}</span>
		</label>
	);
}

export default function DropInPocPage() {
	const [params, setParams] = useState<DropInParams>(DEFAULT_DROP_IN_PARAMS);
	const [order, setOrder] = useState<DropInOrder>(DEFAULT_DROP_IN_ORDER);
	const [appearance, setAppearance] = useState<AvatarAppearance>(DEFAULT_AVATAR_APPEARANCE);
	const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
	// 増やすと DropInProvider が作り直されて最初から再生される
	const [replayCount, setReplayCount] = useState(0);

	const update = (patch: Partial<DropInParams>) => {
		setParams((prev) => ({ ...prev, ...patch }));
		// パラメータを触ったら結果をすぐ見たいので、そのまま再生し直す
		setReplayCount((count) => count + 1);
	};

	const sequence = dropInSequence(order, replayCount);
	const total = dropInTotalDuration(params, appearance);

	return (
		<div className=" flex flex-col gap-8 lg:flex-row ">
			<div className=" lg:flex-1 ">
				<Text variant="h1" className=" mb-2 text-3xl ">
					出現アニメーション PoC
				</Text>
				<Text variant="small" className=" mb-4 text-maki-gray ">
					issue #41 のイメージ合わせ用。家具はひとつずつ落ちてきて床で一度バウンドし、
					アバターだけは同じ跳ね方でぴょこんと立ち上がります。
				</Text>
				<div className=" aspect-square w-full max-w-[32rem] overflow-hidden rounded-2xl border border-neutral-300 ">
					<Canvas shadows orthographic>
						<Suspense fallback={null}>
							<MyCamera />
							{/*
								DropInProvider は Canvas の内側に置くこと。
								react-three-fiber は別リコンサイラなので、外側の Provider は届かない。
							*/}
							<DropInProvider
								params={params}
								order={order}
								avatarAppearance={appearance}
								replayCount={replayCount}
							>
								<RoomScene lighting={SCENE_LIGHTING[timeOfDay]} rotation={[0, 0, 0]} />
							</DropInProvider>
						</Suspense>
					</Canvas>
				</div>
			</div>

			<div className=" flex flex-col gap-4 lg:w-80 ">
				<button
					type="button"
					onClick={() => setReplayCount((count) => count + 1)}
					className=" rounded-2xl border border-blue-400 bg-neutral-50 p-3 text-blue-600 "
				>
					▶ もう一度再生（{total.toFixed(1)}秒）
				</button>

				<Slider
					label="落下開始の高さ"
					value={params.height}
					min={0.2}
					max={6}
					step={0.1}
					unit="m"
					hint="最終位置からどれだけ上に出現するか"
					onChange={(height) => update({ height })}
				/>
				<Slider
					label="落下時間"
					value={params.fallDuration}
					min={0.1}
					max={1.5}
					step={0.02}
					unit="秒"
					hint="短いほど重く速く落ちる"
					onChange={(fallDuration) => update({ fallDuration })}
				/>
				<Slider
					label="バウンドの強さ"
					value={params.restitution}
					min={0}
					max={0.8}
					step={0.01}
					unit=""
					hint={`反発係数。跳ねる高さは ${(params.height * params.restitution ** 2).toFixed(2)}m`}
					onChange={(restitution) => update({ restitution })}
				/>
				<Slider
					label="オブジェクト間の間隔"
					value={params.stagger}
					min={0}
					max={0.5}
					step={0.01}
					unit="秒"
					hint="0 にすると全部同時に落ちる"
					onChange={(stagger) => update({ stagger })}
				/>

				<label className=" block text-sm ">
					<span className=" block mb-1 ">アバターの出し方</span>
					<select
						value={appearance}
						onChange={(event) => {
							setAppearance(event.target.value as AvatarAppearance);
							setReplayCount((count) => count + 1);
						}}
						className=" w-full rounded-lg border border-neutral-300 p-2 "
					>
						{AVATAR_APPEARANCES.map((value) => (
							<option key={value} value={value}>
								{AVATAR_APPEARANCE_LABELS[value]}
							</option>
						))}
					</select>
				</label>

				{appearance === "popUp" && (
					<>
						<Slider
							label="立ち上がりの時間"
							value={params.popUpDuration}
							min={0.2}
							max={1.5}
							step={0.05}
							unit="秒"
							hint="潰れた状態から伸び切って収まるまで"
							onChange={(popUpDuration) => update({ popUpDuration })}
						/>
						<Slider
							label="始まりの潰れ具合"
							value={params.popUpSquash}
							min={0.2}
							max={0.95}
							step={0.05}
							unit=""
							hint={`1 で潰さない。下げるほど漫画寄り。伸びすぎは ${((1 - params.popUpSquash) * 0.1 + 1).toFixed(2)}倍`}
							onChange={(popUpSquash) => update({ popUpSquash })}
						/>
					</>
				)}

				{appearance === "materialize" && (
					<Slider
						label="実体化の時間"
						value={params.materializeDuration}
						min={0.3}
						max={2.5}
						step={0.05}
						unit="秒"
						hint="足元から頭まで光が走り切るまで"
						onChange={(materializeDuration) => update({ materializeDuration })}
					/>
				)}

				<label className=" block text-sm ">
					<span className=" block mb-1 ">出現の順番</span>
					<select
						value={order}
						onChange={(event) => {
							setOrder(event.target.value as DropInOrder);
							setReplayCount((count) => count + 1);
						}}
						className=" w-full rounded-lg border border-neutral-300 p-2 "
					>
						{DROP_IN_ORDERS.map((value) => (
							<option key={value} value={value}>
								{DROP_IN_ORDER_LABELS[value]}
							</option>
						))}
					</select>
				</label>

				<label className=" block text-sm ">
					<span className=" block mb-1 ">時間帯（見え方の確認用）</span>
					<select
						value={timeOfDay}
						onChange={(event) => setTimeOfDay(event.target.value as TimeOfDay)}
						className=" w-full rounded-lg border border-neutral-300 p-2 "
					>
						{TIMES_OF_DAY.map((value) => (
							<option key={value} value={value}>
								{TIME_OF_DAY_LABELS[value]}
							</option>
						))}
					</select>
				</label>

				<div className=" text-xs text-maki-gray ">
					<span className=" block mb-1 ">落ちてくる順番</span>
					<ol className=" list-decimal pl-4 ">
						{sequence.map((key) => (
							<li key={key}>{DROP_IN_OBJECT_LABELS[key]}</li>
						))}
					</ol>
				</div>
			</div>
		</div>
	);
}
