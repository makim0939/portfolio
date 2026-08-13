// GitHub の Issue をそのままロードマップの元データとして使う（issue #42）。
// サイト側に別途ロードマップの一覧を持つと Issue と二重管理になって必ずずれるので、
// 公開する内容は enhancement ラベルの付いた Issue に一本化している。

export type RoadmapStatus = "wip" | "todo" | "done";

export type RoadmapItem = {
	number: number;
	title: string;
	/** Issue 本文。カードでは先頭だけ抜粋して使う */
	description: string;
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

/** カードの抜粋に使う本文の長さ */
const DESCRIPTION_LENGTH = 120;

function formatDate(iso: string): string {
	const date = new Date(iso);
	const yyyy = date.getFullYear();
	const mm = (date.getMonth() + 1).toString().padStart(2, "0");
	const dd = date.getDate().toString().padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

/**
 * Issue 本文はマークダウンなので、記号を落としてカード用の一文にする。
 * 見出しやリストの記号がそのまま出ると読めないため。
 */
function toDescription(body: string | null): string {
	if (!body) return "";
	const plain = body
		.replace(/```[\s\S]*?```/g, "") // コードブロックごと落とす
		.replace(/^#+\s*/gm, "")
		.replace(/^[-*]\s*/gm, "")
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // リンク・画像はテキストだけ残す
		.replace(/[*_`>|]/g, "")
		.replace(/\s+/g, " ")
		.trim();
	return plain.length > DESCRIPTION_LENGTH ? `${plain.slice(0, DESCRIPTION_LENGTH)}…` : plain;
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
				description: toDescription(issue.body),
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
