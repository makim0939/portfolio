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
