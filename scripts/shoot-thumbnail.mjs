// サムネイルを画像に書き出すスクリプト。`pnpm thumbnail` で使う。
//
// 作業場のページ（/thumbnail-studio）をそのまま撮る。絵柄はページ側が持っているので、
// ここは「開く・待つ・切り取る」だけを受け持つ。
//
// あらかじめ別のターミナルで `pnpm dev` を動かしておく。

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const DEV_SERVER_URL = "https://localhost:3000";

/** 書き出す大きさ。src/lib/thumbnailDesign.ts と合わせている */
const THUMBNAIL_SIZE = { width: 1200, height: 630 };

/** webp にするときの画質。見た目が落ちない範囲でいちばん軽いあたり */
const WEBP_QUALITY = 0.92;

const USAGE = `
使い方:
  pnpm thumbnail --slug <記事のフォルダ名> --title "1行目|2行目" [その他]

  --slug      書き出し先。public/blog/<slug>/thumbnail.webp になる
  --title     大きく出す題名。| で改行する
  --subtitle  題名の下の一行
  --label     左上の丸いラベル
  --photo     右に貼る写真。public からのパス
  --motion    アバターのモーション（既定: wave）
  --time      モーションを止める時刻（秒）
  --out       書き出し先を直に指定する（--slug の代わり）
  --url       開発サーバのURL（既定: ${DEV_SERVER_URL}）
  --query     絵柄の指定をクエリのまま渡す（作業場の「書き出す」が使う）

ポーズと文字は ${DEV_SERVER_URL}/thumbnail-studio を開いて決められます。
決まると、そのまま貼れるコマンドが画面の下に出ます。
`;

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i += 2) {
		const flag = argv[i];
		if (!flag.startsWith("--")) return null;
		args[flag.slice(2)] = argv[i + 1] ?? "";
	}
	return args;
}

/**
 * png を webp に詰め直す。
 * 画像を扱う道具を別に入れなくて済むよう、開いているブラウザ自身に変換させている。
 */
async function toWebp(page, pngBuffer) {
	const base64 = await page.evaluate(
		async ({ png, quality }) => {
			const image = new Image();
			image.src = `data:image/png;base64,${png}`;
			await image.decode();

			const canvas = document.createElement("canvas");
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			canvas.getContext("2d").drawImage(image, 0, 0);

			return canvas.toDataURL("image/webp", quality).split(",")[1];
		},
		{ png: pngBuffer.toString("base64"), quality: WEBP_QUALITY },
	);

	return Buffer.from(base64, "base64");
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args || (!args.slug && !args.out)) {
		process.stdout.write(USAGE);
		process.exit(1);
	}

	const outPath = args.out ?? path.join("public", "blog", args.slug, "thumbnail.webp");
	const baseUrl = args.url ?? DEV_SERVER_URL;

	/*
		絵柄の指定はそのままページへ渡す。
		--query があればそれを使い、無ければ個別の指定を組み立てる。
		書き出し先を決める --slug などは絵柄に関わらないので混ぜない。
	*/
	const notDesign = ["out", "url", "query"];
	const query = args.query
		? new URLSearchParams(args.query)
		: new URLSearchParams(
				Object.entries(args).filter(([key, value]) => value && !notDesign.includes(key)),
			);

	const browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: THUMBNAIL_SIZE.width, height: THUMBNAIL_SIZE.height + 200 },
		// 開発サーバの証明書は自前のものなので、そのまま繋ぎにいく
		ignoreHTTPSErrors: true,
	});

	try {
		await page.goto(`${baseUrl}/thumbnail-studio?${query}`, { waitUntil: "domcontentloaded" });
	} catch {
		await browser.close();
		process.stderr.write(
			`${baseUrl} を開けませんでした。別のターミナルで pnpm dev を動かしてから、もう一度実行してください。\n`,
		);
		process.exit(1);
	}

	/*
		待ち時間で狙うと、読み込みの速さでポーズも絵の出来上がりもぶれる。
		3Dが描き終えた合図と、写真と書体が揃ったことを確かめてから撮る。
	*/
	await page.waitForFunction(
		() =>
			window.__thumbnailReady === true &&
			Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
		null,
		{ timeout: 30000 },
	);
	await page.evaluate(() => document.fonts.ready);

	// 開発中だけ出る印を消してから切り取る
	await page.addStyleTag({
		content: "nextjs-portal, #__next-build-watcher { display: none !important }",
	});

	const png = await page.locator("#thumbnail").screenshot({ type: "png" });
	const webp = await toWebp(page, png);
	await browser.close();

	await fs.mkdir(path.dirname(outPath), { recursive: true });
	await fs.writeFile(outPath, webp);

	const kb = Math.round(webp.byteLength / 1024);
	process.stdout.write(`${outPath} に書き出しました（${kb}KB）\n`);
	if (args.slug) {
		process.stdout.write(`記事の thumbnail には "${args.slug}/thumbnail.webp" と書きます\n`);
	}
}

main();
