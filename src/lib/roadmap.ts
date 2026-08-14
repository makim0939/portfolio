// ロードマップの元データは GitHub の Issue。サイト側にも一覧を持つと二重管理になって
// 必ずずれるので、公開する内容は enhancement ラベルの付いた Issue に一本化している。

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
 * Issue 本文を「文」と「箇条書き」に分ける。1本の文につなげると `[x]` や中黒が
 * 文中に紛れて読めなくなるので、カード側でリストとして組めるよう構造を保つ。
 * 箇条書きより後ろの段落は、カードに収まらないうえ Issue を開けば読めるので落とす。
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

/** 着手を表す情報が Issue に他にないので、アサイン済みの open を「制作中」とみなす。 */
function toStatus(issue: GitHubIssue): RoadmapStatus {
	if (issue.state === "closed") return "done";
	return issue.assignees.length > 0 ? "wip" : "todo";
}

export async function getRoadmapItems(): Promise<RoadmapItem[]> {
	const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&labels=${LABEL}&per_page=100&sort=created&direction=desc`;

	// 認証なしでも公開リポジトリは読めるが、その場合 IP あたり 60req/h に制限される。
	const token = process.env.GITHUB_TOKEN;

	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/vnd.github+json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			next: { revalidate: 3600 },
		});
		if (!res.ok) throw new Error(`Failed to fetch issues: ${res.status}`);

		const issues: GitHubIssue[] = await res.json();

		return issues
			.filter((issue) => !issue.pull_request)
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
		// ロードマップはサイトの主役ではないので、取得に失敗してもページごと落とさない。
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
