// 記事の雛形を作るスクリプト。`pnpm new:post` で対話的に使う。
// frontmatter を毎回手で写すと項目の書き忘れやカテゴリの綴り違いが起きるので、
// 書き始めるまでの手順をここにまとめている。

import fs from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import readline from "node:readline";

const BLOG_CATEGORIES = {
	tech: "テック",
	dev: "開発日記",
	life: "生活",
};

const WORK_CATEGORIES = {
	software: "ソフトウェア",
	cg: "3DCG",
	illustration: "イラスト",
	music: "楽曲",
	cover: "弾いてみた",
};

const KINDS = {
	blog: {
		label: "ブログ",
		contentDir: path.join("src", "contents", "blog"),
		// 記事ごとに画像の置き場所を作る
		assetDir: path.join("public", "blog"),
		defaultSlugPrefix: "post",
	},
	works: {
		label: "制作物",
		contentDir: path.join("src", "contents", "works"),
		// 制作物は thumbnail/ と products/ に分けて置く決まりなので、作品ごとの場所は作らない
		assetDir: undefined,
		defaultSlugPrefix: "work",
	},
};

function today() {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = (now.getMonth() + 1).toString().padStart(2, "0");
	const dd = now.getDate().toString().padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

/** frontmatter の値として安全に置ける形にする */
function quote(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function exists(filePath) {
	return await fs
		.access(filePath)
		.then(() => true)
		.catch(() => false);
}

/**
 * 1行読む。readline/promises の question は、入力をパイプで流し込むと
 * 2問目以降を取りこぼすので、行のイテレータから読む。
 */
function createAsk(lines) {
	return async (question) => {
		stdout.write(question);
		const { value, done } = await lines.next();
		return done ? "" : value.trim();
	};
}

/** 空のまま進めない項目を訊く。既定値があれば、空の入力でそれを使う */
async function askRequired(ask, question, defaultValue) {
	while (true) {
		const answer = await ask(question);
		if (answer) return answer;
		if (defaultValue) return defaultValue;
		stdout.write("入力してください。\n");
	}
}

async function askChoice(ask, question, choices) {
	const keys = Object.keys(choices);
	while (true) {
		stdout.write(`${question}\n`);
		keys.forEach((key, index) => stdout.write(`  ${index + 1}) ${choices[key]}\n`));
		const chosen = keys[Number(await ask("番号: ")) - 1];
		if (chosen) return chosen;
		stdout.write("番号で選んでください。\n");
	}
}

function buildFrontmatter(entries) {
	const lines = entries
		.filter(([, value]) => value !== undefined && value !== "")
		.map(([key, value]) => `${key}: ${value}`);
	return `---\n${lines.join("\n")}\n---\n`;
}

function blogBody() {
	return `
## 見出し

ここから本文を書きます。
`;
}

function workBody() {
	return `
## 作品について

ここから本文を書きます。
`;
}

async function main() {
	const rl = readline.createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });
	const ask = createAsk(rl[Symbol.asyncIterator]());

	try {
		const kindKey = await askChoice(
			ask,
			"どれを追加しますか？",
			Object.fromEntries(Object.entries(KINDS).map(([key, kind]) => [key, kind.label])),
		);
		const kind = KINDS[kindKey];

		const title = await askRequired(ask, "タイトル: ");
		const date = await askRequired(ask, `日付 (${today()}): `, today());

		// 日本語のタイトルからは作れないので、URLに使う名前は別に訊く
		const defaultSlug = `${kind.defaultSlugPrefix}-${date.replace(/-/g, "")}`;
		let slug = "";
		while (!slug) {
			const answer = await askRequired(ask, `URLに使う名前 (${defaultSlug}): `, defaultSlug);
			if (!/^[a-z0-9][a-z0-9-]*$/.test(answer)) {
				stdout.write("英小文字・数字・ハイフンで書いてください。\n");
				continue;
			}
			if (await exists(path.join(kind.contentDir, `${answer}.mdx`))) {
				stdout.write("同じ名前の記事がすでにあります。\n");
				continue;
			}
			slug = answer;
		}

		const description = await ask("ひとこと説明 (任意): ");
		const tags = (await ask("タグ (任意、カンマ区切り): "))
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);

		const front = [
			["title", quote(title)],
			["description", description ? quote(description) : undefined],
			["slug", slug],
			["date", quote(date)],
		];

		if (kindKey === "blog") {
			front.push(["category", await askChoice(ask, "カテゴリ", BLOG_CATEGORIES)]);
		} else {
			const category = await askChoice(ask, "カテゴリ", WORK_CATEGORIES);
			front.push(["category", category]);
			// 楽曲・弾いてみたはYouTubeに置くことが多いので、そのときだけURLを訊く
			if (category === "music" || category === "cover") {
				const videoUrl = await ask("YouTubeのURL (任意): ");
				front.push(["videoUrl", videoUrl ? quote(videoUrl) : undefined]);
			}
		}

		if (tags.length > 0) front.push(["tags", `[${tags.map(quote).join(", ")}]`]);
		// 書き終わってから公開したいので、作った時点では下書きにしておく
		front.push(["published", "false"]);

		const contentPath = path.join(kind.contentDir, `${slug}.mdx`);

		await fs.mkdir(kind.contentDir, { recursive: true });
		await fs.writeFile(
			contentPath,
			buildFrontmatter(front) + (kindKey === "blog" ? blogBody() : workBody()),
			"utf8",
		);

		stdout.write("\n作成しました。\n");
		stdout.write(`  ${contentPath}\n`);

		if (kind.assetDir) {
			// 画像の置き場所は空だと git に残らないので、目印のファイルを置く
			const assetPath = path.join(kind.assetDir, slug);
			await fs.mkdir(assetPath, { recursive: true });
			await fs.writeFile(path.join(assetPath, ".gitkeep"), "", "utf8");

			stdout.write(`  ${assetPath}/  … 画像はここに置いて、frontmatter には\n`);
			stdout.write(`      thumbnail: "${slug}/ファイル名.png" のように書きます\n`);
		} else {
			stdout.write("\n画像は public/works/thumbnail、動画は public/works/products に置いて、\n");
			stdout.write("frontmatter に thumbnail・coverImage として書きます。\n");
		}

		stdout.write("\n書き終えたら published を true にすると公開されます。\n");
	} finally {
		rl.close();
	}
}

main();
