/**
 * アバターのモーション。
 *
 * 実体は avatar_prototype.glb に入っているアニメーションクリップで、
 * 元は Avatar.blend のアクション（3DCG/Scripts/Motion 参照）。
 *
 * いずれ画面上のクリックで切り替える予定だが、3Dの Canvas は本文の裏（-z-10）に
 * 敷いてあってクリックを拾えないため、今は `?motion=wave` のクエリで選ぶ。
 */

export const AVATAR_MOTIONS = ["pcwork", "wave"] as const;

export type AvatarMotion = (typeof AVATAR_MOTIONS)[number];

/** 何も指定がないときのモーション。椅子に座って PC を触っている状態。 */
export const DEFAULT_AVATAR_MOTION: AvatarMotion = "pcwork";

export function isAvatarMotion(value: string | null): value is AvatarMotion {
	return value !== null && (AVATAR_MOTIONS as readonly string[]).includes(value);
}

/** モーション名から glb のクリップ名へ。 */
export const AVATAR_MOTION_CLIPS = {
	pcwork: "PCWork",
	wave: "Waving_Mixamo",
} as const satisfies Record<AvatarMotion, string>;

export type ScenePlacement = {
	position: [number, number, number];
	rotation: [number, number, number];
};

/**
 * モーションごとのアバターの立ち位置。
 *
 * モーション自体はアバターの原点まわりの姿勢しか持っていないので、
 * 「どこで」その姿勢をとるかはここが決める。
 *
 * - `pcwork` … Portfolio2025-Room.blend の `Avatar` エンプティの値。椅子の上
 * - `wave` … 部屋の中央。glb のノード値そのままだと正面を向かないので Y 45度だけ回す
 */
export const AVATAR_PLACEMENTS: Record<AvatarMotion, ScenePlacement> = {
	pcwork: { position: [-0.587, 0.031, 0.715], rotation: [0, -0.4329, 0] },
	wave: { position: [0, 0, 0], rotation: [0, -Math.PI / 4, 0] },
};

/**
 * モーションごとの椅子の位置。
 *
 * - `pcwork` … Portfolio2025-Room.blend の `Chair`。座るために机から引き出した位置
 * - `wave` … アバターが座っていないので、机に収めた位置（部屋 glb の元の値）
 */
export const CHAIR_PLACEMENTS: Record<AvatarMotion, ScenePlacement> = {
	pcwork: { position: [-0.577, 0, 0.644], rotation: [0, -0.3976, 0] },
	wave: { position: [-0.45, 0, 0.802], rotation: [0, -0.814, 0] },
};
