/**
 * 部屋のオブジェクトが1つずつ降ってきて、床でバウンドしてから収まる出現アニメーション
 * （issue #41）のパラメータと曲線。
 */

/**
 * 出現アニメーションを個別に持たせるオブジェクト。この並びがそのまま落ちてくる順番。
 *
 * 部屋が組み上がっていく感じになるように、入れ物（壁・ラグ）→ 床に置く大物 →
 * その上や壁に付く小物、の順に並べてある。アバターは最後。
 */
export const DROP_IN_SEQUENCE = [
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
] as const;

export type DropInObjectKey = (typeof DROP_IN_SEQUENCE)[number];

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

/** 全部が出終わるまで約1.0秒。 */
export const DEFAULT_DROP_IN_PARAMS: DropInParams = {
	height: 0.4,
	fallDuration: 0.24,
	restitution: 0.2,
	stagger: 0.05,
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

/** オブジェクトごとの落下開始タイミング（再生開始からの秒数）。 */
export function dropInDelays(stagger: number): Record<DropInObjectKey, number> {
	const delays = {} as Record<DropInObjectKey, number>;
	DROP_IN_SEQUENCE.forEach((key, index) => {
		delays[key] = index * stagger;
	});
	return delays;
}
