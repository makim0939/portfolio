/**
 * 時間帯ごとのプリセット。
 *
 * issue #35 の方針にあわせて、シームレスな補間ではなく朝/昼/夕/夜の
 * 4パターンを切り替える。背景色は globals.css 側に `:root[data-time="..."]`
 * として持たせ、3D側の光はここの `SCENE_LIGHTING` を使う。
 */

export const TIMES_OF_DAY = ["morning", "day", "evening", "night"] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export function isTimeOfDay(value: string | null): value is TimeOfDay {
	return value !== null && (TIMES_OF_DAY as readonly string[]).includes(value);
}

/** 朝5時〜、昼10時〜、夕16時〜、夜19時〜翌5時。 */
export const HOUR_BOUNDARIES = {
	morning: 5,
	day: 10,
	evening: 16,
	night: 19,
} as const;

export function getTimeOfDay(date: Date): TimeOfDay {
	const hour = date.getHours();
	if (hour >= HOUR_BOUNDARIES.night || hour < HOUR_BOUNDARIES.morning) return "night";
	if (hour >= HOUR_BOUNDARIES.evening) return "evening";
	if (hour >= HOUR_BOUNDARIES.day) return "day";
	return "morning";
}

/**
 * ハイドレーション前に <html data-time="..."> を確定させるためのインラインスクリプト。
 *
 * ページは静的生成なのでサーバ側では時刻が分からず、マウント後に設定すると
 * 初回描画で一瞬だけ既定値（昼）が見えてしまう。これを head で同期実行して防ぐ。
 * 判定の境界値は上の HOUR_BOUNDARIES から埋め込むので、二重管理にはならない。
 */
export function timeOfDayInitScript(): string {
	const { morning, day, evening, night } = HOUR_BOUNDARIES;
	return `(function(){try{
var q=new URLSearchParams(location.search).get("time");
var t=${JSON.stringify(TIMES_OF_DAY)}.indexOf(q)>=0?q:(function(){
var h=new Date().getHours();
return h>=${night}||h<${morning}?"night":h>=${evening}?"evening":h>=${day}?"day":"morning";})();
document.documentElement.dataset.time=t;
}catch(e){document.documentElement.dataset.time="day";}})();`;
}

export type SceneLighting = {
	/** 窓の外から差し込む日光（夜は月明かり）。 */
	sunColor: string;
	/**
	 * ライトの位置。ターゲットは原点なので、これがそのまま光の角度になる。
	 * 窓は x = 1.387 の壁にあるため、x は必ず正の値にしておくこと。
	 * 負にすると光が窓を通らず、壁に遮られて何も差し込まなくなる。
	 */
	sunPosition: [number, number, number];
	sunIntensity: number;
	ambientColor: string;
	ambientIntensity: number;
	/**
	 * 室内灯。夜は暖色の弱い灯りを低い位置に置き、寒色の環境光と対比させて
	 * 陰影とコントラストを稼ぐ。
	 */
	pointColor: string;
	pointPosition: [number, number, number];
	pointIntensity: number;
	/** 窓の向こうに置いてある板の色。昼は白飛び、夜は暗い空。 */
	skyColor: string;
	skyEmissive: string;
};

export const SCENE_LIGHTING: Record<TimeOfDay, SceneLighting> = {
	morning: {
		sunColor: "#ffd7a8",
		// 低めの朝日。これ以上寝かせると光が床を越えて画面外に抜けてしまうので、
		// 手前側の床に落ちるぎりぎりの角度にしている。
		sunPosition: [5.0, 3.2, -1.6],
		sunIntensity: 3.0,
		ambientColor: "#eef3ff",
		ambientIntensity: 0.8,
		pointColor: "#fff2e0",
		pointPosition: [0, 5, 1],
		pointIntensity: 9,
		skyColor: "#fff4e0",
		skyEmissive: "#ffe9c8",
	},
	day: {
		sunColor: "#fff4e2",
		sunPosition: [5.16, 2.88, -0.96],
		// 環境光を落として日光との差を広げ、床の光と影をはっきり出す。
		sunIntensity: 3.4,
		ambientColor: "#ffffff",
		ambientIntensity: 0.78,
		pointColor: "#ffffff",
		pointPosition: [0, 5, 1],
		pointIntensity: 9,
		skyColor: "#ffffff",
		skyEmissive: "#f8fff5",
	},
	evening: {
		sunColor: "#ff9d5c",
		// さらに低く、朝とは逆側から差す。
		sunPosition: [5.52, 1.56, 1.74],
		sunIntensity: 2.6,
		ambientColor: "#ffe4d0",
		ambientIntensity: 0.72,
		pointColor: "#ffe0bb",
		pointPosition: [0, 5, 1],
		pointIntensity: 8,
		skyColor: "#ffd0a0",
		skyEmissive: "#ffb070",
	},
	night: {
		sunColor: "#8fa6d8",
		sunPosition: [4.32, 3.96, -1.32],
		sunIntensity: 0.6,
		// やや寒色の環境光と暖色の室内灯を組み合わせる。
		// 環境光を落として室内灯を強めると陰影が硬くなりすぎるので、
		// 環境光は高めに保ったまま暖色を足して雰囲気を出す。
		ambientColor: "#aebcd8",
		ambientIntensity: 0.68,
		pointColor: "#ffca94",
		// 低い位置に置くと減衰が急になって顔に濃い影が出るため、天井寄りに置く。
		pointPosition: [0.1, 3.5, 0.5],
		pointIntensity: 11,
		skyColor: "#2b3a5c",
		skyEmissive: "#151d33",
	},
};
