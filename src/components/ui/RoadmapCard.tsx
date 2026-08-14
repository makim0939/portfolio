import type { RoadmapItem, RoadmapListItem, RoadmapStatus } from "@/lib/roadmap";
import { tv } from "tailwind-variants";

/** カードに出す箇条書きの件数。これを超えた分は「ほか N 件」にまとめる */
const MAX_LIST_ITEMS = 3;

// 状態は色だけでなく、面の作り（実線か破線か）と印（●／✓）でも区別する。
// 色だけだと時間帯で背景色が変わったときに差が読み取りにくいため。
const card = tv({
	base: " group relative flex flex-col gap-2 h-full p-5 rounded-2xl bg-[var(--surface)] transition duration-200 hover:-translate-y-1 ",
	variants: {
		status: {
			wip: " border-2 border-amber-300 shadow-lg hover:shadow-xl ",
			todo: " border-2 border-dashed border-neutral-300 shadow-sm hover:shadow-lg ",
			done: " border-2 border-neutral-100 shadow-sm hover:shadow-md opacity-80 hover:opacity-100 ",
		},
	},
});

const badge = tv({
	base: " inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] tracking-[0.08em] ",
	variants: {
		status: {
			wip: " bg-amber-100 text-amber-800 ",
			todo: " bg-neutral-100 text-maki-gray ",
			done: " bg-emerald-100 text-emerald-800 ",
		},
	},
});

const statusLabel: Record<RoadmapStatus, string> = {
	wip: "いま作ってる",
	todo: "作りたい",
	done: "できた",
};

function StatusMark({ status }: { status: RoadmapStatus }) {
	if (status === "done") {
		return (
			<svg viewBox="0 0 12 12" width="10" height="10" role="img" aria-label="完了">
				<path
					d="M1.5 6.5 L4.5 9.5 L10.5 2.5"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}
	// 制作中だけ、点が脈打って「動いている」ことを見せる。
	return (
		<span className=" relative flex w-2 h-2 ">
			{status === "wip" && (
				<span className=" absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-75 animate-ping " />
			)}
			<span
				className={`relative inline-flex w-2 h-2 rounded-full ${
					status === "wip" ? "bg-amber-500" : "bg-neutral-400"
				}`}
			/>
		</span>
	);
}

/** 箇条書きの行頭の印。チェックボックス付きの行だけ、済／未が分かる形にする。 */
function ListMark({ done }: { done?: boolean }) {
	if (done === undefined) {
		return <span className=" mt-2 w-1 h-1 shrink-0 rounded-full bg-neutral-400 " />;
	}
	return (
		<span
			className={` mt-0.5 grid place-items-center w-3.5 h-3.5 shrink-0 rounded border ${
				done ? "bg-emerald-500 border-emerald-500 text-white" : "border-neutral-300"
			} `}
		>
			{done && (
				<svg viewBox="0 0 12 12" width="9" height="9" role="img" aria-label="完了">
					<path
						d="M2 6.5 L4.8 9 L10 3"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			)}
		</span>
	);
}

function ListItems({ items }: { items: RoadmapListItem[] }) {
	const shown = items.slice(0, MAX_LIST_ITEMS);
	const rest = items.length - shown.length;
	// 「ほか N 件」の字下げは行頭の印の幅に合わせる（中黒とチェックボックスで幅が違う）
	const restIndent = shown.some((listItem) => listItem.done !== undefined) ? "pl-[22px]" : "pl-3";

	return (
		<ul className=" space-y-1 text-sm text-neutral-600 ">
			{shown.map((listItem) => (
				<li key={listItem.text} className=" flex items-start gap-2 ">
					<ListMark done={listItem.done} />
					{/* 1件が長くても2行で止める。3件×2行がカードの取りうる最大 */}
					<span
						className={` line-clamp-2 ${listItem.done ? "text-neutral-400 line-through" : ""} `}
					>
						{listItem.text}
					</span>
				</li>
			))}
			{rest > 0 && <li className={` ${restIndent} text-[11px] text-maki-gray `}>ほか {rest} 件</li>}
		</ul>
	);
}

export function RoadmapCard({ item }: { item: RoadmapItem }) {
	const date = item.status === "done" ? item.completedAt : item.createdAt;

	return (
		<article className={card({ status: item.status })}>
			<div className=" flex items-center justify-between gap-2 ">
				<span className={badge({ status: item.status })}>
					<StatusMark status={item.status} />
					{statusLabel[item.status]}
				</span>
				{date && (
					<time dateTime={date} className=" text-[11px] text-maki-gray ">
						{date}
					</time>
				)}
			</div>

			{/* カード全体をリンクにする。中に他のリンクを置かないので、擬似要素で面を覆う */}
			<h3 className=" text-base font-semibold leading-relaxed ">
				<a
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					className=" before:absolute before:inset-0 before:rounded-2xl group-hover:text-blue-600 transition-colors "
				>
					{item.title}
				</a>
			</h3>

			{item.summary && (
				<p
					className={` text-sm text-neutral-600 leading-relaxed ${
						// 箇条書きが続くときは文を2行に抑えて、リストの居場所を空ける
						item.items.length > 0 ? "line-clamp-2" : "line-clamp-3"
					} `}
				>
					{item.summary}
				</p>
			)}

			{item.items.length > 0 && <ListItems items={item.items} />}

			<p className=" mt-auto pt-2 text-[11px] text-maki-gray ">
				Issue #{item.number}
				<span className=" ml-1 inline-block transition-transform group-hover:translate-x-1 ">
					→
				</span>
			</p>
		</article>
	);
}
