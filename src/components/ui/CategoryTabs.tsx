"use client";

type CategoryTabsProps = {
	/** カテゴリの値と、タブに出す名前 */
	labels: Record<string, string>;
	/** 中身があるカテゴリだけ。押しても何も起きないタブを出さないため */
	available: string[];
	value: string;
	onChange: (value: string) => void;
};

export const ALL_CATEGORIES = "all";

export function CategoryTabs({ labels, available, value, onChange }: CategoryTabsProps) {
	const tabs = [ALL_CATEGORIES, ...Object.keys(labels).filter((key) => available.includes(key))];

	return (
		<ul className=" flex flex-wrap gap-2 ">
			{tabs.map((tab) => (
				<li key={tab}>
					<button
						type="button"
						onClick={() => onChange(tab)}
						aria-pressed={value === tab}
						className={` px-4 py-1.5 rounded-full border text-sm transition
							${
								value === tab
									? " bg-maki-black text-neutral-50 border-maki-black "
									: " bg-[var(--surface)] text-maki-gray hover:shadow-sm "
							} `}
					>
						{tab === ALL_CATEGORIES ? "すべて" : labels[tab]}
					</button>
				</li>
			))}
		</ul>
	);
}
