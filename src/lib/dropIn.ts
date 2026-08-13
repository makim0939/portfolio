/**
 * 部屋のオブジェクトが1つずつ降ってきて、床でバウンドしてから収まる出現アニメーション
 * （issue #41）のパラメータと曲線。
 *
 * 見た目の詰めをコードの編集なしでやれるように、数値は全部ここに寄せてある。
 * `/poc/drop-in` のパネルからこの値をいじって、イメージが決まったら
 * DEFAULT_DROP_IN_PARAMS と DEFAULT_DROP_IN_ORDER に焼き付ける想定。
 */

/** 出現アニメーションを個別に持たせるオブジェクト。値はパネルに出す表示名。 */
export const DROP_IN_OBJECT_LABELS = {
	walls: "壁と窓",
	rug: "ラグ",
	desk: "机",
	bed: "ベッド",
	shelf: "棚",
	stool: "スツール",
	synthesizer: "シンセ",
	chair: "椅子",
	monitor: "モニター",
	laptop: "ノートPC",
	guitar: "ギター",
	eucalyptus: "ユーカリ",
	wallClock: "掛け時計",
	avatar: "アバター",
} as const satisfies Record<string, string>;

export type DropInObjectKey = keyof typeof DROP_IN_OBJECT_LABELS;

export type DropInParams = {
	/** 落下を始める高さ。最終位置からの相対値（メートル）。 */
	height: number;
	/** 落ち切るまでの時間（秒）。重力加速度はこれと height から逆算する。 */
	fallDuration: number;
	/**
	 * 床に当たったときの反発係数。0 でバウンドなし、1 で元の高さまで戻る。
	 * 跳ね返る高さは height * restitution^2 になる。
	 */
	restitution: number;
	/** 隣り合うオブジェクトの落下開始をずらす間隔（秒）。0 で全部同時。 */
	stagger: number;
};

export const DEFAULT_DROP_IN_PARAMS: DropInParams = {
	height: 2.5,
	fallDuration: 0.42,
	restitution: 0.35,
	stagger: 0.12,
};

/**
 * 落下開始からの経過時間に対する、最終位置からの高さ。
 *
 * 前半は初速0の自由落下（h * (1 - p^2)）、後半は反発係数ぶんの速度で
 * 打ち上げた放物線。接続点で速度が -v から +restitution * v になるので、
 * 見た目が物理どおりのバウンドになる。バウンドは issue のイメージどおり一度だけ。
 *
 * @param elapsed そのオブジェクトの落下開始からの秒数。負なら出現前
 */
export function dropInOffset(elapsed: number, params: DropInParams): number {
	const { height, fallDuration, restitution } = params;
	if (elapsed <= 0) return height;

	// 自由落下。p = 経過 / 落下時間 として h(1 - p^2)
	if (elapsed < fallDuration) {
		const p = elapsed / fallDuration;
		return height * (1 - p * p);
	}

	// バウンド。頂点は height * restitution^2、滞空時間は落下時間の 2 * restitution 倍
	const bounceDuration = 2 * restitution * fallDuration;
	const t = elapsed - fallDuration;
	if (bounceDuration <= 0 || t >= bounceDuration) return 0;
	const p = t / bounceDuration;
	return height * restitution * restitution * 4 * p * (1 - p);
}

/** 1オブジェクトが落ち始めてから静止するまでの秒数。 */
export function dropInDuration(params: DropInParams): number {
	return params.fallDuration * (1 + 2 * params.restitution);
}

/** 出現の順番。 */
export const DROP_IN_ORDERS = ["layered", "topDown", "random"] as const;

export type DropInOrder = (typeof DROP_IN_ORDERS)[number];

export const DROP_IN_ORDER_LABELS: Record<DropInOrder, string> = {
	layered: "下から積む（壁 → 大物 → 小物）",
	topDown: "上から（小物 → 大物 → 壁）",
	random: "ランダム",
};

export const DEFAULT_DROP_IN_ORDER: DropInOrder = "layered";

/**
 * 「下から積む」順。部屋が組み上がっていく感じになるように、
 * 入れ物（壁・ラグ）→ 床に置く大物 → その上や壁に付く小物、の順に並べてある。
 */
const LAYERED_SEQUENCE: readonly DropInObjectKey[] = [
	"walls",
	"rug",
	"desk",
	"bed",
	"shelf",
	"stool",
	"synthesizer",
	"chair",
	"monitor",
	"laptop",
	"guitar",
	"eucalyptus",
	"wallClock",
	"avatar",
];

/** 再生ごとに違う並びが欲しいだけなので、乱数は再現できる軽いもので足りる。 */
function shuffle(keys: readonly DropInObjectKey[], seed: number): DropInObjectKey[] {
	const result = [...keys];
	let state = seed * 2654435761 + 1;
	for (let i = result.length - 1; i > 0; i--) {
		state = (state * 1103515245 + 12345) & 0x7fffffff;
		const j = state % (i + 1);
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function dropInSequence(order: DropInOrder, seed: number): DropInObjectKey[] {
	if (order === "topDown") return [...LAYERED_SEQUENCE].reverse();
	if (order === "random") return shuffle(LAYERED_SEQUENCE, seed);
	return [...LAYERED_SEQUENCE];
}

/** オブジェクトごとの落下開始タイミング（再生開始からの秒数）。 */
export function dropInDelays(
	order: DropInOrder,
	stagger: number,
	seed: number,
): Record<DropInObjectKey, number> {
	const sequence = dropInSequence(order, seed);
	const delays = {} as Record<DropInObjectKey, number>;
	sequence.forEach((key, index) => {
		delays[key] = index * stagger;
	});
	return delays;
}

/** 全部が静止し切るまでの秒数。パネルの表示用。 */
export function dropInTotalDuration(params: DropInParams): number {
	const lastDelay = (LAYERED_SEQUENCE.length - 1) * params.stagger;
	return lastDelay + dropInDuration(params);
}
