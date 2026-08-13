import type { CSSProperties } from "react";

type RoadmapProgressProps = {
	done: number;
	total: number;
};

/**
 * 「これまでにどれだけ進んだか」を1本のバーで見せる。
 * バーは 0 から実際の割合まで伸びる（アニメーションは globals.css の
 * roadmap-progress-grow）。JS を持たせたくないので、幅は CSS 変数で渡している。
 */
export function RoadmapProgress({ done, total }: RoadmapProgressProps) {
	const percent = total === 0 ? 0 : Math.round((done / total) * 100);

	return (
		<div className=" w-full max-w-md ">
			<div className=" flex items-baseline justify-between mb-2 ">
				<p className=" text-sm text-maki-gray tracking-[0.06em] ">
					できたこと <span className=" text-maki-black font-semibold ">{done}</span> / {total}
				</p>
				<p className=" text-sm text-maki-gray tabular-nums ">{percent}%</p>
			</div>
			{/* 件数と割合は上のテキストで読めるので、バーは飾りとして読み上げから外す */}
			<div aria-hidden="true" className=" h-2 w-full rounded-full bg-neutral-200 overflow-hidden ">
				<div
					className=" h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300 animate-[roadmap-progress-grow_1.2s_ease-out] "
					style={{ "--roadmap-progress": `${percent}%`, width: `${percent}%` } as CSSProperties}
				/>
			</div>
		</div>
	);
}
