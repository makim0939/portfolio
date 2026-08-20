/**
 * コンタクトページのポストに投函する演出の寸法と時間。
 *
 * モデルは 3DCG リポジトリの `Objects/Post/Post.blend` が元で、書き出しは
 * `Scripts/Objects/Post.py`。ここの座標は書き出した glb に合わせてあるので、
 * モデルの寸法を変えたら両方を直す（部屋と Room.tsx の関係と同じ）。
 */

export const POST_GLB = "/post.glb";

/** 投函口の中心。glb の PostFlap の原点と同じ高さに合わせてある。 */
export const SLOT_MOUTH: [number, number, number] = [0, 0.92, 0.2];

/** 投函前の封筒が浮いている場所。ポストの左手前。 */
export const ENVELOPE_REST: [number, number, number] = [-0.34, 0.99, 0.3];

export const ENVELOPE_SIZE = { width: 0.17, height: 0.115, thickness: 0.005 } as const;

/*
	演出の時間割（秒）。

	送信を押した瞬間から始めるので、通信が速いときはこちらが遅れて終わる。
	1.1秒より長くすると、結果を読むのを演出が待たせることになる。
*/
export const TIMELINE = {
	/** 封筒が投函口まで飛ぶ */
	fly: [0.0, 0.55],
	/** ふたが開く */
	flapOpen: [0.42, 0.62],
	/** 封筒が吸い込まれて消える */
	swallow: [0.5, 0.68],
	/** ふたが閉じる */
	flapClose: [0.7, 0.92],
	/** ポストが揺れる */
	shake: [0.66, 1.05],
	total: 1.1,
} as const;

/** 失敗して封筒が戻ってくるときの時間割。行きより少しゆっくり */
export const RETURN_TIMELINE = {
	flapOpen: [0.0, 0.2],
	fly: [0.12, 0.85],
	flapClose: [0.5, 0.75],
	total: 0.9,
} as const;

/** 0..1 に正規化する。範囲の外は 0 か 1 で止まる */
export function progress(elapsed: number, [start, end]: readonly [number, number]): number {
	if (elapsed <= start) return 0;
	if (elapsed >= end) return 1;
	return (elapsed - start) / (end - start);
}

/** 行きも帰りも滑らかに */
export function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function easeOut(t: number): number {
	return 1 - (1 - t) ** 3;
}

/** 揺れて収まる。1周期あたり2往復で、指数で減衰させる */
export function damped(t: number): number {
	if (t <= 0 || t >= 1) return 0;
	return Math.sin(t * Math.PI * 4) * (1 - t) ** 2;
}
