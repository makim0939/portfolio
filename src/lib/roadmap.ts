// GitHub の Issue をそのままロードマップの元データとして使う（issue #42）。
// サイト側に別途ロードマップの一覧を持つと Issue と二重管理になって必ずずれるので、
// 公開する内容は enhancement ラベルの付いた Issue に一本化している。

export type RoadmapStatus = "wip" | "todo" | "done";

/** Issue 本文の箇条書き1行。done はチェックボックス付きのときだけ入る */
export type RoadmapListItem = {
	text: string;
	done?: boolean;
};

export type RoadmapItem = {
	number: number;
	title: string;
	/** Issue 本文のうち、箇条書きが始まる前の文 */
	summary: string;
	/** Issue 本文の箇条書き。カードでは先頭数件だけ出す */
	items: RoadmapListItem[];
	status: RoadmapStatus;
	url: string;
	/** YYYY-MM-DD */
	createdAt: string;
	/** YYYY-MM-DD。done のときだけ入る */
	completedAt?: string;
};

type GitHubIssue = {
	number: number;
	title: string;
	body: string | null;
	state: "open" | "closed";
	html_url: string;
	created_at: string;
	closed_at: string | null;
	assignees: { login: string }[];
	/** Issues API は PR も返す。PR にだけこのキーが付く */
	pull_request?: unknown;
};

const OWNER = "makim0939";
const REPO = "portfolio";
const LABEL = "enhancement";

/** カードに出す本文（箇条書きの前）の長さ */
const SUMMARY_LENGTH = 100;

function formatDate(iso: string): string {
	const date = new Date(iso);
	const yyyy = date.getFullYear();
	const mm = (date.getMonth() + 1).toString().padStart(2, "0");
	const dd = date.getDate().toString().padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

/** 装飾のマークダウン記号を落として、そのまま出せるテキストにする */
function toPlainText(line: string): string {
	return line
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // リンク・画像はテキストだけ残す
		.replace(/[*_`>|]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Issue 本文を「文」と「箇条書き」に分けて読む。
 * 箇条書きを1本の文につなげると `[x]` や中黒が文中に紛れて読めなくなるので、
 * カード側でリストとして組めるよう、構造を保ったまま渡す。
 *
 * 箇条書きより後ろの段落は落とす。カードに収まる量を超えるうえ、
 * 続きは Issue を開けば読めるため。
 */
function parseBody(body: string | null): { summary: string; items: RoadmapListItem[] } {
	if (!body) return { summary: "", items: [] };

	const lines = body.replace(/```[\s\S]*?```/g, "").split(/\r?\n/); // コードブロックごと落とす
	const summaryLines: string[] = [];
	const items: RoadmapListItem[] = [];

	for (const raw of lines) {
		const line = raw.trim();
		if (!line) continue;
		if (/^#{1,6}\s/.test(line)) continue; // 見出しはカードでは使わない

		const list = line.match(/^(?:[-*+]|\d+\.)\s+(.*)$/);
		if (list) {
			const checkbox = list[1].match(/^\[([ xX])\]\s*(.*)$/);
			const text = toPlainText(checkbox ? checkbox[2] : list[1]);
			if (!text) continue; // 「- 」だけの空行は捨てる
			items.push(checkbox ? { text, done: checkbox[1].toLowerCase() === "x" } : { text });
			continue;
		}

		if (items.length === 0) summaryLines.push(toPlainText(line));
	}

	const summary = summaryLines.join(" ");
	return {
		summary: summary.length > SUMMARY_LENGTH ? `${summary.slice(0, SUMMARY_LENGTH)}…` : summary,
		items,
	};
}

/**
 * open な Issue のうち、担当者が付いているものを「制作中」とみなす。
 * 着手を表す情報が Issue 側に他にないため、アサインを着手の合図として使っている。
 * （自分にアサインすればサイト上で「いま作っているもの」に上がる）
 */
function toStatus(issue: GitHubIssue): RoadmapStatus {
	if (issue.state === "closed") return "done";
	return issue.assignees.length > 0 ? "wip" : "todo";
}

export async function getRoadmapItems(): Promise<RoadmapItem[]> {
	const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&labels=${LABEL}&per_page=100&sort=created&direction=desc`;

	// 公開リポジトリなので認証なしでも読めるが、その場合 IP あたり 60req/h に制限される。
	// トークンがある環境では使い、無い環境（ローカルなど）でも動くようにしている。
	const token = process.env.GITHUB_TOKEN;

	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/vnd.github+json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			next: { revalidate: 3600 }, // ISRでキャッシュ
		});
		if (!res.ok) throw new Error(`Failed to fetch issues: ${res.status}`);

		const issues: GitHubIssue[] = await res.json();

		return issues
			.filter((issue) => !issue.pull_request) // Issues API が混ぜてくる PR を除く
			.map((issue) => ({
				number: issue.number,
				title: issue.title,
				...parseBody(issue.body),
				status: toStatus(issue),
				url: issue.html_url,
				createdAt: formatDate(issue.created_at),
				completedAt: issue.closed_at ? formatDate(issue.closed_at) : undefined,
			}));
	} catch (e) {
		// ロードマップはサイトの主役ではないので、取得に失敗してもページごと落とさず
		// 空の状態で表示する。
		console.error("Failed to fetch roadmap items:", e);
		return [];
	}
}

export function filterByStatus(items: RoadmapItem[], status: RoadmapStatus): RoadmapItem[] {
	const filtered = items.filter((item) => item.status === status);
	// done は完了が新しい順、それ以外は Issue が新しい順（API の並びのまま）
	if (status !== "done") return filtered;
	return filtered.sort((a, b) => ((a.completedAt ?? "") < (b.completedAt ?? "") ? 1 : -1));
}
