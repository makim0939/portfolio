import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/** 記事のフォルダ名として安全な形だけ通す */
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** 画像として置けるもの。ここに無い形式は受け取らない */
const ALLOWED_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"];

/** 受け取る上限。サムネイル用の写真がこれを超えることはない */
const MAX_BYTES = 12 * 1024 * 1024;

/*
	作業場に落とした写真を public の下に置く。
	撮影はこのページをもう一度開いて撮るので、写真はURLで読める場所に無いと写らない。
	作るための道具なので、公開するサイトには出さない。
*/
export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return new NextResponse(null, { status: 404 });
	}

	const form = await request.formData();
	const slug = form.get("slug");
	const file = form.get("file");

	if (typeof slug !== "string" || !SAFE_SLUG.test(slug)) {
		return NextResponse.json(
			{ message: "先に記事の名前を入れてください（英小文字・数字・ハイフン）。" },
			{ status: 400 },
		);
	}
	if (!(file instanceof File)) {
		return NextResponse.json({ message: "写真が読み取れませんでした。" }, { status: 400 });
	}
	if (file.size > MAX_BYTES) {
		return NextResponse.json({ message: "写真が大きすぎます。" }, { status: 400 });
	}

	// 名前は最後の要素だけ見る。フォルダを遡る書き方を混ぜられないようにするため
	const baseName = path.basename(file.name).replace(/[^\w.-]/g, "_");
	const extension = path.extname(baseName).toLowerCase();
	if (!ALLOWED_EXTENSIONS.includes(extension)) {
		return NextResponse.json(
			{ message: `${ALLOWED_EXTENSIONS.join("・")} のどれかにしてください。` },
			{ status: 400 },
		);
	}

	const directory = path.join(process.cwd(), "public", "blog", slug);
	await fs.mkdir(directory, { recursive: true });
	await fs.writeFile(path.join(directory, baseName), Buffer.from(await file.arrayBuffer()));

	return NextResponse.json({ path: `/blog/${slug}/${baseName}` });
}
